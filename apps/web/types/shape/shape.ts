export type RectangleShape = {
  id: string;
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: string;
  fill: string;
};

export type Point = {
  x: number;
  y: number;
};

export type LineShape = {
  id: string;
  type: "line";
  points: Point[]; // start + end (for now)
};

// export type Shape = RectangleShape | LineShape;

export type ToolType =
  | "select"
  | "rect"
  | "line"
  | "pencil"
  | "rhombus"
  | "circle"
  | "hand"
  | "text"
  | "eraser"
  | "arrow";
