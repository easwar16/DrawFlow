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
