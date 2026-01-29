import dotenv from "dotenv";
import { WebSocket, WebSocketServer } from "ws";
import { createClient } from "redis";
import { randomUUID } from "crypto";
dotenv.config({ path: "../../.env" });

// Initialize Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err: Error) => {
  console.error("Redis Client Error:", err.message);
  console.warn("Make sure Redis is running. You can start it with: docker run -d -p 6379:6379 redis");
});

redisClient.on("connect", () => console.log("Redis Client Connected"));
redisClient.on("ready", () => console.log("Redis Client Ready"));

// Connect to Redis (non-blocking, will retry automatically)
redisClient.connect().catch((err: Error) => {
  console.error("Failed to connect to Redis:", err.message);
  console.warn("WebSocket server will continue but shape persistence won't work until Redis is available");
});

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
  username: string;
}

const Users: User[] = [];

// Generate a unique user ID for each connection (login-less service)
function generateUserId(): string {
  return randomUUID();
}

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket, Request) => {
  // Generate a unique user ID for this connection (login-less service)
  const userId = generateUserId();
  console.log(`New WebSocket connection: ${userId}`);

  // Username will be set when user joins a room
  Users.push({ rooms: [], userId: userId, ws: socket, username: "Anonymous" });

  socket.on("message", async (data) => {
    try {
      const parsedData = JSON.parse(data as unknown as string);

      if (parsedData.type === "join_room") {
        const user = Users.find((e) => e.ws === socket);
        if (user) {
          // Update username if provided
          if (parsedData.username) {
            user.username = parsedData.username;
          }
          
          if (!user.rooms.includes(parsedData.roomId)) {
            user.rooms.push(parsedData.roomId);
            
            // Notify other users in the room that someone joined
            broadcastToRoom(
              parsedData.roomId,
              {
                type: "user_joined",
                roomId: parsedData.roomId,
                userId: user.userId,
                username: user.username,
              },
              socket // Exclude the joining user
            );
          }
        }

        // Load existing shapes from Redis and send to the joining user
        try {
          const shapesKey = `room:${parsedData.roomId}:shapes`;
          // Check if Redis is connected
          if (!redisClient.isOpen) {
            console.warn("Redis not connected, sending empty shapes");
            socket.send(
              JSON.stringify({
                type: "room_joined",
                roomId: parsedData.roomId,
                shapes: [],
              })
            );
            return;
          }
          
          const shapesData = await redisClient.get(shapesKey);
          const shapes = shapesData ? JSON.parse(shapesData) : [];

          // Send initial shapes to the joining user
          socket.send(
            JSON.stringify({
              type: "room_joined",
              roomId: parsedData.roomId,
              shapes: shapes,
            })
          );
        } catch (error) {
          console.error("Error loading shapes from Redis:", error);
          // Still send room_joined with empty shapes so client can continue
          socket.send(
            JSON.stringify({
              type: "room_joined",
              roomId: parsedData.roomId,
              shapes: [],
            })
          );
        }
      }

      if (parsedData.type === "chat") {
        // Broadcast chat message to all users in the room (no database storage)
        Users.forEach((user) => {
          if (user.rooms.includes(parsedData.roomId)) {
            user.ws.send(
              JSON.stringify({
                type: "chat",
                roomId: parsedData.roomId,
                message: parsedData.message,
              })
            );
          }
        });
      }

      // Handle shape operations
      if (parsedData.type === "shape_add") {
        await handleShapeAdd(parsedData.roomId, parsedData.shape);
      }

      if (parsedData.type === "shape_update") {
        await handleShapeUpdate(parsedData.roomId, parsedData.shape);
      }

      if (parsedData.type === "shape_remove") {
        await handleShapeRemove(parsedData.roomId, parsedData.shapeId);
      }

      if (parsedData.type === "shapes_sync") {
        await handleShapesSync(parsedData.roomId, parsedData.shapes);
      }

      if (parsedData.type === "cursor_move") {
        const user = Users.find((e) => e.ws === socket);
        if (user && user.rooms.includes(parsedData.roomId)) {
          // Broadcast cursor movement to all users in the room
          broadcastToRoom(
            parsedData.roomId,
            {
              type: "cursor_moved",
              roomId: parsedData.roomId,
              userId: user.userId,
              clientId: parsedData.clientId,
              username: parsedData.username || user.username,
              x: parsedData.x,
              y: parsedData.y,
            },
          );
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Failed to process message",
        })
      );
    }
  });

  socket.on("close", () => {
    // Notify all rooms that user left, then remove user
    const userIndex = Users.findIndex((u) => u.ws === socket);
    if (userIndex !== -1) {
      const user = Users[userIndex];
      if (user) {
        // Notify all rooms the user was in
        user.rooms.forEach((roomId) => {
          broadcastToRoom(roomId, {
            type: "user_left",
            roomId,
            userId: user.userId,
          });
        });
        Users.splice(userIndex, 1);
      }
    }
  });
});

