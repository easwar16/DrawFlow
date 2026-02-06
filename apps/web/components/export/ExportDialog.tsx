"use client";

import { useEffect, useMemo, useState } from "react";
import CanvasManager from "@/lib/canvas/CanvasManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import type { Shape } from "@/lib/utils";

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasBg: string;
  shapes: Shape[];
};

type ExportFormat = "png" | "svg";

export function ExportDialog({ open, onOpenChange, canvasBg, shapes }: ExportDialogProps) {
  const [includeBackground, setIncludeBackground] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [embedScene, setEmbedScene] = useState(true);
  const [scale, setScale] = useState(2);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, [open]);

  const exportBackground = useMemo(() => {
    if (!includeBackground) return "transparent";
    if (darkMode) return "#1e1e1e";
    return canvasBg || "#ffffff";
  }, [includeBackground, darkMode, canvasBg]);

  const buildExportCanvas = (targetScale: number) => {
    const sourceCanvas = CanvasManager.getInstance().getCanvas();
    if (!sourceCanvas) return null;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = Math.max(1, sourceCanvas.width * targetScale);
    exportCanvas.height = Math.max(1, sourceCanvas.height * targetScale);

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return null;

    if (exportBackground !== "transparent") {
      ctx.fillStyle = exportBackground;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(sourceCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

    return exportCanvas;
  };

  const buildSvg = (pngDataUrl: string, width: number, height: number) => {
    const metadata = embedScene ? `<metadata>${JSON.stringify(shapes)}</metadata>` : "";
    return `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      metadata +
      `<image href="${pngDataUrl}" width="${width}" height="${height}" />` +
      `</svg>`;
  };

  const updatePreview = () => {
    const exportCanvas = buildExportCanvas(0.35);
    if (!exportCanvas) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(exportCanvas.toDataURL("image/png"));
  };

  useEffect(() => {
    if (!open) return;
    updatePreview();
  }, [open, includeBackground, darkMode, embedScene, scale, canvasBg]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const exportAsPng = async () => {
    const exportCanvas = buildExportCanvas(scale);
    if (!exportCanvas) return;
    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, "drawflow-export.png");
    }, "image/png");
  };

  const exportAsSvg = async () => {
    const exportCanvas = buildExportCanvas(scale);
    if (!exportCanvas) return;
    const pngDataUrl = exportCanvas.toDataURL("image/png");
    const svg = buildSvg(pngDataUrl, exportCanvas.width, exportCanvas.height);
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "drawflow-export.svg");
  };

  const copyToClipboard = async () => {
    const exportCanvas = buildExportCanvas(scale);
    if (!exportCanvas) return;
    exportCanvas.toBlob(async (blob) => {
      if (!blob) return;
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    }, "image/png");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl bg-white text-gray-900 dark:bg-[#1f1f1f] dark:text-white border border-gray-200 dark:border-white/10 p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Export image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#1a1a1a] p-6 shadow-xl shadow-black/10 dark:shadow-black/30">
            <div className="aspect-video rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#121212] flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Export preview" className="h-full w-full object-contain" />
              ) : (
                <div className="text-sm text-gray-500 dark:text-white/60">Preview unavailable</div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-white/70">Background</span>
                <Switch
                  checked={includeBackground}
                  onCheckedChange={setIncludeBackground}
                  className="data-[state=checked]:bg-[#c7f3e2]"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-white/70">Dark mode</span>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-[#c7f3e2]"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-white/70">Embed scene</span>
                <Switch
                  checked={embedScene}
                  onCheckedChange={setEmbedScene}
                  className="data-[state=checked]:bg-[#c7f3e2]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-white/70">Scale</div>
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`h-10 w-10 rounded-full text-sm ${
                      scale === value
                        ? "bg-[#c7f3e2] text-black"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                    }`}
                    onClick={() => setScale(value)}
                  >
                    {value}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button className="gap-2 bg-[#c7f3e2] text-black hover:bg-[#b8efd8]" onClick={exportAsPng}>
                <Download className="h-4 w-4" />
                PNG
              </Button>
              <Button className="gap-2 bg-[#c7f3e2] text-black hover:bg-[#b8efd8]" onClick={exportAsSvg}>
                <Download className="h-4 w-4" />
                SVG
              </Button>
              <Button className="gap-2 bg-[#c7f3e2] text-black hover:bg-[#b8efd8]" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
                Copy to clipboard
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
