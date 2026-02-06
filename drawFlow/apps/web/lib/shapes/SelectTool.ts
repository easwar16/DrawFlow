import { Shape, ToolController } from "../utils";
import { useEditorStore } from "@/store/editor";
import CanvasManager from "../canvas/CanvasManager";
import {
  ROTATE_HANDLE_OFFSET,
  ROTATE_HANDLE_RADIUS,
  SELECTION_BOX_PADDING,
  SELECTION_HANDLE_SIZE,
} from "../canvas/constants";
import { Point } from "@/types/shape/shape";
import { hitTest } from "../utils/hitTest";

export class SelectTool implements ToolController {
  private dragging = false;
  private dragStart!: Point;

  private isMarquee = false;
  private marqueeStart!: Point;
  private marqueeRect: {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null = null;

  private resizing = false;
  private resizeHandle: ResizeHandle | null = null;
  private initialBounds: { x: number; y: number; w: number; h: number } | null =
    null;
  private initialShapes = new Map<string, Shape>();
  private rotating = false;
  private rotateStartAngle = 0;
  private rotateStartRotation = 0;
  private rotateCenter: Point | null = null;
  private editingTextarea: HTMLTextAreaElement | null = null;
  private editingId: string | null = null;
  private previousSelection: string[] | null = null;

  private static MIN_SIZE = 12;

  onDeactivate() {
    this.dragging = false;
    this.resizing = false;
    this.resizeHandle = null;
    this.initialBounds = null;
    this.initialShapes.clear();
    this.rotating = false;
    this.rotateCenter = null;
    this.cleanupTextEdit();
    this.isMarquee = false;
    this.marqueeRect = null;
    CanvasManager.getInstance().setSelectionRect(null);
  }

  // -----------------------------
  // Pointer Down
  // -----------------------------
  onPointerDown(e: PointerEvent) {
    if (useEditorStore.getState().isToolLocked) {
      return;
    }
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    const { shapes, selectedShapeIds, setSelectedShapeIds, syncStyleFromShape } =
      useEditorStore.getState();

    const selectionBounds = cm.getCurrentSelectionBounds();
    if (selectedShapeIds.length === 1) {
      const selected = shapes.find((s) => s.id === selectedShapeIds[0]);
      if (selectionBounds && selected && this.getRotateHandleHit(p, selectionBounds)) {
        const center = this.getBoundsCenter(selectionBounds);
        this.rotating = true;
        this.rotateCenter = center;
        this.rotateStartAngle = Math.atan2(p.y - center.y, p.x - center.x);
        this.rotateStartRotation = selected.rotation ?? 0;
        return;
      }
      if (selected) {
        syncStyleFromShape(selected);
      }
      if (selected && (selected.type === "line" || selected.type === "arrow")) {
        const lineHandle = this.getLineHandleHit(p, selected);
        if (lineHandle) {
          this.resizing = true;
          this.resizeHandle = lineHandle;
          this.initialBounds = selectionBounds;
          this.initialShapes.clear();
          this.initialShapes.set(selected.id, this.cloneShape(selected));
          return;
        }
      }
    }

    if (selectionBounds && selectedShapeIds.length === 1) {
      const handle = this.getHandleHit(p, selectionBounds);
      if (handle) {
        this.resizing = true;
        this.resizeHandle = handle;
        this.initialBounds = selectionBounds;
        this.initialShapes.clear();
        for (const shape of shapes) {
          if (selectedShapeIds.includes(shape.id)) {
            this.initialShapes.set(shape.id, this.cloneShape(shape));
          }
        }
        return;
      }
    }

    // 🔼 find topmost hit
    for (const shape of [...shapes].reverse()) {
      if (!hitTest(p, shape)) continue;

      const alreadySelected = selectedShapeIds.includes(shape.id);

      // ✅ click inside selection → drag all
      if (alreadySelected) {
        this.dragging = true;
        this.dragStart = p;
        return;
      }

      // ✅ new selection
      setSelectedShapeIds(
        e.shiftKey ? [...selectedShapeIds, shape.id] : [shape.id],
      );
      syncStyleFromShape(shape);

      this.dragging = true;
      this.dragStart = p;
      return;
    }

    // 🟥 empty canvas → marquee
    this.dragging = false;

    if (!e.shiftKey) {
      setSelectedShapeIds([]);
    }

    this.startMarquee(p);
  }

  onDoubleClick(e: MouseEvent) {
    if (useEditorStore.getState().isToolLocked) {
      return;
    }
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint({
      clientX: e.clientX,
      clientY: e.clientY,
    } as PointerEvent);

    const { shapes, setSelectedShapeIds } = useEditorStore.getState();
    for (const shape of [...shapes].reverse()) {
      if (shape.type !== "text") continue;
      if (!hitTest(p, shape)) continue;
      setSelectedShapeIds([shape.id]);
      this.startTextEdit(shape);
      return;
    }
  }

  // -----------------------------
  // Pointer Move
  // -----------------------------
  onPointerMove(e: PointerEvent) {
    if (useEditorStore.getState().isToolLocked) {
      return;
    }
    const cm = CanvasManager.getInstance();
    const p = cm.toCanvasPoint(e);

    if (this.rotating && this.rotateCenter) {
      const { selectedShapeIds, updateShape } = useEditorStore.getState();
      if (selectedShapeIds.length === 1) {
        const angle = Math.atan2(p.y - this.rotateCenter.y, p.x - this.rotateCenter.x);
        const nextRotation = this.rotateStartRotation + (angle - this.rotateStartAngle);
        updateShape(selectedShapeIds[0]!, (shape) => ({
          ...shape,
          rotation: nextRotation,
        }));
      }
      return;
    }

    if (this.resizing && this.resizeHandle && this.initialBounds) {
      this.resizeSelection(p);
      return;
    }

    // 🟦 marquee
    if (this.isMarquee && this.marqueeStart) {
      const x = Math.min(this.marqueeStart.x, p.x);
      const y = Math.min(this.marqueeStart.y, p.y);
      const w = Math.abs(p.x - this.marqueeStart.x);
      const h = Math.abs(p.y - this.marqueeStart.y);

      this.marqueeRect = { x, y, w, h };
      cm.setSelectionRect(this.marqueeRect);
      return;
    }

    if (!this.dragging) return;

    const dx = p.x - this.dragStart.x;
    const dy = p.y - this.dragStart.y;
    this.dragStart = p;

    const { selectedShapeIds, updateShape } = useEditorStore.getState();

    // 🔥 MOVE ALL SELECTED SHAPES
    for (const id of selectedShapeIds) {
      updateShape(id, (shape) => {
        switch (shape.type) {
          case "rect":
          case "text":
            return { ...shape, x: shape.x + dx, y: shape.y + dy };

          case "circle":
            return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };

          case "line":
          case "arrow":
            return {
              ...shape,
              startPoint: {
                x: shape.startPoint.x + dx,
                y: shape.startPoint.y + dy,
              },
              endPoint: {
                x: shape.endPoint.x + dx,
                y: shape.endPoint.y + dy,
              },
              controlPoint: shape.controlPoint
                ? {
                    x: shape.controlPoint.x + dx,
                    y: shape.controlPoint.y + dy,
                  }
                : undefined,
            };

          case "rhombus":
            return {
              ...shape,
              top: { x: shape.top.x + dx, y: shape.top.y + dy },
              right: { x: shape.right.x + dx, y: shape.right.y + dy },
              bottom: { x: shape.bottom.x + dx, y: shape.bottom.y + dy },
              left: { x: shape.left.x + dx, y: shape.left.y + dy },
            };

          case "pencil":
            return {
              ...shape,
              points: shape.points.map((pt) => ({
                x: pt.x + dx,
                y: pt.y + dy,
              })),
            };
        }
      });
    }
  }

