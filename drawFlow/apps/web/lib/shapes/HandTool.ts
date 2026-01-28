import { ToolController } from "../utils";
import CanvasManager from "../canvas/CanvasManager";

export class HandTool implements ToolController {
  onActivate(canvas: HTMLCanvasElement) {
    canvas.style.cursor = "grab";
  }

  onDeactivate(canvas: HTMLCanvasElement) {
    canvas.style.cursor = "default";
  }
  onPointerDown(e: PointerEvent) {
    CanvasManager.getInstance().startPan(e);
  }

  onPointerMove(e: PointerEvent) {
    CanvasManager.getInstance().movePan(e);
  }

  onPointerUp() {
    CanvasManager.getInstance().endPan();
  }
}
