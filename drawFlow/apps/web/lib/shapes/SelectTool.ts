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

  onDeactivate() {
    this.dragging = false;
    this.isMarquee = false;
    this.marqueeRect = null;
    CanvasManager.getInstance().setSelectionRect(null);
  }

  // -----------------------------
  // Pointer Down
  // -----------------------------
  onPointerDown(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    const { shapes, selectedShapeIds, setSelectedShapeIds } =
      useEditorStore.getState();

    // 🔼 find topmost hit
    for (const shape of [...shapes].reverse()) {
      if (!hitTest(p, shape)) continue;

      const alreadySelected = selectedShapeIds.includes(shape.id);

      // ✅ click inside selection → drag all
      if (alreadySelected) {
        this.dragging = true;
        this.dragStart = p;
        return;
      }

      // ✅ new selection
      setSelectedShapeIds(
        e.shiftKey ? [...selectedShapeIds, shape.id] : [shape.id],
      );

      this.dragging = true;
      this.dragStart = p;
      return;
    }

    // 🟥 empty canvas → marquee
    this.dragging = false;

    if (!e.shiftKey) {
      setSelectedShapeIds([]);
    }

    this.startMarquee(p);
  }

  // -----------------------------
  // Pointer Move
  // -----------------------------
  onPointerMove(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    // 🟦 marquee
    if (this.isMarquee && this.marqueeStart) {
      const x = Math.min(this.marqueeStart.x, p.x);
      const y = Math.min(this.marqueeStart.y, p.y);
      const w = Math.abs(p.x - this.marqueeStart.x);
      const h = Math.abs(p.y - this.marqueeStart.y);

      this.marqueeRect = { x, y, w, h };
      cm.setSelectionRect(this.marqueeRect);
      return;
    }

    if (!this.dragging) return;

    const dx = p.x - this.dragStart.x;
    const dy = p.y - this.dragStart.y;
    this.dragStart = p;

    const { selectedShapeIds, updateShape } = useEditorStore.getState();

    // 🔥 MOVE ALL SELECTED SHAPES
    for (const id of selectedShapeIds) {
      updateShape(id, (shape) => {
        switch (shape.type) {
          case "rect":
          case "text":
            return { ...shape, x: shape.x + dx, y: shape.y + dy };

          case "circle":
            return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };

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
              top: { x: shape.top.x + dx, y: shape.top.y + dy },
              right: { x: shape.right.x + dx, y: shape.right.y + dy },
              bottom: { x: shape.bottom.x + dx, y: shape.bottom.y + dy },
              left: { x: shape.left.x + dx, y: shape.left.y + dy },
            };

          case "pencil":
            return {
              ...shape,
              points: shape.points.map((pt) => ({
                x: pt.x + dx,
                y: pt.y + dy,
              })),
            };
        }
      });
    }
  }

  // -----------------------------
  // Pointer Up
  // -----------------------------
  onPointerUp() {
    const cm = CanvasManager.getInstance();

    if (this.isMarquee && this.marqueeRect) {
      const { shapes, setSelectedShapeIds } = useEditorStore.getState();

      const selected: string[] = [];

      for (const shape of shapes) {
        const bounds = (cm as any).getShapeBounds(shape);
        if (!bounds) continue;

        if (this.intersects(bounds, this.marqueeRect)) {
          selected.push(shape.id);
        }
      }

      setSelectedShapeIds(selected);
    }

    this.dragging = false;
    this.isMarquee = false;
    this.marqueeRect = null;

    cm.setSelectionRect(null);
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  private startMarquee(p: Point) {
    this.isMarquee = true;
    this.marqueeStart = p;
    this.marqueeRect = { x: p.x, y: p.y, w: 0, h: 0 };
    CanvasManager.getInstance().setSelectionRect(this.marqueeRect);
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
}
