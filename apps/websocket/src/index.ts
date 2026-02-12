import dotenv from "dotenv";
import { WebSocket, WebSocketServer } from "ws";
import { createClient } from "redis";
import { randomUUID } from "crypto";
dotenv.config({ path: "../../.env" });

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", () => {});

redisClient.connect().catch(() => {});

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
  username: string;
}

const Users: User[] = [];

function generateUserId(): string {
  return randomUUID();
}

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket, Request) => {
  const userId = generateUserId();

  Users.push({ rooms: [], userId: userId, ws: socket, username: "Anonymous" });

  socket.on("message", async (data) => {
    try {
      const parsedData = JSON.parse(data as unknown as string);

      if (parsedData.type === "join_room") {
        const user = Users.find((e) => e.ws === socket);
        if (user) {
          if (parsedData.username) {
            user.username = parsedData.username;
          }
          
          if (!user.rooms.includes(parsedData.roomId)) {
            user.rooms.push(parsedData.roomId);

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

        try {
          const shapesKey = `room:${parsedData.roomId}:shapes`;
          if (!redisClient.isOpen) {
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

          socket.send(
            JSON.stringify({
              type: "room_joined",
              roomId: parsedData.roomId,
              shapes: shapes,
            })
          );

          const settingsKey = `room:${parsedData.roomId}:settings`;
          const settingsData = await redisClient.get(settingsKey);
          if (settingsData) {
            socket.send(
              JSON.stringify({
                type: "room_settings_updated",
                roomId: parsedData.roomId,
                settings: JSON.parse(settingsData),
              })
            );
          }
        } catch {
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

      if (parsedData.type === "room_settings_update") {
        const settingsKey = `room:${parsedData.roomId}:settings`;
        if (redisClient.isOpen) {
          try {
            await redisClient.set(settingsKey, JSON.stringify(parsedData.settings));
          } catch {
            // Settings not persisted when Redis fails
          }
        }
        broadcastToRoom(parsedData.roomId, {
          type: "room_settings_updated",
          roomId: parsedData.roomId,
          settings: parsedData.settings,
        });
      }

      if (parsedData.type === "user_update") {
        const user = Users.find((e) => e.ws === socket);
        if (user && user.rooms.includes(parsedData.roomId)) {
          if (parsedData.username) {
            user.username = parsedData.username;
          }
          broadcastToRoom(parsedData.roomId, {
            type: "user_updated",
            roomId: parsedData.roomId,
            userId: user.userId,
            clientId: parsedData.clientId,
            username: user.username,
          });
        }
      }

      if (parsedData.type === "cursor_move") {
        const user = Users.find((e) => e.ws === socket);
        if (user && user.rooms.includes(parsedData.roomId)) {
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
    } catch {
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Failed to process message",
        })
      );
    }
  });

  socket.on("close", () => {
    const userIndex = Users.findIndex((u) => u.ws === socket);
    if (userIndex !== -1) {
      const user = Users[userIndex];
      if (user) {
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

function getUsersInRoom(roomId: string): User[] {
  return Users.filter((user) => user.rooms.includes(roomId));
}

function broadcastToRoom(roomId: string, message: object, excludeSocket?: WebSocket) {
  const usersInRoom = getUsersInRoom(roomId);
  usersInRoom.forEach((user) => {
    if (user.ws.readyState === WebSocket.OPEN && user.ws !== excludeSocket) {
      user.ws.send(JSON.stringify(message));
    }
  });
}

async function handleShapeAdd(roomId: string, shape: unknown) {
  try {
    if (!redisClient.isOpen) {
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

    shapes.push(shape);

    await redisClient.set(shapesKey, JSON.stringify(shapes));

    broadcastToRoom(roomId, {
      type: "shape_added",
      roomId,
      shape,
    });
  } catch {
    broadcastToRoom(roomId, {
      type: "shape_added",
      roomId,
      shape,
    });
  }
}

async function handleShapeUpdate(roomId: string, shape: unknown) {
  try {
    if (!redisClient.isOpen) {
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

    const shapeWithId = shape as { id: string };
    const index = shapes.findIndex(
      (s: { id: string }) => s.id === shapeWithId.id
    );
    if (index !== -1) {
      shapes[index] = shape;
    } else {
      shapes.push(shape);
    }

    await redisClient.set(shapesKey, JSON.stringify(shapes));

    broadcastToRoom(roomId, {
      type: "shape_updated",
      roomId,
      shape,
    });
  } catch {
    broadcastToRoom(roomId, {
      type: "shape_updated",
      roomId,
      shape,
    });
  }
}

async function handleShapeRemove(roomId: string, shapeId: string) {
  try {
    if (!redisClient.isOpen) {
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

    const filteredShapes = shapes.filter(
      (s: { id: string }) => s.id !== shapeId
    );

    await redisClient.set(shapesKey, JSON.stringify(filteredShapes));

    broadcastToRoom(roomId, {
      type: "shape_removed",
      roomId,
      shapeId,
    });
  } catch {
    broadcastToRoom(roomId, {
      type: "shape_removed",
      roomId,
      shapeId,
    });
  }
}

async function handleShapesSync(roomId: string, shapes: unknown[]) {
  try {
    if (!redisClient.isOpen) {
      broadcastToRoom(roomId, {
        type: "shapes_synced",
        roomId,
        shapes,
      });
      return;
    }

    const shapesKey = `room:${roomId}:shapes`;

    await redisClient.set(shapesKey, JSON.stringify(shapes));

    broadcastToRoom(roomId, {
      type: "shapes_synced",
      roomId,
      shapes,
    });
  } catch {
    broadcastToRoom(roomId, {
      type: "shapes_synced",
      roomId,
      shapes,
    });
  }
}
