import { Shape } from "../utils";
import { Point } from "@/types/shape/shape";

const HIT_TOLERANCE = 6; // pixels

export function hitTest(point: Point, shape: Shape): boolean {
  switch (shape.type) {
    case "rect":
      return hitRect(point, shape);
    case "circle":
      return hitCircle(point, shape);
    case "text":
      return hitRect(point, {
        x: shape.x,
        y: shape.y - shape.h,
        w: shape.w,
        h: shape.h,
      });
    case "line":
    case "arrow":
      return hitLine(point, shape.startPoint, shape.endPoint);
    case "rhombus":
      return hitRhombus(point, shape);
    case "pencil":
      return hitPencil(point, shape.points);
    case "text":
      return hitRect(point, {
        x: shape.x,
        y: shape.y - shape.h,
        w: shape.w,
        h: shape.h,
      });
    default:
      return false;
  }
}
function hitCircle(
  p: Point,
  c: { cx: number; cy: number; r: number },
): boolean {
  const dx = p.x - c.cx;
  const dy = p.y - c.cy;
  const distance = Math.hypot(dx, dy);

  return distance <= c.r + HIT_TOLERANCE;
}

function hitRhombus(
  p: Point,
  shape: {
    top: Point;
    right: Point;
    bottom: Point;
    left: Point;
  },
): boolean {
  const polygon = [shape.top, shape.right, shape.bottom, shape.left];

  // 🔹 Fast bounding-box reject (performance)
  const xs = polygon.map((pt) => pt.x);
  const ys = polygon.map((pt) => pt.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  if (
    p.x < minX - HIT_TOLERANCE ||
    p.x > maxX + HIT_TOLERANCE ||
    p.y < minY - HIT_TOLERANCE ||
    p.y > maxY + HIT_TOLERANCE
  ) {
    return false;
  }

  return pointInPolygon(p, polygon);
}
function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const { x, y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.x;
    const yi = polygon[i]!.y;
    const xj = polygon[j]!.x;
    const yj = polygon[j]!.y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function hitRect(p: Point, r: { x: number; y: number; w: number; h: number }) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}
function hitPencil(p: Point, points: Point[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    if (hitLine(p, points[i]!, points[i + 1]!)) {
      return true;
    }
  }
  return false;
}
function hitLine(p: Point, a: Point, b: Point): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return false;

  // projection factor
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;

  if (t < 0 || t > 1) return false;

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;

  const distance = Math.hypot(p.x - projX, p.y - projY);

  return distance <= HIT_TOLERANCE;
}
