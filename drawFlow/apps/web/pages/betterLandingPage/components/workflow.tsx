"use client";

import { useEffect, useRef, useState } from "react";
import { Brush, Layers, Share2 } from "lucide-react";

const steps = [
  {
    title: "Sketch freely",
    description: "Start with a blank canvas and capture ideas fast.",
    icon: Brush,
  },
  {
    title: "Organize cleanly",
    description: "Group shapes, align layouts, and keep flow tidy.",
    icon: Layers,
  },
  {
    title: "Share instantly",
    description: "Invite teammates and iterate together in real time.",
    icon: Share2,
  },
];

export function Workflow() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 sm:px-12">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
          <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl animate-[float_12s_ease-in-out_infinite]" />

          <div
            className={`mx-auto max-w-3xl text-center transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
              From idea to diagram in minutes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              A lightweight workflow that keeps momentum high without getting in
              the way.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={`group rounded-2xl border border-border bg-background/60 p-6 shadow-sm transition-all duration-700 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-6"
                  }`}
                  style={{ transitionDelay: `${index * 120}ms` }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
