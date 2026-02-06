"use client";

import { Shape } from "../utils";
import { Point } from "@/types/shape/shape";

const HIT_TOLERANCE = 6; // pixels

export function hitTest(point: Point, shape: Shape): boolean {
  const rotation = shape.rotation ?? 0;
  let testPoint = point;
  if (rotation !== 0) {
    const bounds = getShapeBounds(shape);
    if (bounds) {
      const center = { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
      testPoint = rotatePoint(point, center, -rotation);
    }
  }

  switch (shape.type) {
    case "rect":
      return hitRect(testPoint, shape);
    case "circle":
      return hitCircle(testPoint, shape);
    case "text":
      return hitRect(testPoint, {
        x: shape.x,
        y: shape.y - shape.h,
        w: shape.w,
        h: shape.h,
      });
    case "line":
      return hitLine(testPoint, shape.startPoint, shape.endPoint);
    case "arrow":
      if (shape.controlPoint) {
        return hitQuadratic(
          testPoint,
          shape.startPoint,
          shape.controlPoint,
          shape.endPoint,
        );
      }
      return hitLine(testPoint, shape.startPoint, shape.endPoint);
    case "rhombus":
      return hitRhombus(testPoint, shape);
    case "pencil":
      return hitPencil(testPoint, shape.points);
    case "text":
      return hitRect(testPoint, {
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

function hitQuadratic(p: Point, a: Point, c: Point, b: Point): boolean {
  const steps = 20;
  let prev = a;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const q = quadraticAt(a, c, b, t);
    if (hitLine(p, prev, q)) return true;
    prev = q;
  }
  return false;
}

function rotatePoint(p: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function getShapeBounds(shape: Shape) {
  switch (shape.type) {
    case "rect":
      return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
    case "text":
      return {
        x: shape.x,
        y: shape.y - shape.h,
        w: shape.w,
        h: shape.h,
      };
    case "line":
      return {
        x: Math.min(shape.startPoint.x, shape.endPoint.x),
        y: Math.min(shape.startPoint.y, shape.endPoint.y),
        w: Math.abs(shape.startPoint.x - shape.endPoint.x),
        h: Math.abs(shape.startPoint.y - shape.endPoint.y),
      };
    case "arrow": {
      const points = [
        shape.startPoint,
        shape.endPoint,
        shape.controlPoint ?? shape.startPoint,
      ];
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      };
    }
    case "circle":
      return {
        x: shape.cx - shape.r,
        y: shape.cy - shape.r,
        w: shape.r * 2,
        h: shape.r * 2,
      };
    case "rhombus": {
      const xs = [shape.top.x!, shape.right.x!, shape.bottom.x!, shape.left.x!];
      const ys = [shape.top.y!, shape.right.y!, shape.bottom.y!, shape.left.y!];
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      };
    }
    case "pencil": {
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      };
    }
    default:
      return null;
  }
}

function quadraticAt(a: Point, c: Point, b: Point, t: number): Point {
  const mt = 1 - t;
  const x = mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x;
  const y = mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y;
  return { x, y };
}
