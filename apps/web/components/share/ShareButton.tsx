"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareDialog } from "./ShareDialog";
import { Button } from "@/components/ui/button";

type ShareButtonProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ShareButton({ open, onOpenChange }: ShareButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean" && typeof onOpenChange === "function";
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <>
      <Button
        size="icon"
        className="shadow-sm bg-[#0a8f1f] text-white hover:bg-[#0a7f1b] dark:bg-[#c7f3e2] dark:text-black dark:hover:bg-[#b8efd8]"
        onClick={() => setDialogOpen(true)}
      >
        <Share2 className="h-4 w-4" />
        <span className="sr-only">Share</span>
      </Button>

      <ShareDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
