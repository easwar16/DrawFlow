import { Point, ToolType } from "@/types/shape/shape";
import type { Shape, ToolController } from "../utils";
import { DEFAULT_SHAPE_STYLE } from "../utils";
import { useEditorStore } from "@/store/editor";
import {
  ROTATE_HANDLE_OFFSET,
  ROTATE_HANDLE_RADIUS,
  SELECTION_BOX_PADDING,
  SELECTION_HANDLE_SIZE,
} from "./constants";

class CanvasManager {
  private static instance: CanvasManager | null = null;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private dpr = 1;
  private activeTool: ToolController | null = null;

  private zoom = 1;
  private panX = 0;
  private panY = 0;

  private isSpacePressed = false;
  private isPanning = false;
  private panStartScreen!: Point;
  private panStartOffset!: Point;

  private zoomSubscribers = new Set<(zoom: number) => void>();

  private MIN_ZOOM = 0.1;
  private MAX_ZOOM = 4;

  private panning = false;
  private panStart!: Point;
  private editingTextId: string | null = null;
  private editingTextBounds: { x: number; y: number; w: number; h: number } | null =
    null;

  private constructor() {}
  private onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey) return;

    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (e.deltaY < 0) {
      this.zoomIn(point);
    } else {
      this.zoomOut(point);
    }
  };

  pan(dx: number, dy: number) {
    this.panX += dx;
    this.panY += dy;
    this.render(useEditorStore.getState().shapes);
  }

  startPan(e: PointerEvent) {
    this.isPanning = true;
    this.panStartScreen = { x: e.clientX, y: e.clientY };
    this.panStartOffset = { x: this.panX, y: this.panY };
    this.canvas.style.cursor = "grabbing";
  }

  movePan(e: PointerEvent) {
    if (!this.isPanning) return;

    const dx = e.clientX - this.panStartScreen.x;
    const dy = e.clientY - this.panStartScreen.y;

    this.panX = this.panStartOffset.x + dx;
    this.panY = this.panStartOffset.y + dy;

    this.render();
  }

  endPan() {
    this.isPanning = false;
    this.canvas.style.cursor = "default";
  }
  private draftRect: {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null = null;

  private draftCircle: {
    cx: number;
    cy: number;
    r: number;
  } | null = null;

  private draftRhom: {
    top: Point;
    bottom: Point;
    left: Point;
    right: Point;
  } | null = null;

  private draftPencil: Point[] | null = null;

  private draftLine: { startPoint: Point; endPoint: Point } | null = null;

  private draftArrow: { startPoint: Point; endPoint: Point } | null = null;

  private selectionRect: {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null = null;

  setZoom(newZoom: number, center?: { x: number; y: number }) {
    const prevZoom = this.zoom;

    this.zoom = Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, newZoom));

    if (center) {
      const scale = this.zoom / prevZoom;
      this.panX = center.x - scale * (center.x - this.panX);
      this.panY = center.y - scale * (center.y - this.panY);
    }

    // ✅ notify listeners
    this.zoomSubscribers.forEach((cb) => cb(this.zoom));

    this.render(useEditorStore.getState().shapes);
  }

  zoomIn(center?: { x: number; y: number }) {
    this.setZoom(this.zoom * 1.1, center);
  }

  zoomOut(center?: { x: number; y: number }) {
    this.setZoom(this.zoom / 1.1, center);
  }


  getCanvas() {
    return this.canvas;
  }

  subscribeZoom(cb: (zoom: number) => void) {
    this.zoomSubscribers.add(cb);

    // ✅ IMPORTANT: return a FUNCTION, not a boolean
    return () => {
      this.zoomSubscribers.delete(cb);
    };
  }

  resetZoom() {
    this.setZoom(1);
    this.panX = 0;
    this.panY = 0;
  }
  setDraftCircle(cx: number, cy: number, r: number) {
    this.draftCircle = { cx, cy, r };
    this.render(useEditorStore.getState().shapes);
  }

  clearDraftCircle() {
    this.draftCircle = null;
    this.render(useEditorStore.getState().shapes);
  }

  setSelectionRect(
    rect: {
      x: number;
      y: number;
      w: number;
      h: number;
    } | null,
  ) {
    this.selectionRect = rect;
    this.render(useEditorStore.getState().shapes);
  }

  private drawSelection(shape: Shape) {
    this.ctx.save();
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeStyle = "#60a5fa";

    switch (shape.type) {
      case "circle":
        this.ctx.beginPath();
        this.ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
        this.ctx.stroke();
        break;

      default: {
        const bounds = this.getShapeBounds(shape);
        if (bounds) {
          this.ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
        }
      }
    }

    this.ctx.restore();
  }

  private getSelectionBounds(shapes: Shape[], selectedIds: string[]) {
    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));

    if (selectedShapes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    let hasBounds = false;

    for (const shape of selectedShapes) {
      const b = this.getShapeBounds(shape);
      if (!b) continue;

      hasBounds = true;

      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w);
      maxY = Math.max(maxY, b.y + b.h);
    }

    if (!hasBounds) return null;

    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    };
  }

  private drawSelectionBox(
    bounds: {
      x: number;
      y: number;
      w: number;
      h: number;
    },
    showHandles: boolean,
  ) {
    const padding = SELECTION_BOX_PADDING;

    this.ctx.save();
    this.ctx.setLineDash([6, 4]);
    this.ctx.strokeStyle = "#60a5fa";
    this.ctx.lineWidth = 1;

    this.ctx.strokeRect(
      bounds.x - padding,
      bounds.y - padding,
      bounds.w + padding * 2,
      bounds.h + padding * 2,
    );

    if (showHandles) {
      this.drawSelectionHandles({
        x: bounds.x - padding,
        y: bounds.y - padding,
        w: bounds.w + padding * 2,
        h: bounds.h + padding * 2,
      });
    }

    this.ctx.restore();
  }

  private drawRotateHandle(bounds: {
    x: number;
    y: number;
    w: number;
    h: number;
  }) {
    const padding = SELECTION_BOX_PADDING;
    const centerX = bounds.x + bounds.w / 2;
    const startY = bounds.y - padding;
    const handleY = startY - ROTATE_HANDLE_OFFSET;

    this.ctx.save();
    this.ctx.setLineDash([]);
    this.ctx.strokeStyle = "#60a5fa";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.lineWidth = 1.5;

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, startY);
    this.ctx.lineTo(centerX, handleY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(centerX, handleY, ROTATE_HANDLE_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawSelectionHandles(bounds: {
    x: number;
    y: number;
    w: number;
    h: number;
  }) {
    const size = SELECTION_HANDLE_SIZE;
    const radius = size / 2;
    const points = [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.w / 2, y: bounds.y },
      { x: bounds.x + bounds.w, y: bounds.y },
      { x: bounds.x + bounds.w, y: bounds.y + bounds.h / 2 },
      { x: bounds.x + bounds.w, y: bounds.y + bounds.h },
      { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h },
      { x: bounds.x, y: bounds.y + bounds.h },
      { x: bounds.x, y: bounds.y + bounds.h / 2 },
    ];

    this.ctx.save();
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.strokeStyle = "#60a5fa";
    this.ctx.lineWidth = 1.5;

    for (const p of points) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawLineHandles(shape: Shape) {
    if (shape.type !== "line" && shape.type !== "arrow") return;
    const size = SELECTION_HANDLE_SIZE;
    const radius = size / 2;
    const points =
      shape.type === "arrow" && shape.controlPoint
        ? [shape.startPoint, this.getArrowMidPoint(shape), shape.endPoint]
        : [shape.startPoint, shape.endPoint];

    this.ctx.save();
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.strokeStyle = "#60a5fa";
    this.ctx.lineWidth = 1.5;

    for (const p of points) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
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

  private getShapeBounds(shape: Shape) {
    switch (shape.type) {
      case "rect":
        return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
      case "text":
        return {
          x: shape.x,
          y: shape.y - shape.h,
          w: shape.w,
          h: shape.h,
        };
      case "line":
      case "arrow": {
        const points = [
          shape.startPoint,
          shape.endPoint,
          shape.controlPoint ?? shape.startPoint,
        ];
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      }
      case "line": {
        const x = Math.min(shape.startPoint.x, shape.endPoint.x);
        const y = Math.min(shape.startPoint.y, shape.endPoint.y);
        const w = Math.abs(shape.startPoint.x - shape.endPoint.x);
        const h = Math.abs(shape.startPoint.y - shape.endPoint.y);
        return { x, y, w, h };
      }
      case "circle":
        return {
          x: shape.cx - shape.r,
          y: shape.cy - shape.r,
          w: shape.r * 2,
          h: shape.r * 2,
        };
      case "rhombus": {
        const xs = [
          shape.top.x!,
          shape.right.x!,
          shape.bottom.x!,
          shape.left.x!,
        ];
        const ys = [
          shape.top.y!,
          shape.right.y!,
          shape.bottom.y!,
          shape.left.y!,
        ];

        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        return {
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
        };
      }

      case "pencil": {
        const xs = shape.points.map((p) => p.x);
        const ys = shape.points.map((p) => p.y);
        return {
          x: Math.min(...xs),
          y: Math.min(...ys),
          w: Math.max(...xs) - Math.min(...xs),
          h: Math.max(...ys) - Math.min(...ys),
        };
      }
    }
  }

  clearSelectionRect() {
    this.selectionRect = null;
  }
  startDraftArrow(startPoint: Point) {
    this.draftArrow = {
      startPoint,
      endPoint: startPoint,
    };
  }

  setDraftArrow(startPoint: Point, endPoint: Point) {
    if (!this.draftArrow) return;

    this.draftArrow.startPoint = startPoint;
    this.draftArrow.endPoint = endPoint;

    this.render(useEditorStore.getState().shapes);
  }

  startDraftLine(startPoint: Point) {
    this.draftLine = {
      startPoint,
      endPoint: startPoint,
    };
  }
  getCurrentSelectionBounds() {
    const { shapes, selectedShapeIds } = useEditorStore.getState();
    return this.getSelectionBounds(shapes, selectedShapeIds);
  }
  setDraftLine(startPoint: Point, endPoint: Point) {
    if (!this.draftLine) return;
    this.draftLine.startPoint = startPoint;
    this.draftLine.endPoint = endPoint;
    this.render(useEditorStore.getState().shapes);
  }

  setdraftPencil(points: Point[]) {
    this.draftPencil = points;
    this.render(useEditorStore.getState().shapes);
  }

  setDraftRect(x: number, y: number, w: number, h: number) {
    this.draftRect = { x, y, w, h };
    this.render(useEditorStore.getState().shapes);
  }
  setDraftRhom(top: Point, bottom: Point, left: Point, right: Point) {
    this.draftRhom = { top, bottom, left, right };
    this.render(useEditorStore.getState().shapes);
  }

  clearAllDrafts() {
    this.draftLine = null;
    this.selectionRect = null;
    this.draftArrow = null;
    this.draftPencil = null;
    this.draftRect = null;
    this.draftRhom = null;
    this.draftCircle = null;
  }

  static getInstance() {
    if (!CanvasManager.instance) CanvasManager.instance = new CanvasManager();
    return CanvasManager.instance;
  }

  init(canvas: HTMLCanvasElement) {
    if (this.canvas) return;
    this.canvas = canvas;
    this.dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * this.dpr;
    canvas.height = rect.height * this.dpr;

    this.ctx = canvas.getContext("2d")!;

    this.ctx.setTransform(
      this.dpr * this.zoom,
      0,
      0,
      this.dpr * this.zoom,
      this.panX * this.dpr,
      this.panY * this.dpr,
    );
    this.bindEvents();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;

    this.ctx.setTransform(
      this.dpr * this.zoom,
      0,
      0,
      this.dpr * this.zoom,
      this.panX * this.dpr,
      this.panY * this.dpr,
    );

    this.render();
  }
  render(shapes?: Shape[]) {
    const finalShapes = shapes ?? useEditorStore.getState().shapes;
    const { selectedShapeIds, cursors } = useEditorStore.getState();
    const selectionBounds = this.getSelectionBounds(
      finalShapes,
      selectedShapeIds,
    );
    const singleSelected =
      selectedShapeIds.length === 1
        ? finalShapes.find((s) => s.id === selectedShapeIds[0])
        : null;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(
      this.dpr * this.zoom,
      0,
      0,
      this.dpr * this.zoom,
      this.panX * this.dpr,
      this.panY * this.dpr,
    );
    this.ctx.save();
    this.ctx.strokeStyle = "#000000";
    this.ctx.fillStyle = "#000000";

    for (const shape of finalShapes) {
      this.drawShape(shape);

      // if (selectedShapeIds.includes(shape.id)) {
      //   this.drawSelection(shape);
      // }
    }
    if (!this.editingTextId && selectionBounds) {
      const showHandles =
        selectedShapeIds.length === 1 &&
        singleSelected &&
        singleSelected.type !== "line" &&
        singleSelected.type !== "arrow";
      this.drawSelectionBox(selectionBounds, showHandles);
      if (selectedShapeIds.length === 1) {
        this.drawRotateHandle(selectionBounds);
      }
    }
    if (!this.editingTextId && singleSelected) {
      this.drawLineHandles(singleSelected);
    }
    this.ctx.restore();
    const previewStroke =
      useEditorStore.getState().currentStyle.stroke ?? DEFAULT_SHAPE_STYLE.stroke;

    if (this.draftRect) {
      this.ctx.save();

      this.ctx.setLineDash([6, 4]); // dashed preview
      this.ctx.strokeStyle = previewStroke;

      this.ctx.strokeRect(
        this.draftRect.x,
        this.draftRect.y,
        this.draftRect.w,
        this.draftRect.h,
      );

      this.ctx.restore();
    }
    if (this.draftRhom) {
      this.ctx.save();

      this.ctx.setLineDash([6, 4]); // dashed preview
      this.ctx.strokeStyle = previewStroke;

      this.ctx.beginPath();
      this.ctx.moveTo(this.draftRhom.top.x!, this.draftRhom.top.y!);
      this.ctx.lineTo(this.draftRhom.right.x!, this.draftRhom.right.y!);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.draftRhom.right.x!, this.draftRhom.right.y!);
      this.ctx.lineTo(this.draftRhom.bottom.x!, this.draftRhom.bottom.y!);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.draftRhom.bottom.x!, this.draftRhom.bottom.y!);
      this.ctx.lineTo(this.draftRhom.left.x!, this.draftRhom.left.y!);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.draftRhom.left.x!, this.draftRhom.left.y!);
      this.ctx.lineTo(this.draftRhom.top.x!, this.draftRhom.top.y!);
      this.ctx.stroke();

      this.ctx.restore();
    }

    if (this.draftPencil && this.draftPencil.length > 1) {
      this.ctx.save();
      this.ctx.setLineDash([6, 4]);
      this.ctx.strokeStyle = previewStroke;

      this.ctx.beginPath();
      this.ctx.moveTo(this.draftPencil[0]?.x!, this.draftPencil[0]?.y!);

      for (const p of this.draftPencil.slice(1)) {
        this.ctx.lineTo(p.x, p.y);
      }

      this.ctx.stroke();
      this.ctx.restore();
    }
    if (
      this.draftLine &&
      this.draftLine.startPoint &&
      this.draftLine.endPoint
    ) {
      this.ctx.save();
      this.ctx.setLineDash([6, 4]);
      this.ctx.strokeStyle = previewStroke;

      this.ctx.beginPath();
      this.ctx.moveTo(this.draftLine.startPoint.x, this.draftLine.startPoint.y);
      this.ctx.lineTo(this.draftLine.endPoint.x, this.draftLine.endPoint.y);
      this.ctx.stroke();
      this.ctx.restore();
    }
    if (
      this.draftArrow &&
      this.draftArrow.startPoint &&
      this.draftArrow.endPoint
    ) {
      const headLength = 12; // size of arrow head
      const headAngle = Math.PI / 6; // 30°
      const x1 = this.draftArrow.startPoint.x,
        x2 = this.draftArrow.endPoint.x,
        y1 = this.draftArrow.startPoint.y,
        y2 = this.draftArrow.endPoint.y;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      this.ctx.save();
      this.ctx.setLineDash([6, 4]);
      this.ctx.strokeStyle = previewStroke;

      this.ctx.beginPath();
      this.ctx.moveTo(
        this.draftArrow.startPoint.x,
        this.draftArrow.startPoint.y,
      );
      this.ctx.lineTo(this.draftArrow.endPoint.x, this.draftArrow.endPoint.y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.draftArrow.endPoint.x, this.draftArrow.endPoint.y);
      this.ctx.lineTo(
        x2 - headLength * Math.cos(angle - headAngle),
        y2 - headLength * Math.sin(angle - headAngle),
      );
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.draftArrow.endPoint.x, this.draftArrow.endPoint.y);
      this.ctx.lineTo(
        x2 - headLength * Math.cos(angle + headAngle),
        y2 - headLength * Math.sin(angle + headAngle),
      );
      this.ctx.stroke();
      this.ctx.restore();
    }
    if (this.selectionRect) {
      this.ctx.save();
      this.ctx.setLineDash([6, 4]);
      this.ctx.strokeStyle = "#60a5fa";

      this.ctx.strokeRect(
        this.selectionRect.x,
        this.selectionRect.y,
        this.selectionRect.w,
        this.selectionRect.h,
      );

      this.ctx.restore();
    }
    if (this.draftCircle) {
      this.ctx.save();
      this.ctx.setLineDash([6, 4]);
      this.ctx.strokeStyle = previewStroke;

      this.ctx.beginPath();
      this.ctx.arc(
        this.draftCircle.cx,
        this.draftCircle.cy,
        this.draftCircle.r,
        0,
        Math.PI * 2,
      );
      this.ctx.stroke();

      this.ctx.restore();
    }

    // Render cursors on top of everything (after all draft shapes)
    this.renderCursors(Array.from(cursors.values()));
  }

  private drawShape(shape: Shape) {
    const stroke = shape.stroke ?? DEFAULT_SHAPE_STYLE.stroke;
    const fill = shape.fill ?? DEFAULT_SHAPE_STYLE.fill;
    const strokeWidth = shape.strokeWidth ?? DEFAULT_SHAPE_STYLE.strokeWidth;
    const opacity = shape.opacity ?? DEFAULT_SHAPE_STYLE.opacity;
    const strokeStyle = shape.strokeStyle ?? DEFAULT_SHAPE_STYLE.strokeStyle;
    const sloppiness = shape.sloppiness ?? DEFAULT_SHAPE_STYLE.sloppiness;
    const edgeStyle = shape.edgeStyle ?? DEFAULT_SHAPE_STYLE.edgeStyle;
    const rotation = shape.rotation ?? DEFAULT_SHAPE_STYLE.rotation;
    const shouldFill =
      typeof fill === "string" &&
      fill !== "transparent" &&
      fill !== "none" &&
      fill !== "";

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.lineJoin = edgeStyle === "round" ? "round" : "miter";
    this.ctx.lineCap = sloppiness > 0 ? "round" : "butt";
    switch (strokeStyle) {
      case "dashed":
        this.ctx.setLineDash([8, 6]);
        break;
      case "dotted":
        this.ctx.setLineDash([2, 6]);
        break;
      default:
        this.ctx.setLineDash([]);
        break;
    }

    if (rotation !== 0) {
      const bounds = this.getShapeBounds(shape);
      if (bounds) {
        const centerX = bounds.x + bounds.w / 2;
        const centerY = bounds.y + bounds.h / 2;
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(rotation);
        this.ctx.translate(-centerX, -centerY);
      }
    }

    switch (shape.type) {
      case "rect":
        this.drawWithSloppiness(shape, sloppiness, () => {
          this.ctx.beginPath();
          if (edgeStyle === "round") {
            const radius = Math.min(8, Math.abs(shape.w) / 6, Math.abs(shape.h) / 6);
            if (typeof this.ctx.roundRect === "function") {
              this.ctx.roundRect(shape.x, shape.y, shape.w, shape.h, radius);
            } else {
              this.drawRoundedRectPath(shape.x, shape.y, shape.w, shape.h, radius);
            }
          } else {
            this.ctx.rect(shape.x, shape.y, shape.w, shape.h);
          }
          if (shouldFill) {
            this.ctx.fillStyle = fill;
            this.ctx.fill();
          }
          this.ctx.stroke();
        });
        break;
      case "text":
        if (this.editingTextId === shape.id) {
          this.ctx.restore();
          return;
        }
        this.ctx.font = `${shape.fontSize}px ${shape.fontFamily}`;
        this.ctx.fillStyle = shape.stroke ?? shape.color ?? stroke;
        this.ctx.fillText(shape.text, shape.x, shape.y);
        break;
      case "circle":
        this.drawWithSloppiness(shape, sloppiness, () => {
          this.ctx.beginPath();
          this.ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
          if (shouldFill) {
            this.ctx.fillStyle = fill;
            this.ctx.fill();
          }
          this.ctx.stroke();
        });
        break;

      case "rhombus":
        this.drawWithSloppiness(shape, sloppiness, () => {
          this.ctx.beginPath();
          this.ctx.moveTo(shape.top.x!, shape.top.y!);
          this.ctx.lineTo(shape.right.x!, shape.right.y!);
          this.ctx.lineTo(shape.bottom.x!, shape.bottom.y!);
          this.ctx.lineTo(shape.left.x!, shape.left.y!);
          this.ctx.lineTo(shape.top.x!, shape.top.y!);
          this.ctx.closePath();
          if (shouldFill) {
            this.ctx.fillStyle = fill;
            this.ctx.fill();
          }
          this.ctx.stroke();
        });
        break;
      case "pencil":
        this.drawWithSloppiness(shape, sloppiness, () => {
          this.ctx.beginPath();
          this.ctx.moveTo(shape.points[0]?.x!, shape.points[0]?.y!);
          for (const p of shape.points.slice(1)) {
            this.ctx.lineTo(p.x, p.y);
          }
          this.ctx.stroke();
        });
        break;
      case "line":
        this.drawWithSloppiness(shape, sloppiness, () => {
          this.ctx.beginPath();
          this.ctx.moveTo(shape.startPoint.x, shape.startPoint.y);
          this.ctx.lineTo(shape.endPoint.x, shape.endPoint.y);

          this.ctx.stroke();
        });
        break;
      case "arrow":
        this.drawWithSloppiness(shape, sloppiness, () => {
          const headLength = 12; // size of arrow head
          const headAngle = Math.PI / 6; // 30°
          const x2 = shape.endPoint.x;
          const y2 = shape.endPoint.y;
          const control =
            shape.controlPoint ??
            ({
              x: (shape.startPoint.x + shape.endPoint.x) / 2,
              y: (shape.startPoint.y + shape.endPoint.y) / 2,
            } as const);
          const angle = Math.atan2(y2 - control.y, x2 - control.x);

          this.ctx.beginPath();
          this.ctx.moveTo(shape.startPoint.x, shape.startPoint.y);
          if (shape.controlPoint) {
            this.ctx.quadraticCurveTo(control.x, control.y, x2, y2);
          } else {
            this.ctx.lineTo(x2, y2);
          }
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(x2, y2);
          this.ctx.lineTo(
            x2 - headLength * Math.cos(angle - headAngle),
            y2 - headLength * Math.sin(angle - headAngle),
          );
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(x2, y2);
          this.ctx.lineTo(
            x2 - headLength * Math.cos(angle + headAngle),
            y2 - headLength * Math.sin(angle + headAngle),
          );
          this.ctx.stroke();
        });
        break;
    }
    this.ctx.restore();
  }

  private drawWithSloppiness(
    shape: Shape,
    sloppiness: number,
    draw: () => void,
  ) {
    if (shape.type === "text" || sloppiness <= 0) {
      draw();
      return;
    }
    draw();
    const jitter = sloppiness === 2 ? 3 : 1.5;
    const offset = this.getJitterOffset(shape.id, jitter);
    this.ctx.save();
    this.ctx.translate(offset.x, offset.y);
    draw();
    this.ctx.restore();
  }

  private getJitterOffset(id: string, amount: number) {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) | 0;
    }
    const rand = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    const x = (rand(hash + 1) - 0.5) * 2 * amount;
    const y = (rand(hash + 2) - 0.5) * 2 * amount;
    return { x, y };
  }

  private drawRoundedRectPath(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    const radius = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    this.ctx.moveTo(x + radius, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, radius);
    this.ctx.arcTo(x + w, y + h, x, y + h, radius);
    this.ctx.arcTo(x, y + h, x, y, radius);
    this.ctx.arcTo(x, y, x + w, y, radius);
    this.ctx.closePath();
  }
  clear() {
    const bg = getComputedStyle(this.canvas).backgroundColor;

    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  private onPointerDown = (e: PointerEvent) => {
    // 🖐 SPACE + CLICK → PAN
    if (this.isSpacePressed) {
      this.startPan(e);
      return; // ⛔ DO NOT forward to active tool
    }

    this.activeTool?.onPointerDown(e);
  };
  private onPointerMove = (e: PointerEvent) => {
    if (this.isPanning) {
      this.movePan(e);
      return;
    }

    this.activeTool?.onPointerMove(e);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.isPanning) {
      this.endPan();
      return;
    }

    this.activeTool?.onPointerUp(e);
  };
  private onDoubleClick = (e: MouseEvent) => {
    this.activeTool?.onDoubleClick?.(e);
  };

  bindEvents() {
    const isTypingTarget = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    const toolShortcuts: Record<string, ToolType> = {
      "1": "hand",
      "2": "select",
      "3": "rect",
      "4": "rhombus",
      "5": "circle",
      "6": "arrow",
      "7": "line",
      "8": "pencil",
      "9": "text",
      "0": "eraser",
    };

    this.canvas.addEventListener("pointerdown", (e) => {
      if (this.activeTool?.constructor.name === "TextTool") {
        e.preventDefault();
        e.stopPropagation();
      }
      this.onPointerDown(e);
    });
    this.canvas.addEventListener("dblclick", this.onDoubleClick);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        this.isSpacePressed = true;
        this.canvas.style.cursor = "grab";
      }

      const isMeta = e.ctrlKey || e.metaKey;
      if (isMeta && !this.editingTextId) {
        if (e.key.toLowerCase() === "z") {
          const { undo, redo } = useEditorStore.getState();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          this.render();
          e.preventDefault();
          return;
        }
        if (e.key.toLowerCase() === "y") {
          useEditorStore.getState().redo();
          this.render();
          e.preventDefault();
          return;
        }
      }

      const shouldHandleToolShortcut =
        !isMeta &&
        !e.altKey &&
        !this.editingTextId &&
        !isTypingTarget(e.target);
      if (shouldHandleToolShortcut) {
        const key = e.key.toLowerCase();
        if (key === "q") {
          useEditorStore.getState().toggleToolLocked();
          e.preventDefault();
          return;
        }
        const nextTool = toolShortcuts[key];
        if (nextTool) {
          useEditorStore.getState().setTool(nextTool);
          e.preventDefault();
          return;
        }
      }

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !this.editingTextId &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        const { selectedShapeIds, removeShape, setSelectedShapeIds } =
          useEditorStore.getState();
        if (selectedShapeIds.length > 0) {
          for (const id of selectedShapeIds) {
            removeShape(id);
          }
          setSelectedShapeIds([]);
          this.render();
          e.preventDefault();
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        this.isSpacePressed = false;
        this.isPanning = false;
        this.canvas.style.cursor = "default";
      }
    });
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
  }
  toCanvasPoint(e: PointerEvent | { clientX: number; clientY: number }) {
    const rect = this.canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return {
      x: (x - this.panX) / this.zoom,
      y: (y - this.panY) / this.zoom,
    };
  }

  toScreenPoint(point: Point) {
    return {
      x: point.x * this.zoom + this.panX,
      y: point.y * this.zoom + this.panY,
    };
  }

  getZoom() {
    return this.zoom;
  }

  setEditingTextId(id: string | null) {
    this.editingTextId = id;
    if (!id) {
      this.editingTextBounds = null;
    }
    this.render();
  }

  setEditingTextBounds(bounds: { x: number; y: number; w: number; h: number } | null) {
    this.editingTextBounds = bounds;
    this.render();
  }

  setActiveTool(tool: ToolController | null) {
    if (!this.canvas) {
      this.activeTool = tool;
      return;
    }
    this.activeTool?.onDeactivate?.(this.canvas);

    this.activeTool = tool;

    // activate new tool
    this.activeTool?.onActivate?.(this.canvas);
  }

  renderCursors(cursors: Array<{ userId: string; username: string; x: number; y: number }>) {
    if (!this.canvas || !this.ctx || cursors.length === 0) return;

    // Render cursors on top of everything
    // Note: This is called after ctx.restore(), so we're in screen space
    // We need to apply the transform manually for cursor rendering
    this.ctx.save();
    
    // Apply the same transform as the main render
    this.ctx.setTransform(
      this.dpr * this.zoom,
      0,
      0,
      this.dpr * this.zoom,
      this.panX * this.dpr,
      this.panY * this.dpr,
    );
    
    const cursorColors = [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#14b8a6",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f43f5e",
    ];
    const getCursorColor = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i += 1) {
        hash = (hash * 31 + id.charCodeAt(i)) | 0;
      }
      const index = Math.abs(hash) % cursorColors.length;
      return cursorColors[index] ?? "#3b82f6";
    };

    const selfCursorId =
      typeof window !== "undefined" ? sessionStorage.getItem("drawflow:cursorId") : null;

    // Cursors are in canvas coordinates, so we can draw them directly
    for (const cursor of cursors) {
      if (selfCursorId && cursor.userId === selfCursorId) {
        continue;
      }

      const color = getCursorColor(cursor.userId ?? cursor.username ?? "user");
      // Draw cursor pointer (mouse arrow)
      const s = 8.5 / this.zoom;
      const x = cursor.x;
      const y = cursor.y;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + s * 0.2, y + s * 1.8);
      this.ctx.lineTo(x + s * 0.6, y + s * 1.3);
      this.ctx.lineTo(x + s * 1.1, y + s * 2.2);
      this.ctx.lineTo(x + s * 1.4, y + s * 2.0);
      this.ctx.lineTo(x + s * 0.9, y + s * 1.1);
      this.ctx.lineTo(x + s * 1.7, y + s * 1.1);
      this.ctx.closePath();
      this.ctx.fillStyle = "#ffffff";
      this.ctx.strokeStyle = "#111827";
      this.ctx.lineWidth = 1 / this.zoom;
      this.ctx.fill();
      this.ctx.stroke();

      // Draw username below cursor
      this.ctx.font = `${12 / this.zoom}px sans-serif`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "top";

      const textMetrics = this.ctx.measureText(cursor.username);
      const textWidth = textMetrics.width;
      const textHeight = 14 / this.zoom;
      const padding = 4 / this.zoom;
      const gap = 2 / this.zoom;
      const labelTop = cursor.y + s * 2.2 + gap;

      // Draw background rectangle for text
      this.ctx.fillStyle = "#ffffff";
      this.ctx.strokeStyle = "#e5e7eb";
      this.ctx.lineWidth = 1 / this.zoom;
      this.ctx.fillRect(
        cursor.x - textWidth / 2 - padding,
        labelTop,
        textWidth + padding * 2,
        textHeight + padding
      );
      this.ctx.strokeRect(
        cursor.x - textWidth / 2 - padding,
        labelTop,
        textWidth + padding * 2,
        textHeight + padding
      );

      // Draw text
      this.ctx.fillStyle = color;
      this.ctx.fillText(cursor.username, cursor.x, labelTop + padding / 2);
    }

    this.ctx.restore();
  }
}

export default CanvasManager;