  // -----------------------------
  // Pointer Up
  // -----------------------------
  onPointerUp() {
    if (useEditorStore.getState().isToolLocked) {
      this.dragging = false;
      this.resizing = false;
      this.resizeHandle = null;
      this.initialBounds = null;
      this.initialShapes.clear();
      this.isMarquee = false;
      this.marqueeRect = null;
      CanvasManager.getInstance().setSelectionRect(null);
      return;
    }
    const cm = CanvasManager.getInstance();

    if (this.rotating) {
      this.rotating = false;
      this.rotateCenter = null;
      return;
    }

    if (this.isMarquee && this.marqueeRect) {
      const { shapes, setSelectedShapeIds } = useEditorStore.getState();

      const selected: string[] = [];

      for (const shape of shapes) {
        const bounds = (cm as any).getShapeBounds(shape);
        if (!bounds) continue;

        if (this.intersects(bounds, this.marqueeRect)) {
          selected.push(shape.id);
        }
      }

      setSelectedShapeIds(selected);
    }

    this.dragging = false;
    this.resizing = false;
    this.resizeHandle = null;
    this.initialBounds = null;
    this.initialShapes.clear();
    this.isMarquee = false;
    this.marqueeRect = null;

    cm.setSelectionRect(null);
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  private startMarquee(p: Point) {
    this.isMarquee = true;
    this.marqueeStart = p;
    this.marqueeRect = { x: p.x, y: p.y, w: 0, h: 0 };
    CanvasManager.getInstance().setSelectionRect(this.marqueeRect);
  }

  private intersects(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ) {
    return !(
      a.x > b.x + b.w ||
      a.x + a.w < b.x ||
      a.y > b.y + b.h ||
      a.y + a.h < b.y
    );
  }

  private getHandleHit(
    p: Point,
    bounds: { x: number; y: number; w: number; h: number },
  ): ResizeHandle | null {
    const padding = SELECTION_BOX_PADDING;
    const box = {
      x: bounds.x - padding,
      y: bounds.y - padding,
      w: bounds.w + padding * 2,
      h: bounds.h + padding * 2,
    };
    const size = SELECTION_HANDLE_SIZE;
    const half = size / 2;
    const handles: { id: ResizeHandle; x: number; y: number }[] = [
      { id: "nw", x: box.x, y: box.y },
      { id: "n", x: box.x + box.w / 2, y: box.y },
      { id: "ne", x: box.x + box.w, y: box.y },
      { id: "e", x: box.x + box.w, y: box.y + box.h / 2 },
      { id: "se", x: box.x + box.w, y: box.y + box.h },
      { id: "s", x: box.x + box.w / 2, y: box.y + box.h },
      { id: "sw", x: box.x, y: box.y + box.h },
      { id: "w", x: box.x, y: box.y + box.h / 2 },
    ];

    for (const handle of handles) {
      if (
        p.x >= handle.x - half &&
        p.x <= handle.x + half &&
        p.y >= handle.y - half &&
        p.y <= handle.y + half
      ) {
        return handle.id;
      }
    }

    return null;
  }

  private getRotateHandleHit(
    p: Point,
    bounds: { x: number; y: number; w: number; h: number },
  ) {
    const padding = SELECTION_BOX_PADDING;
    const centerX = bounds.x + bounds.w / 2;
    const handleY = bounds.y - padding - ROTATE_HANDLE_OFFSET;
    const dx = p.x - centerX;
    const dy = p.y - handleY;
    return Math.hypot(dx, dy) <= ROTATE_HANDLE_RADIUS;
  }

  private getBoundsCenter(bounds: { x: number; y: number; w: number; h: number }) {
    return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
  }

  private getLineHandleHit(p: Point, shape: Shape): ResizeHandle | null {
    if (shape.type !== "line" && shape.type !== "arrow") return null;
    const radius = SELECTION_HANDLE_SIZE / 2;
    const start = shape.startPoint;
    const end = shape.endPoint;

    if (this.distance(p, start) <= radius) return "line-start";
    if (
      shape.type === "arrow" &&
      this.distance(p, this.getArrowMidPoint(shape)) <= radius
    ) {
      return "arrow-control";
    }
    if (this.distance(p, end) <= radius) return "line-end";

    return null;
  }

  private resizeSelection(p: Point) {
    const { updateShape, selectedShapeIds } = useEditorStore.getState();
    const bounds = this.initialBounds;
    const handle = this.resizeHandle;

    if (!bounds || !handle) return;

    if (
      handle === "line-start" ||
      handle === "line-end" ||
      handle === "arrow-control"
    ) {
      for (const id of selectedShapeIds) {
        const original = this.initialShapes.get(id);
        if (!original) continue;
        updateShape(id, () => this.adjustLineEndpoint(original, handle, p));
      }
      return;
    }

    const { anchor, sx, sy } = this.getResizedBounds(bounds, handle, p);

    for (const id of selectedShapeIds) {
      const original = this.initialShapes.get(id);
      if (!original) continue;

      updateShape(id, (shape) => this.scaleShape(original, anchor, sx, sy));
    }
  }

  private getResizedBounds(
    bounds: { x: number; y: number; w: number; h: number },
    handle: ResizeHandle,
    p: Point,
  ) {
    const minSize = SelectTool.MIN_SIZE;
    let { x, y, w, h } = bounds;

    let newX = x;
    let newY = y;
    let newW = w;
    let newH = h;

    switch (handle) {
      case "nw":
        newX = p.x;
        newY = p.y;
        newW = x + w - p.x;
        newH = y + h - p.y;
        break;
      case "n":
        newY = p.y;
        newH = y + h - p.y;
        break;
      case "ne":
        newY = p.y;
        newW = p.x - x;
        newH = y + h - p.y;
        break;
      case "e":
        newW = p.x - x;
        break;
      case "se":
        newW = p.x - x;
        newH = p.y - y;
        break;
      case "s":
        newH = p.y - y;
        break;
      case "sw":
        newX = p.x;
        newW = x + w - p.x;
        newH = p.y - y;
        break;
      case "w":
        newX = p.x;
        newW = x + w - p.x;
        break;
      case "line-start":
      case "line-end":
        break;
    }

    if (["n", "s"].includes(handle)) {
      newX = x;
      newW = w;
    }

    if (["e", "w"].includes(handle)) {
      newY = y;
      newH = h;
    }

    if (newW < minSize) {
      newW = minSize;
      newX = handle.includes("w") ? x + w - minSize : x;
    }

    if (newH < minSize) {
      newH = minSize;
      newY = handle.includes("n") ? y + h - minSize : y;
    }

    const sx = newW / w;
    const sy = newH / h;
    const anchor = this.getAnchorPoint(handle, bounds);

    return { anchor, sx, sy };
  }

  private getAnchorPoint(
    handle: ResizeHandle,
    bounds: { x: number; y: number; w: number; h: number },
  ) {
    switch (handle) {
      case "nw":
        return { x: bounds.x + bounds.w, y: bounds.y + bounds.h };
      case "n":
        return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h };
      case "ne":
        return { x: bounds.x, y: bounds.y + bounds.h };
      case "e":
        return { x: bounds.x, y: bounds.y + bounds.h / 2 };
      case "se":
        return { x: bounds.x, y: bounds.y };
      case "s":
        return { x: bounds.x + bounds.w / 2, y: bounds.y };
      case "sw":
        return { x: bounds.x + bounds.w, y: bounds.y };
      case "w":
        return { x: bounds.x + bounds.w, y: bounds.y + bounds.h / 2 };
      case "line-start":
      case "line-end":
      case "arrow-control":
        return { x: bounds.x, y: bounds.y };
    }
  }