// Helper function to get all users in a room
function getUsersInRoom(roomId: string): User[] {
  return Users.filter((user) => user.rooms.includes(roomId));
}

// Helper function to broadcast message to all users in a room
function broadcastToRoom(roomId: string, message: object, excludeSocket?: WebSocket) {
  const usersInRoom = getUsersInRoom(roomId);
  usersInRoom.forEach((user) => {
    if (user.ws.readyState === WebSocket.OPEN && user.ws !== excludeSocket) {
      user.ws.send(JSON.stringify(message));
    }
  });
}

// Handle shape add
async function handleShapeAdd(roomId: string, shape: unknown) {
  try {
    if (!redisClient.isOpen) {
      console.warn("Redis not connected, shape not persisted but broadcasting");
      // Still broadcast even if Redis is down
      broadcastToRoom(roomId, {
        type: "shape_added",
        roomId,
        shape,
      });
      return;
    }

    const shapesKey = `room:${roomId}:shapes`;
    const shapesData = await redisClient.get(shapesKey);
    const shapes = shapesData ? JSON.parse(shapesData) : [];

    // Add the new shape
    shapes.push(shape);

    // Save back to Redis
    await redisClient.set(shapesKey, JSON.stringify(shapes));

    // Broadcast to all users in the room
    broadcastToRoom(roomId, {
      type: "shape_added",
      roomId,
      shape,
    });
  } catch (error) {
    console.error("Error adding shape:", error);
    // Still try to broadcast even if Redis fails
    broadcastToRoom(roomId, {
      type: "shape_added",
      roomId,
      shape,
    });
  }
}

// Handle shape update
async function handleShapeUpdate(roomId: string, shape: unknown) {
  try {
    if (!redisClient.isOpen) {
      console.warn("Redis not connected, shape not persisted but broadcasting");
      broadcastToRoom(roomId, {
        type: "shape_updated",
        roomId,
        shape,
      });
      return;
    }

    const shapesKey = `room:${roomId}:shapes`;
    const shapesData = await redisClient.get(shapesKey);
    const shapes = shapesData ? JSON.parse(shapesData) : [];

    // Find and update the shape
    const shapeWithId = shape as { id: string };
    const index = shapes.findIndex(
      (s: { id: string }) => s.id === shapeWithId.id
    );
    if (index !== -1) {
      shapes[index] = shape;
    } else {
      // If shape doesn't exist, add it
      shapes.push(shape);
    }

    // Save back to Redis
    await redisClient.set(shapesKey, JSON.stringify(shapes));

    // Broadcast to all users in the room
    broadcastToRoom(roomId, {
      type: "shape_updated",
      roomId,
      shape,
    });
  } catch (error) {
    console.error("Error updating shape:", error);
    broadcastToRoom(roomId, {
      type: "shape_updated",
      roomId,
      shape,
    });
  }
}

// Handle shape remove
async function handleShapeRemove(roomId: string, shapeId: string) {
  try {
    if (!redisClient.isOpen) {
      console.warn("Redis not connected, shape not persisted but broadcasting");
      broadcastToRoom(roomId, {
        type: "shape_removed",
        roomId,
        shapeId,
      });
      return;
    }

    const shapesKey = `room:${roomId}:shapes`;
    const shapesData = await redisClient.get(shapesKey);
    const shapes = shapesData ? JSON.parse(shapesData) : [];

    // Remove the shape
    const filteredShapes = shapes.filter(
      (s: { id: string }) => s.id !== shapeId
    );

    // Save back to Redis
    await redisClient.set(shapesKey, JSON.stringify(filteredShapes));

    // Broadcast to all users in the room
    broadcastToRoom(roomId, {
      type: "shape_removed",
      roomId,
      shapeId,
    });
  } catch (error) {
    console.error("Error removing shape:", error);
    broadcastToRoom(roomId, {
      type: "shape_removed",
      roomId,
      shapeId,
    });
  }
}

// Handle shapes sync (replace all shapes)
async function handleShapesSync(roomId: string, shapes: unknown[]) {
  try {
    if (!redisClient.isOpen) {
      console.warn("Redis not connected, shapes not persisted but broadcasting");
      broadcastToRoom(roomId, {
        type: "shapes_synced",
        roomId,
        shapes,
      });
      return;
    }

    const shapesKey = `room:${roomId}:shapes`;

    // Save all shapes to Redis
    await redisClient.set(shapesKey, JSON.stringify(shapes));

    // Broadcast to all users in the room
    broadcastToRoom(roomId, {
      type: "shapes_synced",
      roomId,
      shapes,
    });
  } catch (error) {
    console.error("Error syncing shapes:", error);
    broadcastToRoom(roomId, {
      type: "shapes_synced",
      roomId,
      shapes,
    });
  }
}
