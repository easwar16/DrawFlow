"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import CanvasComponent from "@/components/custom/Canvas/Canvas";
import Toolbar from "@/components/custom/Toolbar/Toolbar";
import ZoomControls from "@/components/custom/ZoomControls/ZoomControls";
import { ShareButton } from "@/components/share/ShareButton";
import { useEditorStore } from "@/store/editor";
import { Button } from "@/components/ui/button";

export default function Canvas() {
  const searchParams = useSearchParams();
  const setRoomId = useEditorStore((s) => s.setRoomId);

  useEffect(() => {
    const roomId = searchParams?.get("roomId") ?? null;
    setRoomId(roomId);
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/bc097565-0755-45ed-9438-941e2702e41d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "initial",
        hypothesisId: "H2",
        location: "page.tsx:14",
        message: "Draw page searchParams handled",
        data: {
          hasRoomIdParam: Boolean(roomId),
          roomIdLen: roomId?.length ?? 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => { });
    // #endregion
  }, [searchParams, setRoomId]);

  return (
    <div className="w-screen h-screen">
      <header className="absolute top-4 left-4 z-50">
        <Link href="/">
          <Button variant="outline" size="icon" className="shadow-sm">
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Button>
        </Link>
      </header>
      <header className="absolute top-4 right-4 z-50">
        <ShareButton />
      </header>
      <Toolbar />
      <CanvasComponent />
      <ZoomControls />
    </div>
  );
}
