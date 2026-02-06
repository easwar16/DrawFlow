"use client";
import CanvasComponent from "@/components/custom/Canvas/Canvas";
import Toolbar from "@/components/custom/Toolbar/Toolbar";
import ZoomControls from "@/components/custom/ZoomControls/ZoomControls";

export default function Canvas() {
  return (
    <div className="w-screen h-screen">
      <Toolbar />
      <CanvasComponent />
      <ZoomControls />
    </div>
  );
}
