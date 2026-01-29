"use client";

import { useEffect, useRef, useState } from "react";

export function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Draw grid
    ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
    ctx.lineWidth = 1;
    const gridSize = 20;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Animation timing
    let startTime: number | null = null;
    const animationDuration = 3000;

    const drawHandDrawnRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      progress: number,
      color: string,
      fillColor?: string,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (fillColor && progress >= 1) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
      }

      const totalLength = (w + h) * 2;
      const currentLength = totalLength * Math.min(progress, 1);

      ctx.beginPath();

      // Top edge
      if (currentLength > 0) {
        const topProgress = Math.min(currentLength / w, 1);
        ctx.moveTo(x + Math.random() * 2, y + Math.random() * 2);
        ctx.lineTo(
          x + w * topProgress + Math.random() * 2,
          y + Math.random() * 2,
        );
      }

      // Right edge
      if (currentLength > w) {
        const rightProgress = Math.min((currentLength - w) / h, 1);
        ctx.moveTo(x + w + Math.random() * 2, y + Math.random() * 2);
        ctx.lineTo(
          x + w + Math.random() * 2,
          y + h * rightProgress + Math.random() * 2,
        );
      }

      // Bottom edge
      if (currentLength > w + h) {
        const bottomProgress = Math.min((currentLength - w - h) / w, 1);
        ctx.moveTo(x + w + Math.random() * 2, y + h + Math.random() * 2);
        ctx.lineTo(
          x + w * (1 - bottomProgress) + Math.random() * 2,
          y + h + Math.random() * 2,
        );
      }

      // Left edge
      if (currentLength > w * 2 + h) {
        const leftProgress = Math.min((currentLength - w * 2 - h) / h, 1);
        ctx.moveTo(x + Math.random() * 2, y + h + Math.random() * 2);
        ctx.lineTo(
          x + Math.random() * 2,
          y + h * (1 - leftProgress) + Math.random() * 2,
        );
      }

      ctx.stroke();
    };

    const drawArrow = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      progress: number,
      color: string,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      const currentX2 = x1 + (x2 - x1) * Math.min(progress, 1);
      const currentY2 = y1 + (y2 - y1) * Math.min(progress, 1);

      ctx.beginPath();
      ctx.moveTo(x1 + Math.random() * 2, y1 + Math.random() * 2);
      ctx.lineTo(currentX2 + Math.random() * 2, currentY2 + Math.random() * 2);
      ctx.stroke();

      if (progress >= 1) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 12;

        ctx.beginPath();
        ctx.moveTo(currentX2, currentY2);
        ctx.lineTo(
          currentX2 - arrowLength * Math.cos(angle - Math.PI / 6),
          currentY2 - arrowLength * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(currentX2, currentY2);
        ctx.lineTo(
          currentX2 - arrowLength * Math.cos(angle + Math.PI / 6),
          currentY2 - arrowLength * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      }
    };

    const drawCircle = (
      cx: number,
      cy: number,
      r: number,
      progress: number,
      color: string,
      fillColor?: string,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      if (fillColor && progress >= 1) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2 * Math.min(progress, 1));
      ctx.stroke();
    };

    const drawText = (
      text: string,
      x: number,
      y: number,
      progress: number,
      color: string,
    ) => {
      if (progress < 0.5) return;

      ctx.fillStyle = color;
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.globalAlpha = (progress - 0.5) * 2;
      ctx.fillText(text, x, y);
      ctx.globalAlpha = 1;
    };

    let rafId: number | null = null;
    let isActive = true;

    const animate = (timestamp: number) => {
      if (!isActive) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = elapsed / animationDuration;

      ctx.clearRect(0, 0, width, height);

      // Redraw grid
      ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const primaryColor = "#22c55e";
      const darkColor = "#1f2937";
      const lightFill = "rgba(34, 197, 94, 0.1)";

      // Draw shapes with staggered timing
      drawHandDrawnRect(60, 80, 120, 80, progress * 3, darkColor, lightFill);
      drawText("Idea", 120, 125, progress * 3, darkColor);

      drawArrow(190, 120, 260, 120, (progress - 0.15) * 3, primaryColor);

      drawHandDrawnRect(
        280,
        80,
        120,
        80,
        (progress - 0.3) * 3,
        darkColor,
        lightFill,
      );
      drawText("Design", 340, 125, (progress - 0.3) * 3, darkColor);

      drawArrow(410, 120, 480, 120, (progress - 0.45) * 3, primaryColor);

      drawCircle(540, 120, 50, (progress - 0.6) * 3, darkColor, lightFill);
      drawText("Build", 540, 125, (progress - 0.6) * 3, darkColor);

      // Second row
      drawArrow(540, 180, 540, 240, (progress - 0.75) * 3, primaryColor);

      drawHandDrawnRect(
        480,
        260,
        120,
        60,
        (progress - 0.85) * 3,
        darkColor,
        "rgba(34, 197, 94, 0.2)",
      );
      drawText("Ship!", 540, 295, (progress - 0.85) * 3, darkColor);

      if (progress < 1.2) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isVisible]);

  return (
    <section id="preview" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          className={`transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
              See it in <span className="text-primary">action</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
              Watch how easily ideas flow from thought to diagram
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl">
            <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 text-center text-sm text-muted-foreground">
                  DrawFlow Canvas
                </div>
              </div>
              <div className="aspect-video bg-background">
                <canvas ref={canvasRef} className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
