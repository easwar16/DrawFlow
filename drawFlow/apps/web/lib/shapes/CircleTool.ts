import { ToolController } from "../utils";
import { useEditorStore } from "@/store/editor";
import CanvasManager from "../canvas/CanvasManager";
import { Point } from "@/types/shape/shape";

export class CircleTool implements ToolController {
  private start!: Point;
  private drawing = false;

  onPointerDown(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    this.start = cm.toCanvasPoint(e);
    this.drawing = true;

    cm.setDraftCircle(this.start.x, this.start.y, 0);
  }

  onPointerMove(e: PointerEvent) {
    if (!this.drawing) return;

    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    const dx = p.x - this.start.x;
    const dy = p.y - this.start.y;

    // const r = Math.hypot(dx, dy);
    const r = e.shiftKey
      ? Math.max(Math.abs(dx), Math.abs(dy))
      : Math.hypot(dx, dy);

    cm.setDraftCircle(this.start.x, this.start.y, r);
  }

  onPointerUp() {
    if (!this.drawing) return;

    const cm = CanvasManager.getInstance();
    const { addShape } = useEditorStore.getState();

    const draft = (cm as any).draftCircle;
    if (!draft || draft.r < 2) {
      cm.clearDraftCircle();
      this.drawing = false;
      return;
    }

    addShape({
      id: crypto.randomUUID(),
      type: "circle",
      cx: draft.cx,
      cy: draft.cy,
      r: draft.r,
    });

    cm.clearDraftCircle();
    this.drawing = false;
  }
}
