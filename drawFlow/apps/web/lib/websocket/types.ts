import { Shape } from "../utils";

// Client → Server message types
export type ClientMessage =
  | { type: "join_room"; roomId: string; username: string }
  | { type: "shape_add"; roomId: string; shape: Shape }
  | { type: "shape_update"; roomId: string; shape: Shape }
  | { type: "shape_remove"; roomId: string; shapeId: string }
  | { type: "shapes_sync"; roomId: string; shapes: Shape[] }
  | {
      type: "user_update";
      roomId: string;
      username: string;
      clientId: string;
    }
  | {
      type: "cursor_move";
      roomId: string;
      x: number;
      y: number;
      username: string;
      clientId: string;
    };

// Server → Client message types
export type ServerMessage =
  | { type: "room_joined"; roomId: string; shapes: Shape[] }
  | { type: "shape_added"; roomId: string; shape: Shape }
  | { type: "shape_updated"; roomId: string; shape: Shape }
  | { type: "shape_removed"; roomId: string; shapeId: string }
  | { type: "shapes_synced"; roomId: string; shapes: Shape[] }
  | {
      type: "cursor_moved";
      roomId: string;
      userId: string;
      clientId: string;
      username: string;
      x: number;
      y: number;
    }
  | {
      type: "user_updated";
      roomId: string;
      userId: string;
      clientId: string;
      username: string;
    }
  | { type: "user_joined"; roomId: string; userId: string; username: string }
  | { type: "user_left"; roomId: string; userId: string }
  | { type: "error"; message: string };

// Cursor position type
export type CursorPosition = {
  userId: string;
  username: string;
  x: number;
  y: number;
  lastSeen: number; // timestamp for cleanup
};
