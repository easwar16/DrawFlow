// src/components/share/StartSession.tsx
import { Button } from "@/components/ui/button";

export function StartSession({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold">Live collaboration</h2>

      <p className="mt-3 text-sm text-muted-foreground">
        Invite people to collaborate on your drawing.
        <br />
        End-to-end encrypted and fully private.
      </p>

      <Button onClick={onStart} className="mt-6 w-full">
        ▶ Start session
      </Button>
    </div>
  );
}
