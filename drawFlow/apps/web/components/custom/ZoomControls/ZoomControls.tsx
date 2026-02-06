"use client";

import { useEffect, useState } from "react";
import CanvasManager from "@/lib/canvas/CanvasManager";
import { useEditorStore } from "@/store/editor";
import { LuUndo2, LuRedo2 } from "react-icons/lu";

export default function ZoomControls() {
  const cm = CanvasManager.getInstance();
  const [zoom, setZoom] = useState(cm.getZoom());
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);

  useEffect(() => {
    // 👇 subscribe instead of polling
    const unsubscribe = cm.subscribeZoom((z) => {
      setZoom(z);
    });

    return unsubscribe;
  }, [cm]);

  const zoomAtCenter = (direction: "in" | "out") => {
    const canvas = cm.getCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // 👇 convert DOM center → canvas/world space
    const center = {
      x: (rect.width / 2 - cm["panX"]) / cm.getZoom(),
      y: (rect.height / 2 - cm["panY"]) / cm.getZoom(),
    };

    direction === "in" ? cm.zoomIn(center) : cm.zoomOut(center);
  };

  return (
    <div className="fixed bottom-6 left-6 flex items-center gap-3">
      {/* Zoom Control Group */}
      <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] px-3 py-2 shadow dark:shadow-black/40">
        <button
          onClick={() => zoomAtCenter("out")}
          className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-white/10"
        >
          −
        </button>

        <span
          className="min-w-[60px] text-center text-sm cursor-pointer select-none dark:text-gray-100"
          onClick={() => cm.resetZoom()}
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => zoomAtCenter("in")}
          className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-white/10"
        >
          +
        </button>
      </div>

      {/* Undo/Redo Control Group */}
      <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] px-2 py-2 shadow dark:shadow-black/40">
        <button
          onClick={() => {
            undo();
            cm.render();
          }}
          disabled={past.length === 0}
          className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <LuUndo2 className="w-4 h-4 dark:text-gray-100" />
        </button>

        <button
          onClick={() => {
            redo();
            cm.render();
          }}
          disabled={future.length === 0}
          className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Redo"
        >
          <LuRedo2 className="w-4 h-4 dark:text-gray-100" />
        </button>
      </div>
    </div>
  );
}
