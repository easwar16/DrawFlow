import { Point } from "@/types/shape/shape";
import type { Shape, ToolController } from "../utils";
import { useEditorStore } from "@/store/editor";

class CanvasManager {
  private static instance: CanvasManager | null = null;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private dpr = 1;
  private activeTool: ToolController | null = null;

  private zoom = 1;
  private panX = 0;
  private panY = 0;

  private zoomSubscribers = new Set<(zoom: number) => void>();

  private MIN_ZOOM = 0.1;
  private MAX_ZOOM = 4;

  private panning = false;
  private panStart!: Point;

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

  getZoom() {
    return this.zoom;
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

    for (const shape of selectedShapes) {
      const b = this.getShapeBounds(shape);
      if (!b) continue;

      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w);
      maxY = Math.max(maxY, b.y + b.h);
    }

    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    };
  }

  private drawSelectionBox(bounds: {
    x: number;
    y: number;
    w: number;
    h: number;
  }) {
    const padding = 6;

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

    this.ctx.restore();
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
    const { selectedShapeIds } = useEditorStore.getState();
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
    const bounds = this.getSelectionBounds(finalShapes, selectedShapeIds);

    if (bounds) {
      this.drawSelectionBox(bounds);
    }
    this.ctx.restore();
    if (this.draftRect) {
      this.ctx.save();

      this.ctx.setLineDash([6, 4]); // dashed preview
      this.ctx.strokeStyle = "#000000";

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
      this.ctx.strokeStyle = "#000000";

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
      this.ctx.strokeStyle = "#000000";

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
      this.ctx.strokeStyle = "#000000";

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
      this.ctx.strokeStyle = "#000000";

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
      this.ctx.strokeStyle = "#000";

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
  }

  private drawShape(shape: Shape) {
    switch (shape.type) {
      case "rect":
        this.ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
        break;
      case "text":
        this.ctx.save();
        this.ctx.font = `${shape.fontSize}px ${shape.fontFamily}`;
        this.ctx.fillStyle = shape.color;
        this.ctx.fillText(shape.text, shape.x, shape.y);
        this.ctx.restore();
        break;
      case "circle":
        this.ctx.beginPath();
        this.ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
        this.ctx.stroke();
        break;

      case "rhombus":
        this.ctx.beginPath();
        this.ctx.moveTo(shape.top.x!, shape.top.y!);
        this.ctx.lineTo(shape.right.x!, shape.right.y!);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(shape.right.x!, shape.right.y!);
        this.ctx.lineTo(shape.bottom.x!, shape.bottom.y!);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(shape.bottom.x!, shape.bottom.y!);
        this.ctx.lineTo(shape.left.x!, shape.left.y!);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(shape.left.x!, shape.left.y!);
        this.ctx.lineTo(shape.top.x!, shape.top.y!);
        this.ctx.stroke();
        break;
      case "pencil":
        this.ctx.beginPath();
        this.ctx.moveTo(shape.points[0]?.x!, shape.points[0]?.y!);
        for (const p of shape.points.slice(1)) {
          this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.stroke();
        break;
      case "line":
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startPoint.x, shape.startPoint.y);
        this.ctx.lineTo(shape.endPoint.x, shape.endPoint.y);

        this.ctx.stroke();
        break;
      case "arrow":
        const headLength = 12; // size of arrow head
        const headAngle = Math.PI / 6; // 30°
        const x1 = shape.startPoint.x,
          x2 = shape.endPoint.x,
          y1 = shape.startPoint.y,
          y2 = shape.endPoint.y;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startPoint.x, shape.startPoint.y);
        this.ctx.lineTo(shape.endPoint.x, shape.endPoint.y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(shape.endPoint.x, shape.endPoint.y);
        this.ctx.lineTo(
          x2 - headLength * Math.cos(angle - headAngle),
          y2 - headLength * Math.sin(angle - headAngle),
        );
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(shape.endPoint.x, shape.endPoint.y);
        this.ctx.lineTo(
          x2 - headLength * Math.cos(angle + headAngle),
          y2 - headLength * Math.sin(angle + headAngle),
        );
        this.ctx.stroke();
        break;
    }
  }
  clear() {
    const bg = getComputedStyle(this.canvas).backgroundColor;

    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private onPointerDown = (e: PointerEvent) => {
    console.log("POINTER DOWN", this.activeTool);
    this.activeTool?.onPointerDown(e);
  };

  private onPointerMove = (e: PointerEvent) => {
    this.activeTool?.onPointerMove(e);
  };

  private onPointerUp = (e: PointerEvent) => {
    this.activeTool?.onPointerUp(e);
  };

  bindEvents() {
    this.canvas.addEventListener("pointerdown", (e) => {
      if (this.activeTool?.constructor.name === "TextTool") {
        e.preventDefault();
        e.stopPropagation();
      }
      this.onPointerDown(e);
    });
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });

    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
  }
  toCanvasPoint(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return {
      x: (x - this.panX) / this.zoom,
      y: (y - this.panY) / this.zoom,
    };
  }

  setActiveTool(tool: ToolController | null) {
    this.activeTool = tool;
  }
}

export default CanvasManager;
