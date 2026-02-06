"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";
import { DrawFlowLogo } from "./logo";

type AuthMode = "signin" | "signup";

export function AuthCard() {
  const [mode, setMode] = useState<AuthMode>("signin");

  return (
    <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card rounded-2xl border border-border shadow-lg shadow-foreground/[0.02] p-8 md:p-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <DrawFlowLogo />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-8">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={cn(
              "flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-200",
              mode === "signin"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-200",
              mode === "signup"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Sign Up
          </button>
        </div>

        {/* Forms */}
        <div className="relative overflow-hidden">
          <div
            className={cn(
              "transition-all duration-300 ease-out",
              mode === "signin"
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-4 absolute inset-0 pointer-events-none",
            )}
          >
            <SignInForm onSwitchMode={() => setMode("signup")} />
          </div>
          <div
            className={cn(
              "transition-all duration-300 ease-out",
              mode === "signup"
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-4 absolute inset-0 pointer-events-none",
            )}
          >
            <SignUpForm onSwitchMode={() => setMode("signin")} />
          </div>
        </div>
      </div>

      {/* Footer text */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        By continuing, you agree to our{" "}
        <a href="#" className="text-primary hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-primary hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
