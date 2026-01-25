import { useEffect, useState } from "react";
import CanvasManager from "@/lib/canvas/CanvasManager";

export default function ZoomControls() {
  const cm = CanvasManager.getInstance();
  const [zoom, setZoom] = useState(cm.getZoom());

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 shadow">
      <button
        onClick={() => zoomAtCenter("out")}
        className="px-3 py-1 rounded hover:bg-gray-200"
      >
        −
      </button>

      <span
        className="min-w-[60px] text-center text-sm cursor-pointer select-none"
        onClick={() => cm.resetZoom()}
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </span>

      <button
        onClick={() => zoomAtCenter("in")}
        className="px-3 py-1 rounded hover:bg-gray-200"
      >
        +
      </button>
    </div>
  );
}
