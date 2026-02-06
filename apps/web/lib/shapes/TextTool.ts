import { ToolController } from "../utils";
import CanvasManager from "../canvas/CanvasManager";
import { useEditorStore } from "@/store/editor";

export class TextTool implements ToolController {
  private textarea: HTMLTextAreaElement | null = null;
  private x = 0;
  private y = 0;
  private isCleaning = false;

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
    const { currentStyle, currentTextStyle } = useEditorStore.getState();

    container.style.position ||= "relative";

    const textarea = document.createElement("textarea");

    const fontSize = currentTextStyle.fontSize ?? 20;
    const fontFamily = currentTextStyle.fontFamily ?? "Virgil";
    const fontWeight = currentTextStyle.fontWeight ?? "normal";
    const fontStyle = currentTextStyle.fontStyle ?? "normal";
    const textAlign = currentTextStyle.textAlign ?? "left";
    const baseScreen = cm.toScreenPoint({ x: this.x, y: this.y - fontSize });
    textarea.style.position = "absolute";
    textarea.style.top = `${baseScreen.y}px`;
    textarea.style.fontSize = `${fontSize * cm.getZoom()}px`;
    textarea.style.fontFamily = fontFamily;
    textarea.style.fontWeight = fontWeight;
    textarea.style.fontStyle = fontStyle;
    textarea.style.textAlign = textAlign;

    textarea.style.border = "none";
    textarea.style.background = "transparent";
    textarea.style.color = currentStyle.stroke || "black";
    textarea.style.resize = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.padding = "2px 4px";
    textarea.style.lineHeight = "1.2";
    textarea.style.overflow = "hidden";
    textarea.style.boxSizing = "border-box";
    textarea.spellcheck = false;
    textarea.style.minWidth = "40px";
    textarea.style.minHeight = `${fontSize * cm.getZoom() + 6}px`;
    textarea.rows = 1;

    container.appendChild(textarea);
    textarea.focus();

    const positionTextarea = () => {
      const width = parseFloat(textarea.style.width || "0");
      let left = baseScreen.x;
      if (textAlign === "center") {
        left -= width / 2;
      } else if (textAlign === "right") {
        left -= width;
      }
      textarea.style.left = `${left}px`;
    };

    const resizeTextarea = () => {
      const ctx = (cm as any).ctx as CanvasRenderingContext2D;
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      const text = textarea.value || " ";
      const textWidth = ctx.measureText(text).width * cm.getZoom();
      const nextWidth = Math.max(textWidth + 8, 40);
      textarea.style.width = `${nextWidth}px`;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
      positionTextarea();

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

    const { currentTextStyle } = useEditorStore.getState();
    const fontSize = currentTextStyle.fontSize ?? 20;
    const fontFamily = currentTextStyle.fontFamily ?? "Virgil";
    const fontWeight = currentTextStyle.fontWeight ?? "normal";
    const fontStyle = currentTextStyle.fontStyle ?? "normal";
    const textAlign = currentTextStyle.textAlign ?? "left";

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    const w = ctx.measureText(text).width;
    const h = fontSize;

    const { addShape, currentStyle } = useEditorStore.getState();
    addShape({
      id: crypto.randomUUID(),
      type: "text",
      x: this.x,
      y: this.y,
      text,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      textAlign,
      color: currentStyle.stroke,
      stroke: currentStyle.stroke,
      fill: currentStyle.fill,
      strokeWidth: currentStyle.strokeWidth,
      opacity: currentStyle.opacity,
      strokeStyle: currentStyle.strokeStyle,
      sloppiness: currentStyle.sloppiness,
      edgeStyle: currentStyle.edgeStyle,
      rotation: currentStyle.rotation,
      w,
      h,
    });

    this.cleanup();
  }

  private cleanup() {
    if (this.isCleaning) return;
    this.isCleaning = true;
    if (this.textarea) {
      const parent = this.textarea.parentElement;
      if (parent && parent.contains(this.textarea)) {
        parent.removeChild(this.textarea);
      }
      this.textarea = null;
    }
    CanvasManager.getInstance().setEditingTextBounds(null);
    useEditorStore.getState().maybeResetToolAfterAction();
    this.isCleaning = false;
  }
}
