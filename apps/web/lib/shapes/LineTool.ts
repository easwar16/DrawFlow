import { useEditorStore } from "@/store/editor";
import CanvasManager from "../canvas/CanvasManager";
import { ToolController } from "./../utils";
import { Point } from "@/types/shape/shape";

export class LineTool implements ToolController {
  private startPoint: Point = { x: 0, y: 0 };
  private endPoint: Point = { x: 0, y: 0 };
  private drawing = false;

  onPointerDown(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    this.startPoint = p;
    this.endPoint = p;
    this.drawing = true;

    cm.startDraftLine(p);
  }

  onPointerMove(e: PointerEvent) {
    if (!this.drawing) return;

    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);
    this.endPoint = p;

    cm.setDraftLine(this.startPoint, p);
  }

  onPointerUp() {
    if (!this.drawing) return;

    this.drawing = false;

    const { addShape, currentStyle } = useEditorStore.getState();
    addShape({
      id: crypto.randomUUID(),
      type: "line",
      startPoint: { ...this.startPoint },
      endPoint: { ...this.endPoint },
      ...currentStyle,
    });

    CanvasManager.getInstance().clearAllDrafts();
    useEditorStore.getState().maybeResetToolAfterAction();
  }
}
