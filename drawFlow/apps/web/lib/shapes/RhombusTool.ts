import { useEditorStore } from "@/store/editor";
import CanvasManager from "../canvas/CanvasManager";
import { ToolController } from "../utils";
import { Point } from "@/types/shape/shape";

export class RhombusTool implements ToolController {
  private startX = 0;
  private startY = 0;
  private top: Point = { x: 0, y: 0 };
  private bottom: Point = { x: 0, y: 0 };
  private left: Point = { x: 0, y: 0 };
  private right: Point = { x: 0, y: 0 };
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

    const cx = (this.startX + p.x) / 2;
    const cy = (this.startY + p.y) / 2;

    const rx = Math.abs(p.x - this.startX) / 2;
    const ry = Math.abs(p.y - this.startY) / 2;

    this.top = { x: cx, y: cy - ry };
    this.right = { x: cx + rx, y: cy };
    this.bottom = { x: cx, y: cy + ry };
    this.left = { x: cx - rx, y: cy };

    cm.setDraftRhom(this.top, this.bottom, this.left, this.right);
  }
  onPointerUp(e: PointerEvent) {
    if (!this.drawing) return;
    this.drawing = false;

    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    const cx = (this.startX + p.x) / 2;
    const cy = (this.startY + p.y) / 2;

    const rx = Math.abs(p.x - this.startX) / 2;
    const ry = Math.abs(p.y - this.startY) / 2;

    this.top = { x: cx, y: cy - ry };
    this.right = { x: cx + rx, y: cy };
    this.bottom = { x: cx, y: cy + ry };
    this.left = { x: cx - rx, y: cy };

    const { currentStyle } = useEditorStore.getState();
    const rhom = {
      id: crypto.randomUUID(),
      type: "rhombus" as const,
      top: this.top,
      bottom: this.bottom,
      left: this.left,
      right: this.right,
      ...currentStyle,
    };

    useEditorStore.getState().addShape(rhom);

    cm.clearAllDrafts();
    useEditorStore.getState().maybeResetToolAfterAction();
  }
}
