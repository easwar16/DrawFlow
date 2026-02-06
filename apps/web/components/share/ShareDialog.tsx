// src/components/share/ShareDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
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
  const [isOwner, setIsOwner] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const id = searchParams?.get("roomId");
    if (id) {
      setRoomId(id);
      setState("active");
      if (typeof window !== "undefined") {
        const ownerKey = `drawflow:roomOwner:${id}`;
        setIsOwner(localStorage.getItem(ownerKey) === "1");
      }
    }
  }, [searchParams]);

  const startSession = () => {
    const id = createRoomId();
    setRoomId(id);
    setState("active");
    setIsOwner(true);
    if (typeof window !== "undefined") {
      const ownerKey = `drawflow:roomOwner:${id}`;
      localStorage.setItem(ownerKey, "1");
      const nextUrl = `${pathname}?roomId=${encodeURIComponent(id)}`;
      router.replace(nextUrl);
    }
  };

  const deactivateSession = () => {
    const currentRoomId = roomId;
    setRoomId(null);
    setState("idle");
    setIsOwner(false);
    if (typeof window !== "undefined") {
      if (currentRoomId) {
        const ownerKey = `drawflow:roomOwner:${currentRoomId}`;
        localStorage.removeItem(ownerKey);
      }
      router.replace(pathname);
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
          <ActiveSession
            roomId={roomId}
            onDeactivate={deactivateSession}
            isOwner={isOwner}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
