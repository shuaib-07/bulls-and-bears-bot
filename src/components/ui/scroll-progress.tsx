"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/src/lib/utils";

export type ScrollProgressSection = { id: string; label: string };

export type ScrollProgressProps = React.ComponentProps<"div"> & {
  sections?: ScrollProgressSection[];
  containerRef?: React.RefObject<HTMLElement | null>;
  showTopBar?: boolean;
};

export function ScrollProgress({
  className,
  sections = [],
  containerRef,
  showTopBar = true,
  ...props
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll(
    containerRef ? { container: containerRef } : undefined
  );

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <>
      {/* Sleek Top Cyber Scroll Progress Bar */}
      {showTopBar && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-transparent z-[100] pointer-events-none">
          <motion.div
            className={cn(
              "h-full origin-left bg-gradient-to-r from-[#FF5F1F] via-[#FF8C38] to-[#10B981] shadow-[0_0_12px_rgba(255,95,31,0.8)]",
              className
            )}
            style={{ scaleX }}
          />
        </div>
      )}

      {/* Optional Floating Section Pill (Only renders if sections are actually provided) */}
      {sections.length > 0 && (
        <FloatingSectionPill
          sections={sections}
          containerRef={containerRef}
          scrollYProgress={scrollYProgress}
          {...props}
        />
      )}
    </>
  );
}

function FloatingSectionPill({
  sections,
  containerRef,
  scrollYProgress,
  className,
}: {
  sections: ScrollProgressSection[];
  containerRef?: React.RefObject<HTMLElement | null>;
  scrollYProgress: any;
  className?: string;
}) {
  const [activeId, setActiveId] = React.useState(sections[0]?.id);

  React.useEffect(() => {
    const scroller = containerRef?.current ?? window;

    const update = () => {
      const active = sections.findLast(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= 160;
      });
      setActiveId(active?.id ?? sections[0]?.id);
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scroller.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections, containerRef]);

  const activeLabel = sections.find((s) => s.id === activeId)?.label || sections[0]?.label;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto",
        className
      )}
    >
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#09090b]/90 border border-[#27272a] backdrop-blur-md shadow-2xl shadow-black/80 font-mono text-xs">
        <span className="w-2 h-2 rounded-full bg-[#FF5F1F] animate-pulse" />
        <span className="text-[#a1a1aa] uppercase text-[10px] tracking-wider">Section:</span>
        <span className="text-white font-bold">{activeLabel}</span>
      </div>
    </div>
  );
}

export default ScrollProgress;
