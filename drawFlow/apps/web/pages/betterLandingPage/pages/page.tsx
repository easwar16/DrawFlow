"use client";

import { CallToAction } from "../components/call-to-action";
import { Features } from "../components/features";
import { Footer } from "../components/footer";
import { Header } from "../components/header";
import { Hero } from "../components/hero";
import Preview from "../components/preview";
import { Workflow } from "../components/workflow";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <Preview />
      <Workflow />
      {/* <WhyDrawFlow /> */}
      <CallToAction />
      <Footer />
    </main>
  );
}
