"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CanvasComponent from "@/components/custom/Canvas/Canvas";
import Toolbar from "@/components/custom/Toolbar/Toolbar";
import ZoomControls from "@/components/custom/ZoomControls/ZoomControls";
import { ShareButton } from "@/components/share/ShareButton";
import { useEditorStore } from "@/store/editor";

export default function Canvas() {
  const searchParams = useSearchParams();
  const setRoomId = useEditorStore((s) => s.setRoomId);

  useEffect(() => {
    const roomId = searchParams?.get("roomId") ?? null;
    setRoomId(roomId);
  }, [searchParams, setRoomId]);

  return (
    <div className="w-screen h-screen">
      <header className="absolute top-4 right-4 z-50">
        <ShareButton />
      </header>
      <Toolbar />
      <CanvasComponent />
      <ZoomControls />
    </div>
  );
}
