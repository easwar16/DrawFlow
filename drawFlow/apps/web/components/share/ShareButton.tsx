"use client";

import { useState } from "react";
import { ShareDialog } from "./ShareDialog";
import { Button } from "@/components/ui/button";

export function ShareButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Share</Button>

      <ShareDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
