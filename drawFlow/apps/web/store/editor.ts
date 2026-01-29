import { create } from "zustand";
import { Shape } from "../lib/utils";
import { ToolType } from "@/types/shape/shape";
import { saveShapes, loadShapes } from "../lib/storage";
import { wsManager } from "../lib/websocket/websocket";
import { ServerMessage, CursorPosition } from "../lib/websocket/types";

const cloneShapes = (shapes: Shape[]) =>
  typeof structuredClone === "function"
    ? structuredClone(shapes)
    : JSON.parse(JSON.stringify(shapes));

type EditorState = {
  // domain
  shapes: Shape[];
  roomId: string | null;
  past: Shape[][];
  future: Shape[][];

  // interaction
  currentTool: ToolType;
  selectedShapeIds: string[];
  cursors: Map<string, CursorPosition>; // userId -> cursor position

  // actions
  setRoomId: (id: string | null) => void;
  setShapes: (shapes: Shape[]) => void;
  setTool: (tool: ToolType) => void;

  setSelectedShapeIds: (ids: string[]) => void;
  toggleSelectedShape: (id: string) => void;

  addShape: (shape: Shape) => void;
  updateShape: (id: string, updater: (shape: Shape) => Shape) => void;
  removeShape: (id: string) => void;
  undo: () => void;
  redo: () => void;
  loadShapesFromStorage: () => void;
  connectWebSocket: (roomId: string) => Promise<void>;
  disconnectWebSocket: () => void;
  updateCursor: (userId: string, username: string, x: number, y: number) => void;
  removeCursor: (userId: string) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  // domain
  shapes: [],
  roomId: null,
  past: [],
  future: [],

  // interaction
  currentTool: "select",
  selectedShapeIds: [],
  cursors: new Map<string, CursorPosition>(),

  // actions

  setSelectedShapeIds: (ids: string[]) => set({ selectedShapeIds: ids }),

  toggleSelectedShape: (id: string) =>
    set((state) => ({
      selectedShapeIds: state.selectedShapeIds.includes(id)
        ? state.selectedShapeIds.filter((sid) => sid !== id)
        : [...state.selectedShapeIds, id],
    })),
  setRoomId: (id) => {
    set({ roomId: id });
    // Disconnect WebSocket if roomId is cleared
    if (id === null) {
      wsManager.disconnect();
    }
  },

  setShapes: (shapes) =>
    set((state) => {
      const newShapes = cloneShapes(shapes);
      // Save to localStorage only when not in a room
      if (state.roomId === null) {
        saveShapes(newShapes);
      } else {
        // Sync to WebSocket when in a room
        wsManager.send({
          type: "shapes_sync",
          roomId: state.roomId,
          shapes: newShapes,
        });
      }
      return {
        past: [...state.past, cloneShapes(state.shapes)],
        future: [],
        shapes: newShapes,
        selectedShapeIds: [],
      };
    }),

  setTool: (tool) => set({ currentTool: tool }),
  removeShape: (id: string) =>
    set((state) => {
      const newShapes = state.shapes.filter((s) => s.id !== id);
      // Save to localStorage only when not in a room
      if (state.roomId === null) {
        saveShapes(newShapes);
      } else {
        // Send remove message to WebSocket
        wsManager.send({
          type: "shape_remove",
          roomId: state.roomId,
          shapeId: id,
        });
      }
      return {
        past: [...state.past, cloneShapes(state.shapes)],
        future: [],
        shapes: newShapes,
        selectedShapeIds: state.selectedShapeIds.filter((sid) => sid !== id),
      };
    }),

  addShape: (shape) =>
    set((state) => {
      const newShapes = [...state.shapes, shape];
      // Save to localStorage only when not in a room
      if (state.roomId === null) {
        saveShapes(newShapes);
      } else {
        // Send add message to WebSocket
        wsManager.send({
          type: "shape_add",
          roomId: state.roomId,
          shape: shape,
        });
      }
      return {
        past: [...state.past, cloneShapes(state.shapes)],
        future: [],
        shapes: newShapes,
      };
    }),

  updateShape: (id, updater) =>
    set((state) => {
      const newShapes = state.shapes.map((shape) =>
        shape.id === id ? updater(shape) : shape,
      );
      const updatedShape = newShapes.find((s) => s.id === id);
      // Save to localStorage only when not in a room
      if (state.roomId === null) {
        saveShapes(newShapes);
      } else if (updatedShape) {
        // Send update message to WebSocket
        wsManager.send({
          type: "shape_update",
          roomId: state.roomId,
          shape: updatedShape,
        });
      }
      return {
        past: [...state.past, cloneShapes(state.shapes)],
        future: [],
        shapes: newShapes,
      };
    }),
  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1]!;
      const newShapes = cloneShapes(previous);
      // Save to localStorage only when not in a room
      if (state.roomId === null) {
        saveShapes(newShapes);
      }
      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [cloneShapes(state.shapes), ...state.future],
        shapes: newShapes,
        selectedShapeIds: [],
      };
    }),
  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0]!;
      const newShapes = cloneShapes(next);
      // Save to localStorage only when not in a room
      if (state.roomId === null) {
        saveShapes(newShapes);
      }
      return {
        ...state,
        past: [...state.past, cloneShapes(state.shapes)],
        future: state.future.slice(1),
        shapes: newShapes,
        selectedShapeIds: [],
      };
    }),
  loadShapesFromStorage: () =>
    set((state) => {
      // Only load from storage if not in a room
      if (state.roomId !== null) return state;
      const loaded = loadShapes();
      if (loaded && Array.isArray(loaded) && loaded.length > 0) {
        // Validate shapes have required properties
        const validShapes = loaded.filter(
          (shape): shape is Shape =>
            typeof shape === "object" &&
            shape !== null &&
            "id" in shape &&
            "type" in shape &&
            typeof (shape as { id: unknown }).id === "string" &&
            typeof (shape as { type: unknown }).type === "string",
        );
        if (validShapes.length > 0) {
          return {
            ...state,
            shapes: validShapes as Shape[],
            past: [],
            future: [],
          };
        }
      }
      return state;
    }),
  connectWebSocket: async (roomId: string) => {
    try {
      await wsManager.connect(roomId);

      // Set up message handler
      wsManager.onMessage((message: ServerMessage) => {
        const state = useEditorStore.getState();

        switch (message.type) {
        case "room_joined":
          // When joining a room, prefer existing room shapes.
          // If the room is empty but we already have local shapes,
          // push our local shapes up to the room instead of clearing them.
          if (message.roomId === roomId) {
            if (message.shapes.length > 0) {
              useEditorStore.setState({
                shapes: message.shapes,
                past: [],
                future: [],
              });
            } else if (state.shapes.length > 0) {
              // Keep local shapes and sync them to the room
              wsManager.send({
                type: "shapes_sync",
                roomId: message.roomId,
                shapes: state.shapes,
              });
              useEditorStore.setState({
                past: [],
                future: [],
              });
            } else {
              // Both empty: keep empty state and reset history
              useEditorStore.setState({
                shapes: [],
                past: [],
                future: [],
              });
            }
          }
          break;

          case "shape_added":
            // Add shape if not already present (avoid duplicates from our own actions)
            if (message.roomId === state.roomId) {
              const exists = state.shapes.some((s) => s.id === message.shape.id);
              if (!exists) {
                useEditorStore.setState({
                  shapes: [...state.shapes, message.shape],
                });
              }
            }
            break;

          case "shape_updated":
            // Update shape if it exists
            if (message.roomId === state.roomId) {
              useEditorStore.setState({
                shapes: state.shapes.map((s) =>
                  s.id === message.shape.id ? message.shape : s
                ),
              });
            }
            break;

          case "shape_removed":
            // Remove shape if it exists
            if (message.roomId === state.roomId) {
              useEditorStore.setState({
                shapes: state.shapes.filter((s) => s.id !== message.shapeId),
                selectedShapeIds: state.selectedShapeIds.filter(
                  (id) => id !== message.shapeId
                ),
              });
            }
            break;

          case "shapes_synced":
            // Replace all shapes (full sync)
            if (message.roomId === state.roomId) {
              useEditorStore.setState({
                shapes: message.shapes,
              });
            }
            break;

        case "cursor_moved":
          // Update cursor position for a user
          if (message.roomId === state.roomId) {
            const selfId =
              typeof window !== "undefined"
                ? sessionStorage.getItem("drawflow:cursorId")
                : null;
            if (selfId && message.clientId === selfId) {
              break;
            }
            const newCursors = new Map(state.cursors);
            const cursorKey = message.clientId || message.userId;
            newCursors.set(cursorKey, {
              userId: cursorKey,
              username: message.username,
              x: message.x,
              y: message.y,
              lastSeen: Date.now(),
            });
            useEditorStore.setState({ cursors: newCursors });
          }
          break;

          case "user_joined":
            // User joined the room (we'll get their cursor when they move it)
            if (message.roomId === state.roomId) {
              console.log(`User ${message.username} joined the room`);
            }
            break;

          case "user_left":
            // Remove cursor when user leaves
            if (message.roomId === state.roomId) {
              const newCursors = new Map(state.cursors);
              newCursors.delete(message.userId);
              useEditorStore.setState({ cursors: newCursors });
            }
            break;

          case "error":
            console.error("WebSocket error:", message.message);
            break;
        }
      });
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  },
  disconnectWebSocket: () => {
    wsManager.disconnect();
    // Clear cursors on disconnect
    useEditorStore.setState({ cursors: new Map() });
  },
  updateCursor: (userId: string, username: string, x: number, y: number) => {
    set((state) => {
      const newCursors = new Map(state.cursors);
      newCursors.set(userId, {
        userId,
        username,
        x,
        y,
        lastSeen: Date.now(),
      });
      return { cursors: newCursors };
    });
  },
  removeCursor: (userId: string) => {
    set((state) => {
      const newCursors = new Map(state.cursors);
      newCursors.delete(userId);
      return { cursors: newCursors };
    });
  },
}));
