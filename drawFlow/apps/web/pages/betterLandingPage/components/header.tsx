"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Play, Sun, Moon, Monitor } from "lucide-react";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CanvasComponent from "@/components/custom/Canvas/Canvas";
import Toolbar from "@/components/custom/Toolbar/Toolbar";
import ZoomControls from "@/components/custom/ZoomControls/ZoomControls";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const storedTheme = localStorage.getItem("drawflow:landingTheme");
    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("drawflow:landingTheme", theme);
  }, [theme]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-primary-foreground"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">DrawFlow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#preview"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Preview
            </Link>
            {/* <Link
              href="#why"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Why DrawFlow
            </Link> */}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-full border border-border bg-muted/60 px-1 py-1">
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  theme === "light" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setTheme("light")}
                aria-label="Light theme"
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  theme === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setTheme("dark")}
                aria-label="Dark theme"
              >
                <Moon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  theme === "system" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setTheme("system")}
                aria-label="System theme"
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>
            <Dialog>
              <form>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 px-8 h-12 text-base bg-transparent"
                  >
                    <Play className="h-4 w-4" />
                    View Demo
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <Toolbar />
                    <CanvasComponent />
                    <ZoomControls />
                  </div>
                </DialogContent>
              </form>
            </Dialog>
            <Button size="sm" onClick={() => router.push("/draw")}>
              Start Drawing
            </Button>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#preview"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Preview
              </Link>
              <Link
                href="#why"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Why DrawFlow
              </Link>
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="ghost" size="sm">
                  View Demo
                </Button>
                <Button size="sm">Start Drawing</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
