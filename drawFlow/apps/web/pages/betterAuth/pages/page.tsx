"use client";

import { AuthCard } from "../components/auth-card";
import { GridBackground } from "../components/grid-background";

export default function AuthPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <GridBackground />
      <AuthCard />
    </main>
  );
}
