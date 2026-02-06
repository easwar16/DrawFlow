import { useEditorStore } from "@/store/editor";
import CanvasManager from "../canvas/CanvasManager";
import { ToolController } from "../utils";

export class RectangleTool implements ToolController {
  private startX = 0;
  private startY = 0;
  private drawing = false;

  onPointerDown(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    this.startX = p.x;
    this.startY = p.y;
    this.drawing = true;
  }
  onPointerMove(e: PointerEvent) {
    if (!this.drawing) return;

    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    cm.setDraftRect(
      this.startX,
      this.startY,
      p.x - this.startX,
      p.y - this.startY
    );
  }
  onPointerUp(e: PointerEvent) {
    if (!this.drawing) return;
    this.drawing = false;

    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    const { currentStyle } = useEditorStore.getState();
    const rect = {
      id: crypto.randomUUID(),
      type: "rect" as const,
      x: Math.min(this.startX, p.x),
      y: Math.min(this.startY, p.y),
      w: Math.abs(p.x - this.startX),
      h: Math.abs(p.y - this.startY),
      ...currentStyle,
    };

    useEditorStore.getState().addShape(rect);

    cm.clearAllDrafts();
    useEditorStore.getState().maybeResetToolAfterAction();
  }
}
