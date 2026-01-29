"use client";

import { useEffect, useRef } from "react";
import CanvasManager from "@/lib/canvas/CanvasManager";
import { useEditorStore } from "@/store/editor";
import { RectangleTool } from "@/lib/shapes/RectangleTool";
import { EraserTool } from "@/lib/shapes/EraserTool";
import { PencilTool } from "@/lib/shapes/PencilTool";
import { LineTool } from "@/lib/shapes/LineTool";
import { ArrowTool } from "@/lib/shapes/ArrowTool";
import { SelectTool } from "@/lib/shapes/SelectTool";
import { RhombusTool } from "@/lib/shapes/RhombusTool";
import { CircleTool } from "@/lib/shapes/CircleTool";
import { TextTool } from "@/lib/shapes/TextTool";
import { HandTool } from "@/lib/shapes/HandTool";

export default function CanvasComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapes = useEditorStore((s) => s.shapes);
  const currentTool = useEditorStore((s) => s.currentTool);
  const previousToolRef = useRef(currentTool);

  useEffect(() => {
    if (previousToolRef.current === "select" && currentTool !== "select") {
      useEditorStore.getState().setSelectedShapeIds([]);
    }
    previousToolRef.current = currentTool;

    const manager = CanvasManager.getInstance();
    console.log("currentTool: " + currentTool);
    switch (currentTool) {
      case "rect":
        manager.setActiveTool(new RectangleTool());
        break;
      case "hand":
        manager.setActiveTool(new HandTool());
        break;

      case "select":
        manager.setActiveTool(new SelectTool());
        break;
      case "pencil":
        manager.setActiveTool(new PencilTool()); // or SelectTool later
        break;
      case "circle":
        manager.setActiveTool(new CircleTool()); // or SelectTool later
        break;
      case "line":
        manager.setActiveTool(new LineTool()); // or SelectTool later
        break;
      case "arrow":
        manager.setActiveTool(new ArrowTool()); // or SelectTool later
        break;
      case "rhombus":
        manager.setActiveTool(new RhombusTool()); // or SelectTool later
        break;
      case "eraser":
        manager.setActiveTool(new EraserTool());
        break;
      case "text":
        manager.setActiveTool(new TextTool());
        break;
    }
  }, [currentTool]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const manager = CanvasManager.getInstance();
    manager.init(canvasRef.current);
  }, []);

  useEffect(() => {
    const manager = CanvasManager.getInstance();

    const onResize = () => manager.resize();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);
  // 3. render on shape change
  useEffect(() => {
    CanvasManager.getInstance().render(shapes);
    console.log(shapes);
  }, [shapes]);

  return (
    <div className="canvas-root w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
