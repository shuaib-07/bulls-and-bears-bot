"use client";

import { Navbar } from "@/src/components/landing/Navbar";
import { PinnedHeroStage } from "@/src/components/landing/PinnedHeroStage";
import { RulesSection } from "@/src/components/landing/RulesSection";
import { GameStructure } from "@/src/components/landing/GameStructure";
import { InteractiveDemo } from "@/src/components/landing/InteractiveDemo";
import { EventDetails } from "@/src/components/landing/EventDetails";
import { FAQSection } from "@/src/components/landing/FAQSection";
import { Footer } from "@/src/components/landing/Footer";
import { ScrollProgress } from "@/src/components/ui/scroll-progress";

export default function LandingPage() {
  return (
    <main className="responsive-page relative min-h-screen bg-[var(--bg)] text-[var(--fg)] overflow-x-hidden selection:bg-[var(--accent)]/30 selection:text-white">
      {/* Top Cyber Gradient Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Global Scroll Spy Header */}
      <Navbar />

      {/* SECTION 1: Pinned WebGL 3D Hero Stage with GSAP Multi-Phase Scroll Timeline */}
      <PinnedHeroStage />

      {/* Subsequent Sections in High-End Glass Slabs with Typography Reveals */}
      <div className="relative z-10 w-full space-y-12 pb-16">
        <RulesSection />
        <GameStructure />
        <InteractiveDemo />
        <EventDetails />
        <FAQSection />
        <Footer />
      </div>
    </main>
  );
}
