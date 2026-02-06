"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/store/editor";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_SHAPE_STYLE, Shape } from "@/lib/utils";

const colorInputClass =
  "h-9 w-9 rounded-md border border-gray-200 dark:border-gray-700 p-0 overflow-hidden bg-transparent";

const colorSwatches = [
  "#1f2937",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
];

const swatchClassBase =
  "h-8 w-8 rounded-md border border-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-500";

const separatorClass = "h-6 w-px bg-gray-200 dark:bg-gray-700";
const strokeWidthOptions = [1, 3, 6];
const strokeStyleOptions = [
  { id: "solid", label: "Solid", className: "border-t-2 border-gray-900" },
  { id: "dashed", label: "Dashed", className: "border-t-2 border-dashed border-gray-900" },
  { id: "dotted", label: "Dotted", className: "border-t-2 border-dotted border-gray-900" },
];
const sloppinessOptions = [
  { id: 0, label: "Precise", path: "M4 10 L20 10" },
  { id: 1, label: "Wavy", path: "M4 10 C8 6, 12 14, 20 10" },
  { id: 2, label: "Rough", path: "M4 12 C8 4, 12 16, 20 8" },
];
const edgeOptions = [
  { id: "sharp", label: "Sharp", rounded: false },
  { id: "round", label: "Round", rounded: true },
];

