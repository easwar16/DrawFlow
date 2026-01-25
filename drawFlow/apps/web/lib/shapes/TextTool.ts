import { ToolController } from "../utils";
import CanvasManager from "../canvas/CanvasManager";
import { useEditorStore } from "@/store/editor";

export class TextTool implements ToolController {
  private textarea: HTMLTextAreaElement | null = null;
  private x = 0;
  private y = 0;

  onPointerDown(e: PointerEvent) {
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    this.x = p.x;
    this.y = p.y;

    this.createTextarea();
  }

  onPointerMove() {}
  onPointerUp() {}

  private createTextarea() {
    this.cleanup();

    const cm = CanvasManager.getInstance();
    const canvas = (cm as any).canvas as HTMLCanvasElement;
    const container = canvas.parentElement!;

    container.style.position ||= "relative";

    const textarea = document.createElement("textarea");

    textarea.style.position = "absolute";
    textarea.style.left = `${this.x}px`;
    textarea.style.top = `${this.y}px`;
    textarea.style.fontSize = "20px";
    textarea.style.fontFamily = "sans-serif";
    textarea.style.border = "1px dashed #60a5fa";
    textarea.style.background = "white";
    textarea.style.color = "black";
    textarea.style.resize = "none";
    textarea.rows = 1;

    container.appendChild(textarea);
    textarea.focus();

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.commit(textarea.value);
      }
      if (e.key === "Escape") {
        this.cleanup();
      }
    });

    textarea.addEventListener("blur", () => {
      this.commit(textarea.value);
    });

    this.textarea = textarea;
  }

  private commit(text: string) {
    if (!text.trim()) {
      this.cleanup();
      return;
    }

    const cm = CanvasManager.getInstance();
    const ctx = (cm as any).ctx as CanvasRenderingContext2D;

    const fontSize = 20;
    const fontFamily = "sans-serif";

    ctx.font = `${fontSize}px ${fontFamily}`;
    const w = ctx.measureText(text).width;
    const h = fontSize;

    useEditorStore.getState().addShape({
      id: crypto.randomUUID(),
      type: "text",
      x: this.x,
      y: this.y,
      text,
      fontSize,
      fontFamily,
      color: "black",
      w,
      h,
    });

    this.cleanup();
  }

  private cleanup() {
    if (this.textarea) {
      this.textarea.remove();
      this.textarea = null;
    }
  }
}
