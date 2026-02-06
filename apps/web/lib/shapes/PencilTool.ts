import { useEditorStore } from "@/store/editor";
import CanvasManager from "../canvas/CanvasManager";
import { ToolController } from "../utils";
import { Point } from "@/types/shape/shape";

export class PencilTool implements ToolController {
  private points: Point[] = [];
  private drawing = false;

  onPointerDown(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    this.points = [p];
    this.drawing = true;
  }

  onPointerMove(e: PointerEvent) {
    if (!this.drawing) return;

    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    this.points.push(p);
    cm.setdraftPencil(this.points);
  }

  onPointerUp() {
    if (!this.drawing || this.points.length < 2) return;

    this.drawing = false;

    const { addShape, currentStyle } = useEditorStore.getState();
    addShape({
      id: crypto.randomUUID(),
      type: "pencil",
      points: this.points,
      ...currentStyle,
    });

    CanvasManager.getInstance().clearAllDrafts();
    this.points = [];
    useEditorStore.getState().maybeResetToolAfterAction();
  }
}
