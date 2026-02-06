import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ShapeStyle = {
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  opacity?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  sloppiness?: 0 | 1 | 2;
  edgeStyle?: "sharp" | "round";
  rotation?: number;
};

export const DEFAULT_SHAPE_STYLE = {
  stroke: "#000000",
  fill: "transparent",
  strokeWidth: 1,
  opacity: 1,
  strokeStyle: "solid" as const,
  sloppiness: 0 as const,
  edgeStyle: "sharp" as const,
  rotation: 0,
};

export type Shape =
  | ({
      id: string;
      type: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
    } & ShapeStyle)
  | ({
      id: string;
      type: "rhombus";
      top: { x: number; y: number };
      bottom: { x: number; y: number };
      left: { x: number; y: number };
      right: { x: number; y: number };
    } & ShapeStyle)
  | ({ id: string; type: "pencil"; points: { x: number; y: number }[] } & ShapeStyle)
  | ({
      id: string;
      type: "line";
      startPoint: { x: number; y: number };
      endPoint: { x: number; y: number };
    } & ShapeStyle)
  | ({
      id: string;
      type: "arrow";
      startPoint: { x: number; y: number };
      endPoint: { x: number; y: number };
      controlPoint?: { x: number; y: number };
    } & ShapeStyle)
  | ({
      id: string;
      type: "circle";
      cx: number;
      cy: number;
      r: number;
    } & ShapeStyle)
  | ({
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      w: number;
      h: number;
    } & ShapeStyle);

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
