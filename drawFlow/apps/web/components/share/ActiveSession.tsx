"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsername, setUsername } from "@/lib/storage";

export function ActiveSession({
  roomId,
  onDeactivate,
}: {
  roomId: string;
  onDeactivate: () => void;
}) {
  const [username, setLocalUsername] = useState("");

  useEffect(() => {
    const stored = getUsername();
    setLocalUsername(stored);
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/bc097565-0755-45ed-9438-941e2702e41d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "initial",
        hypothesisId: "H3",
        location: "ActiveSession.tsx:18",
        message: "Loaded stored username",
        data: {
          hasUsername: Boolean(stored),
          usernameLen: stored?.length ?? 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  useEffect(() => {
    if (username) setUsername(username);
  }, [username]);

  useEffect(() => {
    const isWindow = typeof window !== "undefined";
    const origin = isWindow ? window.location.origin : "";
    const computedUrl = isWindow
      ? `${origin}/draw?roomId=${encodeURIComponent(roomId)}`
      : "";
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/bc097565-0755-45ed-9438-941e2702e41d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "initial",
        hypothesisId: "H1",
        location: "ActiveSession.tsx:33",
        message: "Computed share URL",
        data: {
          isWindow,
          origin,
          roomIdPresent: Boolean(roomId),
          roomIdLen: roomId.length,
          urlLen: computedUrl.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [roomId]);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/draw?roomId=${encodeURIComponent(roomId)}`
      : "";

  const copy = async () => {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/bc097565-0755-45ed-9438-941e2702e41d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "initial",
        hypothesisId: "H2",
        location: "ActiveSession.tsx:51",
        message: "Copy link clicked",
        data: { urlLen: url.length, roomIdLen: roomId.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    await navigator.clipboard.writeText(url);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Share link</h2>

      <div className="mt-4 rounded-md border p-3 text-sm break-all">{url}</div>

      <Button onClick={copy} variant="secondary" className="mt-2 w-full">
        Copy link
      </Button>

      <Button onClick={onDeactivate} variant="outline" className="mt-2 w-full">
        Deactivate session
      </Button>

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
