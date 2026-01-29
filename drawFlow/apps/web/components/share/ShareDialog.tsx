// src/components/share/ShareDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createRoomId } from "@/lib/room/room";
import { StartSession } from "./StartSession";
import { ActiveSession } from "./ActiveSession";

type ShareState = "idle" | "active";

export function ShareDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [state, setState] = useState<ShareState>("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const id = searchParams?.get("roomId");
    if (id) {
      setRoomId(id);
      setState("active");
    }
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/bc097565-0755-45ed-9438-941e2702e41d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "initial",
        hypothesisId: "H2",
        location: "ShareDialog.tsx:31",
        message: "ShareDialog searchParams processed",
        data: {
          hasRoomIdParam: Boolean(id),
          roomIdLen: id?.length ?? 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [searchParams]);

  const startSession = () => {
    const id = createRoomId();
    setRoomId(id);
    setState("active");
    if (typeof window !== "undefined") {
      const nextUrl = `${pathname}?roomId=${encodeURIComponent(id)}`;
      window.history.replaceState({}, "", nextUrl);
    }
  };

  const deactivateSession = () => {
    setRoomId(null);
    setState("idle");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", pathname);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        {state === "idle" && <StartSession onStart={startSession} />}

        {state === "active" && roomId && (
          <ActiveSession roomId={roomId} onDeactivate={deactivateSession} />
        )}
      </DialogContent>
    </Dialog>
  );
}
