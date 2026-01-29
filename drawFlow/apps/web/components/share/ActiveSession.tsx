"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsername, setUsername } from "@/lib/storage";

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

  useEffect(() => {
    const stored = getUsername();
    setLocalUsername(stored);
  }, []);

  useEffect(() => {
    if (username) setUsername(username);
  }, [username]);


  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/draw?roomId=${encodeURIComponent(roomId)}`
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