export default function PropertiesPanel() {
  const shapes = useEditorStore((s) => s.shapes);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);
  const updateShape = useEditorStore((s) => s.updateShape);
  const removeShape = useEditorStore((s) => s.removeShape);
  const addShape = useEditorStore((s) => s.addShape);
  const setCurrentStyle = useEditorStore((s) => s.setCurrentStyle);
  const [position, setPosition] = useState({ x: 16, y: 80 });
  const dragState = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    pointerId: number;
  } | null>(null);

  const selectedShapes = useMemo(
    () => shapes.filter((shape) => selectedShapeIds.includes(shape.id)),
    [shapes, selectedShapeIds],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState.current) return;
      const dx = event.clientX - dragState.current.startX;
      const dy = event.clientY - dragState.current.startY;
      setPosition({
        x: dragState.current.originX + dx,
        y: dragState.current.originY + dy,
      });
    };

    const handlePointerUp = () => {
      dragState.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  if (selectedShapes.length === 0) return null;

  const primary = selectedShapes[0]!;
  const stroke = primary.stroke ?? DEFAULT_SHAPE_STYLE.stroke;
  const fill = primary.fill ?? DEFAULT_SHAPE_STYLE.fill;
  const strokeWidth = primary.strokeWidth ?? DEFAULT_SHAPE_STYLE.strokeWidth;
  const opacity = primary.opacity ?? DEFAULT_SHAPE_STYLE.opacity;
  const strokeStyle = primary.strokeStyle ?? DEFAULT_SHAPE_STYLE.strokeStyle;
  const sloppiness = primary.sloppiness ?? DEFAULT_SHAPE_STYLE.sloppiness;
  const edgeStyle = primary.edgeStyle ?? DEFAULT_SHAPE_STYLE.edgeStyle;

  const applyToSelection = (updater: (shape: Shape) => Shape) => {
    for (const shape of selectedShapes) {
      updateShape(shape.id, updater);
    }
  };

  const updateStroke = (value: string) => {
    setCurrentStyle({ stroke: value });
    applyToSelection((shape) => {
      const next = { ...shape, stroke: value };
      if (shape.type === "text") {
        return { ...next, color: value };
      }
      return next;
    });
  };

  const updateFill = (value: string) => {
    setCurrentStyle({ fill: value });
    applyToSelection((shape) => ({ ...shape, fill: value }));
  };

  const updateStrokeWidth = (value: number) => {
    setCurrentStyle({ strokeWidth: value });
    applyToSelection((shape) => ({ ...shape, strokeWidth: value }));
  };

  const updateStrokeStyle = (value: "solid" | "dashed" | "dotted") => {
    setCurrentStyle({ strokeStyle: value });
    applyToSelection((shape) => ({ ...shape, strokeStyle: value }));
  };

  const updateSloppiness = (value: 0 | 1 | 2) => {
    setCurrentStyle({ sloppiness: value });
    applyToSelection((shape) => ({ ...shape, sloppiness: value }));
  };

  const updateEdgeStyle = (value: "sharp" | "round") => {
    setCurrentStyle({ edgeStyle: value });
    applyToSelection((shape) => ({ ...shape, edgeStyle: value }));
  };

  const updateOpacity = (value: number) => {
    setCurrentStyle({ opacity: value });
    applyToSelection((shape) => ({ ...shape, opacity: value }));
  };

  const deleteSelection = () => {
    for (const shape of selectedShapes) {
      removeShape(shape.id);
    }
  };

  const duplicateSelection = () => {
    for (const shape of selectedShapes) {
      const id = crypto.randomUUID();
      const offset = { x: 12, y: 12 };
      switch (shape.type) {
        case "rect":
          addShape({ ...shape, id, x: shape.x + offset.x, y: shape.y + offset.y });
          break;
        case "circle":
          addShape({
            ...shape,
            id,
            cx: shape.cx + offset.x,
            cy: shape.cy + offset.y,
          });
          break;
        case "rhombus":
          addShape({
            ...shape,
            id,
            top: { x: shape.top.x + offset.x, y: shape.top.y + offset.y },
            right: { x: shape.right.x + offset.x, y: shape.right.y + offset.y },
            bottom: { x: shape.bottom.x + offset.x, y: shape.bottom.y + offset.y },
            left: { x: shape.left.x + offset.x, y: shape.left.y + offset.y },
          });
          break;
        case "pencil":
          addShape({
            ...shape,
            id,
            points: shape.points.map((pt) => ({
              x: pt.x + offset.x,
              y: pt.y + offset.y,
            })),
          });
          break;
        case "line":
        case "arrow":
          addShape({
            ...shape,
            id,
            startPoint: {
              x: shape.startPoint.x + offset.x,
              y: shape.startPoint.y + offset.y,
            },
            endPoint: {
              x: shape.endPoint.x + offset.x,
              y: shape.endPoint.y + offset.y,
            },
          });
          break;
        case "text":
          addShape({
            ...shape,
            id,
            x: shape.x + offset.x,
            y: shape.y + offset.y,
          });
          break;
        default:
          break;
      }
    }
  };

  return (
    <aside
      className="fixed z-40 w-72 rounded-xl bg-white/95 dark:bg-[#1f1f1f]/95 p-4 shadow-lg shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10"
      style={{ left: position.x, top: position.y }}
    >
      <div className="mb-2 flex justify-center">
        <div
          className="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700 cursor-grab active:cursor-grabbing"
          onPointerDown={startDrag}
          aria-label="Drag properties panel"
          role="button"
          tabIndex={0}
        />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Stroke</div>
          <div className="flex items-center gap-2">
            {colorSwatches.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Stroke ${color}`}
                className={`${swatchClassBase} ${
                  stroke === color ? "ring-2 ring-gray-900 dark:ring-gray-200" : ""
                }`}
                style={{ backgroundColor: color }}
                onClick={() => updateStroke(color)}
              />
            ))}
            <div className={separatorClass} />
            <input
              type="color"
              aria-label="Custom stroke color"
              className={colorInputClass}
              value={stroke}
              onChange={(e) => updateStroke(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Background</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="No fill"
              className={`${swatchClassBase} ${
                fill === "transparent"
                  ? "ring-2 ring-gray-900 dark:ring-gray-200"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => updateFill("transparent")}
            >
              <span className="block h-full w-full rounded-md bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0px]" />
            </button>
            {colorSwatches.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Fill ${color}`}
                className={`${swatchClassBase} ${
                  fill === color ? "ring-2 ring-gray-900 dark:ring-gray-200" : ""
                }`}
                style={{ backgroundColor: color }}
                onClick={() => updateFill(color)}
              />
            ))}
            <div className={separatorClass} />
            <input
              type="color"
              aria-label="Custom fill color"
              className={colorInputClass}
              value={fill === "transparent" ? "#ffffff" : fill}
              onChange={(e) => updateFill(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Stroke width</div>
          <div className="flex items-center gap-3">
            {strokeWidthOptions.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`Stroke width ${value}`}
                className={`h-10 w-12 rounded-lg border ${
                  strokeWidth === value
                    ? "bg-[#c7f3e2] border-transparent"
                    : "bg-gray-100 dark:bg-gray-800 border-transparent"
                }`}
                onClick={() => updateStrokeWidth(value)}
              >
                <span
                  className="block mx-auto rounded-full bg-gray-900 dark:bg-gray-100"
                  style={{ height: Math.max(2, value), width: value >= 6 ? 18 : 14 }}
                />
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Stroke style</div>
          <div className="flex items-center gap-3">
            {strokeStyleOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-label={option.label}
                className={`h-10 w-12 rounded-lg border ${
                  strokeStyle === option.id
                    ? "bg-[#c7f3e2] border-transparent"
                    : "bg-gray-100 dark:bg-gray-800 border-transparent"
                }`}
                onClick={() =>
                  updateStrokeStyle(option.id as "solid" | "dashed" | "dotted")
                }
              >
                <span
                  className={`block mx-auto w-5 ${option.className} dark:border-gray-100`}
                />
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Sloppiness</div>
          <div className="flex items-center gap-3">
            {sloppinessOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-label={option.label}
                className={`h-10 w-12 rounded-lg border ${
                  sloppiness === option.id
                    ? "bg-[#c7f3e2] border-transparent"
                    : "bg-gray-100 dark:bg-gray-800 border-transparent"
                }`}
                onClick={() => updateSloppiness(option.id as 0 | 1 | 2)}
              >
                <svg
                  viewBox="0 0 24 20"
                  className="mx-auto h-5 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={option.path} />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Edges</div>
          <div className="flex items-center gap-3">
            {edgeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-label={option.label}
                className={`h-10 w-12 rounded-lg border ${
                  edgeStyle === option.id
                    ? "bg-[#c7f3e2] border-transparent"
                    : "bg-gray-100 dark:bg-gray-800 border-transparent"
                }`}
                onClick={() => updateEdgeStyle(option.id as "sharp" | "round")}
              >
                <svg
                  viewBox="0 0 24 20"
                  className="mx-auto h-5 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin={option.rounded ? "round" : "miter"}
                >
                  <rect
                    x="4"
                    y="4"
                    width="14"
                    height="12"
                    rx={option.rounded ? "3" : "0"}
                    ry={option.rounded ? "3" : "0"}
                    strokeDasharray="2 2"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Opacity</div>
          <div className="flex items-center gap-3">
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round(opacity * 100)]}
              className="[&_[data-slot=slider-track]]:bg-emerald-100 [&_[data-slot=slider-range]]:bg-emerald-300 [&_[data-slot=slider-thumb]]:border-emerald-200 [&_[data-slot=slider-thumb]]:bg-white"
              onValueChange={(value) =>
                updateOpacity(((value[0] ?? 100) / 100) as number)
              }
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
              {Math.round(opacity * 100)}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Actions</div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Duplicate selection"
              onClick={duplicateSelection}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Delete selection"
              onClick={deleteSelection}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
