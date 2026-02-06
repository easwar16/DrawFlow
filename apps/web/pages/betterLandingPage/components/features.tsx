"use client";

import { useEffect, useRef, useState } from "react";
import { Expand, Pencil, Users, Download } from "lucide-react";

const features = [
  {
    icon: Expand,
    title: "Infinite Canvas",
    description:
      "Never run out of space. Pan and zoom seamlessly across an unlimited drawing surface.",
  },
  {
    icon: Pencil,
    title: "Hand-drawn Style",
    description:
      "Create beautiful, organic-looking diagrams with our signature hand-drawn aesthetic.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description:
      "Work together with your team in real-time. See changes as they happen.",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description:
      "Export your drawings to PNG, SVG, or JSON. Use them wherever you need.",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const Icon = feature.icon;

  return (
    <div
      ref={cardRef}
      className={`group relative bg-card border border-border rounded-2xl p-8 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        {feature.title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

export function Features() {
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
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      className="relative overflow-hidden py-24 sm:py-32 bg-muted/30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-[float_14s_ease-in-out_infinite]" />
          <div className="absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl animate-[float_16s_ease-in-out_infinite]" />
        </div>
        <div
          ref={sectionRef}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Everything you need to{" "}
            <span className="text-primary">sketch ideas</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
            Powerful features wrapped in a simple, intuitive interface. Focus on
            your ideas, not the tool.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
