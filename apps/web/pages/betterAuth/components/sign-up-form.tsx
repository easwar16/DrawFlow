"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SignUpFormProps {
  onSwitchMode: () => void;
}

export function SignUpForm({ onSwitchMode }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth - replace with real auth logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          Create your account
        </h1>
        <p className="text-muted-foreground text-sm">
          Start sketching ideas in seconds
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name">Name</Label>
          <Input
            id="signup-name"
            type="text"
            placeholder="Your name"
            required
            autoComplete="name"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            placeholder="Create a password"
            required
            autoComplete="new-password"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-confirm">Confirm password</Label>
          <Input
            id="signup-confirm"
            type="password"
            placeholder="Confirm your password"
            required
            autoComplete="new-password"
            className="h-11"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 mt-2 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      {/* Switch mode link */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchMode}
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
