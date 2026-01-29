import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Shape =
  | { id: string; type: "rect"; x: number; y: number; w: number; h: number }
  | {
      id: string;
      type: "rhombus";
      top: { x: number; y: number };
      bottom: { x: number; y: number };
      left: { x: number; y: number };
      right: { x: number; y: number };
    }
  | { id: string; type: "pencil"; points: { x: number; y: number }[] }
  | {
      id: string;
      type: "line";
      startPoint: { x: number; y: number };
      endPoint: { x: number; y: number };
    }
  | {
      id: string;
      type: "arrow";
      startPoint: { x: number; y: number };
      endPoint: { x: number; y: number };
    }
  // ✅ NEW: CIRCLE
  | {
      id: string;
      type: "circle";
      cx: number;
      cy: number;
      r: number;
    }
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string; // 👈 REQUIRED
      w: number;
      h: number;
    };

export interface ToolController {
  onPointerDown(e: PointerEvent): void;
  onActivate?(canvas: HTMLCanvasElement): void;
  onDeactivate?(canvas: HTMLCanvasElement): void;
  onPointerMove(e: PointerEvent): void;
  onPointerUp(e: PointerEvent): void;
  onDoubleClick?(e: MouseEvent): void;
}
type CirclePayload = {
  roomId: number;
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  fill: string;
};
type RectanglePayload = {
  roomId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: string;
  fill: string;
};
