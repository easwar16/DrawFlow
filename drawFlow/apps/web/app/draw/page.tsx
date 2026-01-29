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
  const loadShapesFromStorage = useEditorStore((s) => s.loadShapesFromStorage);
  const connectWebSocket = useEditorStore((s) => s.connectWebSocket);
  const disconnectWebSocket = useEditorStore((s) => s.disconnectWebSocket);

  useEffect(() => {
    const roomIdFromParams = searchParams?.get("roomId") ?? null;
    setRoomId(roomIdFromParams);

    if (roomIdFromParams === null) {
      // Disconnect WebSocket and load from localStorage
      disconnectWebSocket();
      loadShapesFromStorage();
    } else {
      // Connect to WebSocket when joining a room (login-less service)
      connectWebSocket(roomIdFromParams).catch((error) => {
        console.error("Failed to connect WebSocket:", error);
      });
    }

    // Cleanup: disconnect on unmount
    return () => {
      if (roomIdFromParams !== null) {
        disconnectWebSocket();
      }
    };
  }, [searchParams, setRoomId, loadShapesFromStorage, connectWebSocket, disconnectWebSocket]);

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
