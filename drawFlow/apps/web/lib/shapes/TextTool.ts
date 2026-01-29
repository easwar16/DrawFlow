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

    const topLeft = cm.toScreenPoint({ x: this.x, y: this.y });
    textarea.style.position = "absolute";
    textarea.style.left = `${topLeft.x}px`;
    textarea.style.top = `${topLeft.y}px`;
    textarea.style.fontSize = `${20 * cm.getZoom()}px`;
    textarea.style.fontFamily = "Virgil";

    textarea.style.border = "none";
    textarea.style.background = "transparent";
    textarea.style.color = "black";
    textarea.style.resize = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.padding = "2px 4px";
    textarea.style.lineHeight = "1.2";
    textarea.style.overflow = "hidden";
    textarea.style.boxSizing = "border-box";
    textarea.spellcheck = false;
    textarea.style.minWidth = "40px";
    textarea.style.minHeight = `${20 * cm.getZoom() + 6}px`;
    textarea.rows = 1;

    container.appendChild(textarea);
    textarea.focus();

    const resizeTextarea = () => {
      const ctx = (cm as any).ctx as CanvasRenderingContext2D;
      ctx.font = `20px Virgil`;
      const text = textarea.value || " ";
      const textWidth = ctx.measureText(text).width * cm.getZoom();
      const nextWidth = Math.max(textWidth + 8, 40);
      textarea.style.width = `${nextWidth}px`;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;

      // keep selection hidden while typing
    };

    cm.setEditingTextBounds(null);
    resizeTextarea();

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.commit(textarea.value);
      }
      if (e.key === "Escape") {
        this.cleanup();
      }
    });

    textarea.addEventListener("input", resizeTextarea);
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
    const fontFamily = "Virgil";

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
    CanvasManager.getInstance().setEditingTextBounds(null);
  }
}
