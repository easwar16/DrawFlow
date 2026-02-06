"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Italic,
  Menu,
  Minus,
  Monitor,
  Moon,
  PenTool,
  Plus,
  Sun,
  Trash2,
  Users,
} from "lucide-react";
import CanvasComponent from "@/components/custom/Canvas/Canvas";
import PropertiesPanel from "@/components/custom/PropertiesPanel/PropertiesPanel";
import Toolbar from "@/components/custom/Toolbar/Toolbar";
import ZoomControls from "@/components/custom/ZoomControls/ZoomControls";
import { ShareButton } from "@/components/share/ShareButton";
import { ExportDialog } from "@/components/export/ExportDialog";
import { useEditorStore } from "@/store/editor";
import { Button } from "@/components/ui/button";
import CanvasManager from "@/lib/canvas/CanvasManager";
import { getTextBounds, TextShape } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DrawPageClient() {
  const searchParams = useSearchParams();
  const setRoomId = useEditorStore((s) => s.setRoomId);
  const loadShapesFromStorage = useEditorStore((s) => s.loadShapesFromStorage);
  const connectWebSocket = useEditorStore((s) => s.connectWebSocket);
  const disconnectWebSocket = useEditorStore((s) => s.disconnectWebSocket);
  const roomId = useEditorStore((s) => s.roomId);
  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);
  const canvasBg = useEditorStore((s) => s.canvasBg);
  const setCanvasBg = useEditorStore((s) => s.setCanvasBg);
  const hasCustomCanvasBg = useEditorStore((s) => s.hasCustomCanvasBg);
  const setHasCustomCanvasBg = useEditorStore((s) => s.setHasCustomCanvasBg);
  const shapes = useEditorStore((s) => s.shapes);
  const setShapes = useEditorStore((s) => s.setShapes);
  const setSelectedShapeIds = useEditorStore((s) => s.setSelectedShapeIds);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);
  const updateShape = useEditorStore((s) => s.updateShape);
  const currentTextStyle = useEditorStore((s) => s.currentTextStyle);
  const setCurrentTextStyle = useEditorStore((s) => s.setCurrentTextStyle);
  const editingTextId = useEditorStore((s) => s.editingTextId);
  const currentStyle = useEditorStore((s) => s.currentStyle);
  const setCurrentStyle = useEditorStore((s) => s.setCurrentStyle);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const lastThemeRef = useRef<"light" | "dark" | "system">(theme);

  const isTextShape = (shape: unknown): shape is TextShape =>
    typeof shape === "object" && shape !== null && (shape as TextShape).type === "text";

  const textTargets = useMemo(() => {
    if (editingTextId) {
      const editing = shapes.find(
        (shape) => shape.type === "text" && shape.id === editingTextId,
      );
      return editing ? [editing as TextShape] : [];
    }
    const selected = shapes.filter((shape) => selectedShapeIds.includes(shape.id));
    return selected.filter(isTextShape);
  }, [editingTextId, selectedShapeIds, shapes]);

  const textToolbarPosition = useMemo(() => {
    const primary = textTargets[0];
    if (!primary) return null;
    const bounds = getTextBounds(primary);
    const cm = CanvasManager.getInstance();
    const topLeft = cm.toScreenPoint({ x: bounds.x, y: bounds.y });
    const left = Math.max(8, topLeft.x);
    const top = Math.max(8, topLeft.y - 46);
    return { left, top };
  }, [textTargets]);

  const applyTextUpdates = (updates: Partial<typeof currentTextStyle>) => {
    if (textTargets.length === 0) return;
    const nextStyle = { ...currentTextStyle, ...updates };
    const cm = CanvasManager.getInstance();
    const ctx = (cm as any).ctx as CanvasRenderingContext2D | undefined;

    for (const shape of textTargets) {
      updateShape(shape.id, (current) => {
        if (current.type !== "text") return current;
        const next = {
          ...current,
          fontSize: nextStyle.fontSize,
          fontFamily: nextStyle.fontFamily,
          fontWeight: nextStyle.fontWeight,
          fontStyle: nextStyle.fontStyle,
          textAlign: nextStyle.textAlign,
        };
        if (ctx) {
          ctx.font = `${next.fontStyle ?? "normal"} ${next.fontWeight ?? "normal"} ${next.fontSize}px ${next.fontFamily}`;
          const w = ctx.measureText(next.text).width;
          const h = next.fontSize;
          return { ...next, w, h };
        }
        return next;
      });
    }
    setCurrentTextStyle(nextStyle);
  };

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === "undefined") return;
    const platform = navigator.platform ?? "";
    const ua = navigator.userAgent ?? "";
    setIsMac(platform.includes("Mac") || ua.includes("Mac"));
  }, []);

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


  useEffect(() => {
    if (typeof window === "undefined") return;
    if (roomId !== null) return;
    const storedTheme = localStorage.getItem("drawflow:theme");
    const storedCanvas = localStorage.getItem("drawflow:canvasBg");
    const storedCustom = localStorage.getItem("drawflow:canvasBgCustom");
    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      setTheme(storedTheme);
    }
    if (storedCanvas) {
      setCanvasBg(storedCanvas);
    }
    if (storedCustom === "1") {
      setHasCustomCanvasBg(true);
    }
  }, [roomId, setCanvasBg, setHasCustomCanvasBg, setTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.style.setProperty("--canvas-bg", canvasBg);
    document.body.style.setProperty("--canvas-bg", canvasBg);
    const canvas = document.querySelector<HTMLCanvasElement>(".canvas-root canvas");
    if (canvas) {
      canvas.style.backgroundColor = canvasBg;
    }
    localStorage.setItem("drawflow:canvasBg", canvasBg);
    localStorage.setItem("drawflow:canvasBgCustom", hasCustomCanvasBg ? "1" : "0");
  }, [canvasBg, hasCustomCanvasBg]);


  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (!hasCustomCanvasBg) {
      const desiredBg = theme === "dark" ? "#1e1e1e" : "#ffffff";
      if (canvasBg !== desiredBg) {
        setCanvasBg(desiredBg);
      }
    }
    if (theme === "dark" && currentStyle.stroke === "#000000") {
      setCurrentStyle({ stroke: "#ffffff" });
    }
    if (theme === "light" && currentStyle.stroke === "#ffffff") {
      setCurrentStyle({ stroke: "#000000" });
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("drawflow:theme", theme);
    }
  }, [theme, hasCustomCanvasBg, currentStyle.stroke, setCurrentStyle]);

  useEffect(() => {
    if (theme === "system") {
      lastThemeRef.current = theme;
      return;
    }
    if (lastThemeRef.current === theme) return;

    const toLight = theme === "light";
    const nextStroke = toLight ? "#000000" : "#ffffff";
    const prevStroke = toLight ? "#ffffff" : "#000000";
    const nextText = nextStroke;
    const prevText = prevStroke;

    let hasChanges = false;
    const updated = shapes.map((shape) => {
      let updatedShape = shape;
      if (shape.stroke === prevStroke) {
        updatedShape = { ...updatedShape, stroke: nextStroke };
        hasChanges = true;
      }
      if (updatedShape.type === "text" && updatedShape.color === prevText) {
        updatedShape = { ...updatedShape, color: nextText };
        hasChanges = true;
      }
      return updatedShape;
    });

    if (hasChanges) {
      const selectedIds = useEditorStore.getState().selectedShapeIds;
      setShapes(updated);
      if (selectedIds.length > 0) {
        setSelectedShapeIds(selectedIds);
      }
    }

    lastThemeRef.current = theme;
  }, [theme, shapes, setShapes, setSelectedShapeIds]);

  return (
    <div className="w-screen h-screen">
      <header className="absolute top-4 left-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shadow-sm dark:bg-[#1f1f1f] dark:border-white/10 dark:text-gray-200"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setExportOpen(true)}>
                <ImageIcon className="h-4 w-4" />
                <span>Export image...</span>
                <DropdownMenuShortcut>⌘⇧E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShareOpen(true)}>
                <Users className="h-4 w-4" />
                <span>Live collaboration...</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  setShapes([]);
                  setSelectedShapeIds([]);
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span>Reset the canvas</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex items-center justify-between gap-4"
              onSelect={(event) => event.preventDefault()}
            >
              <span>Theme</span>
              <div className="flex items-center gap-1 rounded-full bg-muted px-1 py-1">
                <button
                  type="button"
                  className={`h-7 w-7 rounded-full flex items-center justify-center ${
                    theme === "light" ? "bg-[#c7f3e2] text-black" : "opacity-70"
                  }`}
                  onClick={() => {
                    const nextTheme = "light";
                    const nextCanvasBg = hasCustomCanvasBg
                      ? canvasBg
                      : "#ffffff";
                    setTheme(nextTheme);
                    if (!hasCustomCanvasBg) {
                      setCanvasBg(nextCanvasBg);
                    }
                  }}
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`h-7 w-7 rounded-full flex items-center justify-center ${
                    theme === "dark" ? "bg-[#c7f3e2] text-black" : "opacity-70"
                  }`}
                  onClick={() => {
                    const nextTheme = "dark";
                    const nextCanvasBg = hasCustomCanvasBg
                      ? canvasBg
                      : "#1e1e1e";
                    setTheme(nextTheme);
                    if (!hasCustomCanvasBg) {
                      setCanvasBg(nextCanvasBg);
                    }
                  }}
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`h-7 w-7 rounded-full flex items-center justify-center ${
                    theme === "system" ? "bg-[#c7f3e2] text-black" : "opacity-70"
                  }`}
                  onClick={() => {
                    const nextTheme = "system";
                    const nextCanvasBg = hasCustomCanvasBg
                      ? canvasBg
                      : "#ffffff";
                    setTheme(nextTheme);
                    if (!hasCustomCanvasBg) {
                      setCanvasBg(nextCanvasBg);
                    }
                  }}
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span
                  className="h-4 w-4 rounded border border-gray-300 dark:border-gray-700"
                  style={{ backgroundColor: canvasBg }}
                />
                <span>Canvas background</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onSelect={(event) => event.preventDefault()}
                >
                  <input
                    type="color"
                    aria-label="Custom canvas background"
                    className="h-5 w-5 rounded border border-gray-300 dark:border-gray-700 p-0"
                    value={canvasBg}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      const nextCanvasBg = event.target.value;
                      setHasCustomCanvasBg(true);
                      setCanvasBg(nextCanvasBg);
                    }}
                  />
                  <span>Custom color</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    const nextCanvasBg = theme === "dark" ? "#1e1e1e" : "#ffffff";
                    setHasCustomCanvasBg(false);
                    setCanvasBg(nextCanvasBg);
                  }}
                >
                  <span>Reset to theme</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <header className="absolute top-4 right-4 z-50">
        <ShareButton open={shareOpen} onOpenChange={setShareOpen} />
      </header>
      {isMounted && textTargets.length > 0 && textToolbarPosition ? (
        <div
          className="fixed z-50 flex items-center gap-2 rounded-xl bg-white/95 dark:bg-[#1f1f1f]/95 px-2 py-1.5 shadow-lg shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10"
          style={{ left: textToolbarPosition.left, top: textToolbarPosition.top }}
        >
          <button
            type="button"
            className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            onClick={() =>
              applyTextUpdates({
                fontSize: Math.max(8, currentTextStyle.fontSize - 2),
              })
            }
            aria-label="Decrease font size"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={8}
            max={96}
            value={currentTextStyle.fontSize}
            onChange={(event) =>
              applyTextUpdates({
                fontSize: Math.min(96, Math.max(8, Number(event.target.value || 8))),
              })
            }
            className="w-14 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-2 py-1 text-sm text-gray-800 dark:text-gray-100"
          />
          <button
            type="button"
            className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            onClick={() =>
              applyTextUpdates({
                fontSize: Math.min(96, currentTextStyle.fontSize + 2),
              })
            }
            aria-label="Increase font size"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            className={`h-7 w-7 inline-flex items-center justify-center rounded-md ${
              currentTextStyle.fontWeight === "bold"
                ? "bg-[#c7f3e2] text-black"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            }`}
            onClick={() =>
              applyTextUpdates({
                fontWeight: currentTextStyle.fontWeight === "bold" ? "normal" : "bold",
              })
            }
            aria-label="Toggle bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`h-7 w-7 inline-flex items-center justify-center rounded-md ${
              currentTextStyle.fontStyle === "italic"
                ? "bg-[#c7f3e2] text-black"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            }`}
            onClick={() =>
              applyTextUpdates({
                fontStyle: currentTextStyle.fontStyle === "italic" ? "normal" : "italic",
              })
            }
            aria-label="Toggle italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            className={`h-7 w-7 inline-flex items-center justify-center rounded-md ${
              currentTextStyle.textAlign === "left"
                ? "bg-[#c7f3e2] text-black"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            }`}
            onClick={() => applyTextUpdates({ textAlign: "left" })}
            aria-label="Align left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`h-7 w-7 inline-flex items-center justify-center rounded-md ${
              currentTextStyle.textAlign === "center"
                ? "bg-[#c7f3e2] text-black"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            }`}
            onClick={() => applyTextUpdates({ textAlign: "center" })}
            aria-label="Align center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`h-7 w-7 inline-flex items-center justify-center rounded-md ${
              currentTextStyle.textAlign === "right"
                ? "bg-[#c7f3e2] text-black"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            }`}
            onClick={() => applyTextUpdates({ textAlign: "right" })}
            aria-label="Align right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {isMounted ? (
        <button
          type="button"
          className="fixed bottom-5 right-5 z-50 rounded-full bg-white/90 dark:bg-[#1f1f1f]/90 text-gray-800 dark:text-gray-100 shadow-lg shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10 p-3"
          onClick={() => setHelpOpen(true)}
          aria-label="Help and shortcuts"
          title="Help and shortcuts"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      ) : null}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        canvasBg={canvasBg}
        shapes={shapes}
      />
      {isMounted ? (
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Help &amp; shortcuts</DialogTitle>
              <DialogDescription>
                {isMac ? "macOS" : "Windows/Linux"} shortcuts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Tools
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span>Lock tool</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">Q</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Hand</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">1</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Select</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">2</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Rectangle</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">3</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Rhombus</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">4</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Circle</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">5</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Arrow</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">6</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Line</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">7</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Pencil</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">8</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Text</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">9</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Eraser</span>
                    <kbd className="rounded border px-2 py-0.5 text-xs">0</kbd>
                  </div>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Tips
                </div>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>Double-click empty space to create text</li>
                  <li>Double-click text to edit</li>
                  <li>Use {isMac ? "Command" : "Ctrl"} + Z to undo</li>
                  <li>Use {isMac ? "Command" : "Ctrl"} + Shift + Z to redo</li>
                  <li>Press Escape to cancel text editing</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
      <Toolbar />
      <PropertiesPanel />
      {shapes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="relative px-6 py-4 text-center" style={{ fontFamily: "Virgil, sans-serif" }}>
            <div className="flex items-center justify-center gap-3 text-2xl text-[#8fdcc0]">
              <PenTool className="h-7 w-7 text-[#8fdcc0]" />
              <span className="tracking-wide">DRAWFLOW</span>
            </div>
          </div>
          <div
            className="absolute left-13 top-6 text-gray-400 dark:text-gray-400"
            style={{ fontFamily: "Virgil, sans-serif" }}
          >
            <div className="items-start">
              <svg className="mt-0" width="190" height="120" viewBox="0 0 190 120" fill="none">
                <defs>
                  <marker
                    id="menu-arrowhead"
                    markerWidth="12"
                    markerHeight="12"
                    refX="9"
                    refY="6"
                    orient="auto"
                  >
                    <path d="M0,0 L0,12 L12,6 z" fill="#9aa0a6" />
                  </marker>
                </defs>
                <path
                  d="M96 100 C72 58, 50 42, 34 32 C24 26, 18 22, 14 18"
                  stroke="#9aa0a6"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                  markerEnd="url(#menu-arrowhead)"
                />
              </svg>
              <div className="text-lg pl-22 leading-none">
                <div>Export, preferences,</div>
                <div>live colaboration, ...</div>
              </div>
            </div>
          </div>
          <div
            className="absolute right-14 top-6 text-gray-400 dark:text-gray-400"
            style={{ fontFamily: "Virgil, sans-serif" }}
          >
            <div className="items-end text-right">
              <svg className="mt-0 ml-auto" width="160" height="120" viewBox="0 0 160 120" fill="none">
                <defs>
                  <marker
                    id="share-arrowhead"
                    markerWidth="12"
                    markerHeight="12"
                    refX="9"
                    refY="6"
                    orient="auto"
                  >
                    <path d="M0,0 L0,12 L12,6 z" fill="#9aa0a6" />
                  </marker>
                </defs>
                <path
                  d="M30 104 C48 70, 70 50, 98 38 C120 28, 134 22, 146 16"
                  stroke="#9aa0a6"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                  markerEnd="url(#share-arrowhead)"
                />
              </svg>
              <div className="text-lg leading-none pr-22">
                <div>Share your</div>
                <div>canvas</div>
              </div>
            </div>
          </div>
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 text-gray-400 dark:text-gray-400"
            style={{ fontFamily: "Virgil, sans-serif" }}
          >
            <div className="items-start">
              <svg className="mt-0" width="140" height="90" viewBox="0 0 140 90" fill="none">
                <defs>
                  <marker
                    id="toolbar-arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="7"
                    refY="5"
                    orient="auto"
                  >
                    <path d="M0,0 L0,10 L10,5 z" fill="#9aa0a6" />
                  </marker>
                </defs>
                <path
                  d="M20 80 C6 58, 18 30, 52 10"
                  stroke="#9aa0a6"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  markerEnd="url(#toolbar-arrowhead)"
                />
              </svg>
              <div className="text-lg leading-none mt-1">
                <div>Pick a tool &</div>
                <div>Start drawing!</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <CanvasComponent />
      <ZoomControls />
    </div>
  );
}
