"use client";

import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
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
            <span className="text-lg font-bold text-foreground">DrawFlow</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/easwar16"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="h-5 w-5" />
            </Link>
            <Link
              href="https://x.com/Easwar_H"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="X"
              target="_blank"
              rel="noreferrer"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="currentColor"
              >
                <path d="M18.244 2H21l-6.56 7.5L22 22h-6.8l-4.65-6.13L5 22H2l7.1-8.12L2 2h6.95l4.2 5.55L18.244 2Z" />
              </svg>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} DrawFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
