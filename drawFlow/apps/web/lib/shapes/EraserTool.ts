import { ToolController } from "../utils";
import { useEditorStore } from "@/store/editor";
import CanvasManager from "../canvas/CanvasManager";
import { hitTest } from "../utils/hitTest";

export class EraserTool implements ToolController {
  private isErasing = false;

  onPointerDown(e: PointerEvent) {
    this.isErasing = true;
    this.eraseAtPoint(e);
  }

  onPointerMove(e: PointerEvent) {
    if (!this.isErasing) return;
    this.eraseAtPoint(e);
  }

  onPointerUp() {
    this.isErasing = false;
  }

  private eraseAtPoint(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    const { shapes, removeShape } = useEditorStore.getState();

    // top-most first (important)
    for (const shape of [...shapes].reverse()) {
      if (hitTest(p, shape)) {
        removeShape(shape.id);
        break; // erase one per frame (feels controlled)
      }
    }
  }
}
