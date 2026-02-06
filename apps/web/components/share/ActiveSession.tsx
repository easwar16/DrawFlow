"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import { getUsername, setUsername } from "@/lib/storage";
import { wsManager } from "@/lib/websocket/websocket";

export function ActiveSession({
  roomId,
  onDeactivate,
  isOwner,
}: {
  roomId: string;
  onDeactivate: () => void;
  isOwner: boolean;
}) {
  const [username, setLocalUsername] = useState("");
  const pathname = usePathname();
  const ensureCursorId = () => {
    if (typeof window === "undefined") return "self";
    const key = "drawflow:cursorId";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = `cursor-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, id);
    return id;
  };

  useEffect(() => {
    const stored = getUsername();
    setLocalUsername(stored);
  }, []);

  useEffect(() => {
    if (!username) return;
    setUsername(username);
    if (roomId && wsManager.isConnected()) {
      const clientId = ensureCursorId();
      wsManager.send({ type: "user_update", roomId, username, clientId });
    }
  }, [roomId, username]);


  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}${pathname}?roomId=${encodeURIComponent(roomId)}`
      : "";

  const copy = async () => {
    await navigator.clipboard.writeText(url);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Share link</h2>

      <div className="mt-4 rounded-md border p-3 text-sm break-all">{url}</div>

      <Button onClick={copy} variant="secondary" className="mt-2 w-full">
        Copy link
      </Button>

      {isOwner ? (
        <Button onClick={onDeactivate} variant="outline" className="mt-2 w-full">
          Deactivate session
        </Button>
      ) : (
        <Button variant="outline" className="mt-2 w-full" disabled>
          Only the room creator can deactivate
        </Button>
      )}

      <div className="mt-4">
        <label className="text-xs text-muted-foreground">Your name</label>
        <Input
          value={username}
          onChange={(e) => setLocalUsername(e.target.value)}
          className="mt-1"
        />
      </div>

      <p className="mt-4 text-center text-xs text-green-600">
        ● Session active
      </p>
    </div>
  );
}
