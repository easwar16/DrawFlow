"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Image as ImageIcon,
  Menu,
  Monitor,
  Moon,
  PenTool,
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
  const shapes = useEditorStore((s) => s.shapes);
  const setShapes = useEditorStore((s) => s.setShapes);
  const setSelectedShapeIds = useEditorStore((s) => s.setSelectedShapeIds);
  const currentStyle = useEditorStore((s) => s.currentStyle);
  const setCurrentStyle = useEditorStore((s) => s.setCurrentStyle);
  const [canvasBg, setCanvasBg] = useState("#ffffff");
  const [hasCustomCanvasBg, setHasCustomCanvasBg] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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
  }, []);

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
      setCanvasBg(theme === "dark" ? "#1e1e1e" : "#ffffff");
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
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`h-7 w-7 rounded-full flex items-center justify-center ${
                    theme === "dark" ? "bg-[#c7f3e2] text-black" : "opacity-70"
                  }`}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`h-7 w-7 rounded-full flex items-center justify-center ${
                    theme === "system" ? "bg-[#c7f3e2] text-black" : "opacity-70"
                  }`}
                  onClick={() => setTheme("system")}
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
                      setHasCustomCanvasBg(true);
                      setCanvasBg(event.target.value);
                    }}
                  />
                  <span>Custom color</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setHasCustomCanvasBg(false);
                    setCanvasBg(theme === "dark" ? "#1e1e1e" : "#ffffff");
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
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        canvasBg={canvasBg}
        shapes={shapes}
      />
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
