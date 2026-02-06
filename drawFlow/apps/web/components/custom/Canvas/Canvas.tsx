"use client";

import { useEffect, useRef } from "react";
import CanvasManager from "@/lib/canvas/CanvasManager";
import { useEditorStore } from "@/store/editor";
import { wsManager } from "@/lib/websocket/websocket";
import { getUsername } from "@/lib/storage";
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
  const cursors = useEditorStore((s) => s.cursors);
  const roomId = useEditorStore((s) => s.roomId);
  const currentTool = useEditorStore((s) => s.currentTool);
  const previousToolRef = useRef(currentTool);
  const lastCursorUpdateRef = useRef<{ x: number; y: number } | null>(null);
  const cursorThrottleRef = useRef<number | null>(null);
  const selfCursorIdRef = useRef<string>(
    (() => {
      if (typeof window === "undefined") return "self";
      const key = "drawflow:cursorId";
      const existing = sessionStorage.getItem(key);
      if (existing) return existing;
      const id = `cursor-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(key, id);
      return id;
    })(),
  );

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
  // 3. render on shape or cursor change
  useEffect(() => {
    CanvasManager.getInstance().render(shapes);
    console.log(shapes);
  }, [shapes, cursors]);

  // 5. Track cursor movements and send via WebSocket
  useEffect(() => {
    if (!canvasRef.current || !roomId) return;

    const canvas = canvasRef.current;
    const manager = CanvasManager.getInstance();
    const selfId = selfCursorIdRef.current;

    const handlePointerMove = (e: PointerEvent) => {
      // Convert screen coordinates to canvas coordinates
      const canvasPoint = manager.toCanvasPoint({
        clientX: e.clientX,
        clientY: e.clientY,
      } as PointerEvent);

      // Throttle cursor updates (send max once per 50ms)
      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
      }

      cursorThrottleRef.current = window.setTimeout(() => {
        // Only send if position changed significantly (reduce network traffic)
        const lastPos = lastCursorUpdateRef.current;
        if (
          !lastPos ||
          Math.abs(lastPos.x - canvasPoint.x) > 2 ||
          Math.abs(lastPos.y - canvasPoint.y) > 2
        ) {
          if (roomId && wsManager.isConnected()) {
            const username = getUsername();
            wsManager.send({
              type: "cursor_move",
              roomId,
              x: canvasPoint.x,
              y: canvasPoint.y,
              username,
              clientId: selfId,
            });
          }
          lastCursorUpdateRef.current = { x: canvasPoint.x, y: canvasPoint.y };
        }
      }, 50);
    };

    canvas.addEventListener("pointermove", handlePointerMove);

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
      }
    };
  }, [roomId]);

  // 6. Clean up stale cursors (remove cursors that haven't updated in 3 seconds)
  useEffect(() => {
    if (!roomId) return;

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const state = useEditorStore.getState();
      const newCursors = new Map(state.cursors);

      let hasChanges = false;
      for (const [userId, cursor] of newCursors.entries()) {
        if (now - cursor.lastSeen > 3000) {
          // 3 seconds timeout
          newCursors.delete(userId);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        useEditorStore.setState({ cursors: newCursors });
      }
    }, 1000); // Check every second

    return () => clearInterval(cleanupInterval);
  }, [roomId]);

  return (
    <div className="canvas-root w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
