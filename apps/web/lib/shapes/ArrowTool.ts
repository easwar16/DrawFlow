import { useEditorStore } from "@/store/editor";
import CanvasManager from "../canvas/CanvasManager";
import { ToolController } from "./../utils";
import { Point } from "@/types/shape/shape";

export class ArrowTool implements ToolController {
  private startPoint: Point = { x: 0, y: 0 };
  private endPoint: Point = { x: 0, y: 0 };
  private drawing = false;

  onPointerDown(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    this.startPoint = p;
    this.endPoint = p;
    this.drawing = true;

    cm.startDraftArrow(p);
  }

  onPointerMove(e: PointerEvent) {
    if (!this.drawing) return;

    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);
    this.endPoint = p;

    cm.setDraftArrow(this.startPoint, p);
  }

  onPointerUp() {
    if (!this.drawing) return;

    this.drawing = false;

    const { addShape, currentStyle } = useEditorStore.getState();
    addShape({
      id: crypto.randomUUID(),
      type: "arrow",
      startPoint: { ...this.startPoint },
      endPoint: { ...this.endPoint },
      controlPoint: {
        x: (this.startPoint.x + this.endPoint.x) / 2,
        y: (this.startPoint.y + this.endPoint.y) / 2,
      },
      ...currentStyle,
    });

    CanvasManager.getInstance().clearAllDrafts();
    useEditorStore.getState().maybeResetToolAfterAction();
  }
}
