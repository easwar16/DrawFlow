import { Shape, ToolController } from "../utils";
import { useEditorStore } from "@/store/editor";
import CanvasManager from "../canvas/CanvasManager";
import { Point } from "@/types/shape/shape";
import { hitTest } from "../utils/hitTest";

export class SelectTool implements ToolController {
  private dragging = false;
  private dragStart!: Point;
  private isMarquee = false;
  private marqueeStart!: Point;
  private marqueeRect: {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null = null;
  private originalShapes = new Map<string, Shape>();
  private pointInRect(
    p: Point,
    r: { x: number; y: number; w: number; h: number },
  ) {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }
  private intersects(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ) {
    return !(
      a.x > b.x + b.w ||
      a.x + a.w < b.x ||
      a.y > b.y + b.h ||
      a.y + a.h < b.y
    );
  }
  private startMarquee(p: Point) {
    this.isMarquee = true;
    this.dragging = false;
    this.marqueeStart = p;
    this.marqueeRect = { x: p.x, y: p.y, w: 0, h: 0 };

    CanvasManager.getInstance().setSelectionRect(this.marqueeRect);
  }

  private moveShape(shape: Shape, dx: number, dy: number): Shape {
    switch (shape.type) {
      case "rect":
        return {
          ...shape,
          x: shape.x + dx,
          y: shape.y + dy,
        };

      case "line":
      case "arrow":
        return {
          ...shape,
          startPoint: {
            x: shape.startPoint.x + dx,
            y: shape.startPoint.y + dy,
          },
          endPoint: {
            x: shape.endPoint.x + dx,
            y: shape.endPoint.y + dy,
          },
        };
      case "rhombus":
        return {
          ...shape,
          top: {
            x: shape.top.x! + dx,
            y: shape.top.y! + dy,
          },
          right: {
            x: shape.right.x! + dx,
            y: shape.right.y! + dy,
          },
          bottom: {
            x: shape.bottom.x! + dx,
            y: shape.bottom.y! + dy,
          },
          left: {
            x: shape.left.x! + dx,
            y: shape.left.y! + dy,
          },
        };

      case "pencil":
        return {
          ...shape,
          points: shape.points.map((p) => ({
            x: p.x + dx,
            y: p.y + dy,
          })),
        };
      default:
        return shape;
    }
  }

  private isShapeInside(
    shapeBounds: { x: number; y: number; w: number; h: number },
    rect: { x: number; y: number; w: number; h: number },
  ) {
    return (
      shapeBounds.x >= rect.x &&
      shapeBounds.y >= rect.y &&
      shapeBounds.x + shapeBounds.w <= rect.x + rect.w &&
      shapeBounds.y + shapeBounds.h <= rect.y + rect.h
    );
  }

  onPointerDown(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    const { shapes, selectedShapeIds, setSelectedShapeIds } =
      useEditorStore.getState();

    const selectionBounds = cm.getCurrentSelectionBounds();

    // 1️⃣ GROUP DRAG (click INSIDE selection box)
    if (
      selectionBounds &&
      selectedShapeIds.length > 0 &&
      this.pointInRect(p, selectionBounds)
    ) {
      this.dragging = true;
      this.dragStart = p;

      this.originalShapes.clear();
      for (const id of selectedShapeIds) {
        const s = shapes.find((sh) => sh.id === id);
        if (s) this.originalShapes.set(id, structuredClone(s));
      }
      return;
    }

    // 2️⃣ SINGLE SHAPE DRAG
    for (const shape of [...shapes].reverse()) {
      if (hitTest(p, shape)) {
        setSelectedShapeIds([shape.id]);
        this.dragging = true;
        this.dragStart = p;

        this.originalShapes.clear();
        this.originalShapes.set(shape.id, structuredClone(shape));
        return;
      }
    }

    // 3️⃣ MARQUEE (EMPTY CANVAS ONLY)
    setSelectedShapeIds([]);
    this.startMarquee(p);
  }

  onPointerMove(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    // ✅ MARQUEE DRAG
    if (this.isMarquee && this.marqueeStart) {
      const x = Math.min(this.marqueeStart.x, p.x);
      const y = Math.min(this.marqueeStart.y, p.y);
      const w = Math.abs(p.x - this.marqueeStart.x);
      const h = Math.abs(p.y - this.marqueeStart.y);

      this.marqueeRect = { x, y, w, h };
      cm.setSelectionRect(this.marqueeRect);
      return;
    }

    // ✅ SHAPE / GROUP DRAG
    if (!this.dragging) return;

    const dx = p.x - this.dragStart.x;
    const dy = p.y - this.dragStart.y;

    const { selectedShapeIds, updateShape } = useEditorStore.getState();

    for (const id of selectedShapeIds) {
      const original = this.originalShapes.get(id);
      if (!original) continue;

      updateShape(id, () => this.moveShape(original, dx, dy));
    }
  }

  onPointerUp() {
    const cm = CanvasManager.getInstance();

    // ✅ COMMIT MARQUEE SELECTION
    if (this.isMarquee && this.marqueeRect) {
      const { shapes, setSelectedShapeIds } = useEditorStore.getState();

      const selected: string[] = [];

      for (const shape of shapes) {
        const bounds = cm["getShapeBounds"](shape);
        if (!bounds) continue;

        // Excalidraw-style: intersection, not full containment
        if (this.intersects(bounds, this.marqueeRect)) {
          selected.push(shape.id);
        }
      }

      setSelectedShapeIds(selected);
    }

    // ✅ CLEANUP
    this.dragging = false;
    this.isMarquee = false;
    this.marqueeRect = null;
    this.originalShapes.clear();

    cm.setSelectionRect(null);
  }
}