  private adjustLineEndpoint(
    shape: Shape,
    handle: ResizeHandle,
    point: Point,
  ): Shape {
    if (shape.type !== "line" && shape.type !== "arrow") return shape;

    if (handle === "line-start") {
      return {
        ...shape,
        startPoint: { x: point.x, y: point.y },
      };
    }

    if (handle === "line-end") {
      return {
        ...shape,
        endPoint: { x: point.x, y: point.y },
      };
    }

    if (handle === "arrow-control" && shape.type === "arrow") {
      const newControl = this.controlPointForMidPoint(
        shape.startPoint,
        point,
        shape.endPoint,
      );
      return {
        ...shape,
        controlPoint: newControl,
      };
    }

    return shape;
  }

  private distance(a: Point, b: Point) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private startTextEdit(shape: Shape) {
    if (shape.type !== "text") return;
    this.cleanupTextEdit();

    const cm = CanvasManager.getInstance();
    const canvas = (cm as any).canvas as HTMLCanvasElement;
    const container = canvas.parentElement!;
    container.style.position ||= "relative";
    const { selectedShapeIds, setSelectedShapeIds } = useEditorStore.getState();
    this.previousSelection = selectedShapeIds;
    setSelectedShapeIds([]);
    cm.render();
    cm.setEditingTextId(shape.id);
    cm.setEditingTextBounds(null);
    cm.render();

    const textarea = document.createElement("textarea");
    const topLeft = cm.toScreenPoint({ x: shape.x, y: shape.y - shape.h });

    textarea.value = shape.text;
    textarea.style.position = "absolute";
    textarea.style.left = `${topLeft.x}px`;
    textarea.style.top = `${topLeft.y}px`;
    textarea.style.fontSize = `${shape.fontSize * cm.getZoom()}px`;
    textarea.style.fontFamily = shape.fontFamily;
    textarea.style.border = "none";
    textarea.style.background = "transparent";
    textarea.style.color = shape.color;
    textarea.style.resize = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.padding = "2px 4px";
    textarea.style.lineHeight = "1.2";
    textarea.style.letterSpacing = "normal";
    textarea.style.webkitTextFillColor = shape.color;
    textarea.style.fontSmoothing = "antialiased";
    textarea.style.webkitFontSmoothing = "antialiased";
    textarea.style.overflow = "hidden";
    textarea.style.boxSizing = "border-box";
    textarea.spellcheck = false;
    textarea.style.minWidth = "40px";
    textarea.style.minHeight = `${shape.fontSize * cm.getZoom() + 6}px`;

    const resizeTextarea = () => {
      const ctx = (cm as any).ctx as CanvasRenderingContext2D;
      ctx.font = `${shape.fontSize}px ${shape.fontFamily}`;
      const text = textarea.value || " ";
      const textWidth = ctx.measureText(text).width * cm.getZoom();
      const nextWidth = Math.max(textWidth + 8, 40);
      textarea.style.width = `${nextWidth}px`;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    resizeTextarea();

    container.appendChild(textarea);
    textarea.focus();
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);

    const commit = () => this.commitTextEdit(shape.id, textarea.value);
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
      }
      if (event.key === "Escape") {
        this.cleanupTextEdit(true);
      }
    });

    textarea.addEventListener("input", resizeTextarea);
    textarea.addEventListener("blur", commit);

    this.editingTextarea = textarea;
    this.editingId = shape.id;
  }

  private commitTextEdit(id: string, text: string) {
    const { updateShape, removeShape, setSelectedShapeIds } =
      useEditorStore.getState();

    if (!text.trim()) {
      removeShape(id);
      setSelectedShapeIds([]);
      this.cleanupTextEdit(false);
      return;
    }

    const cm = CanvasManager.getInstance();
    const ctx = (cm as any).ctx as CanvasRenderingContext2D;

    updateShape(id, (shape) => {
      if (shape.type !== "text") return shape;

      ctx.font = `${shape.fontSize}px ${shape.fontFamily}`;
      const w = ctx.measureText(text).width;
      const h = shape.fontSize;

      return { ...shape, text, w, h };
    });

    this.cleanupTextEdit(false);
    setSelectedShapeIds([id]);
    CanvasManager.getInstance().render();
  }

  private cleanupTextEdit(restoreSelection = false) {
    if (this.editingTextarea) {
      this.editingTextarea.remove();
      this.editingTextarea = null;
      this.editingId = null;
    }
    CanvasManager.getInstance().setEditingTextId(null);
    CanvasManager.getInstance().setEditingTextBounds(null);
    if (restoreSelection && this.previousSelection) {
      useEditorStore.getState().setSelectedShapeIds(this.previousSelection);
    }
    this.previousSelection = null;
    CanvasManager.getInstance().render();
  }

  private scalePoint(
    point: Point,
    anchor: Point,
    sx: number,
    sy: number,
  ) {
    return {
      x: anchor.x + (point.x - anchor.x) * sx,
      y: anchor.y + (point.y - anchor.y) * sy,
    };
  }

  private scaleShape(
    shape: Shape,
    anchor: Point,
    sx: number,
    sy: number,
  ): Shape {
    switch (shape.type) {
      case "rect":
        return {
          ...shape,
          x: anchor.x + (shape.x - anchor.x) * sx,
          y: anchor.y + (shape.y - anchor.y) * sy,
          w: shape.w * sx,
          h: shape.h * sy,
        };
      case "text": {
        const topLeft = { x: shape.x, y: shape.y - shape.h };
        const scaled = this.scalePoint(topLeft, anchor, sx, sy);
        return {
          ...shape,
          x: scaled.x,
          y: scaled.y + shape.h * sy,
          w: shape.w * sx,
          h: shape.h * sy,
        };
      }
      case "circle": {
        const center = this.scalePoint(
          { x: shape.cx, y: shape.cy },
          anchor,
          sx,
          sy,
        );
        const scale = (sx + sy) / 2;
        return {
          ...shape,
          cx: center.x,
          cy: center.y,
          r: shape.r * scale,
        };
      }
      case "line":
      case "arrow":
        return {
          ...shape,
          startPoint: this.scalePoint(shape.startPoint, anchor, sx, sy),
          endPoint: this.scalePoint(shape.endPoint, anchor, sx, sy),
          controlPoint: shape.controlPoint
            ? this.scalePoint(shape.controlPoint, anchor, sx, sy)
            : undefined,
        };
      case "rhombus":
        return {
          ...shape,
          top: this.scalePoint(shape.top, anchor, sx, sy),
          right: this.scalePoint(shape.right, anchor, sx, sy),
          bottom: this.scalePoint(shape.bottom, anchor, sx, sy),
          left: this.scalePoint(shape.left, anchor, sx, sy),
        };
      case "pencil":
        return {
          ...shape,
          points: shape.points.map((pt) =>
            this.scalePoint(pt, anchor, sx, sy),
          ),
        };
    }
  }

  private cloneShape(shape: Shape): Shape {
    switch (shape.type) {
      case "rect":
      case "text":
        return { ...shape };
      case "circle":
        return { ...shape };
      case "line":
      case "arrow":
        return {
          ...shape,
          startPoint: { ...shape.startPoint },
          endPoint: { ...shape.endPoint },
          controlPoint: shape.controlPoint ? { ...shape.controlPoint } : undefined,
        };
      case "rhombus":
        return {
          ...shape,
          top: { ...shape.top },
          right: { ...shape.right },
          bottom: { ...shape.bottom },
          left: { ...shape.left },
        };
      case "pencil":
        return {
          ...shape,
          points: shape.points.map((pt) => ({ ...pt })),
        };
    }
  }

  private getArrowMidPoint(shape: Extract<Shape, { type: "arrow" }>) {
    const control =
      shape.controlPoint ?? {
        x: (shape.startPoint.x + shape.endPoint.x) / 2,
        y: (shape.startPoint.y + shape.endPoint.y) / 2,
      };
    const t = 0.5;
    const mt = 1 - t;
    return {
      x:
        mt * mt * shape.startPoint.x +
        2 * mt * t * control.x +
        t * t * shape.endPoint.x,
      y:
        mt * mt * shape.startPoint.y +
        2 * mt * t * control.y +
        t * t * shape.endPoint.y,
    };
  }

  private controlPointForMidPoint(start: Point, mid: Point, end: Point) {
    return {
      x: 2 * mid.x - 0.5 * (start.x + end.x),
      y: 2 * mid.y - 0.5 * (start.y + end.y),
    };
  }
}

type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "line-start"
  | "line-end"
  | "arrow-control";
