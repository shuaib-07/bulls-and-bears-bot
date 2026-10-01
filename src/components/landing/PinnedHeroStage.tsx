"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { BullBearClash } from "./BullBearClash";
import { Play, TrendingUp, ShieldCheck, Lock, ArrowLeftRight, Clock, DollarSign } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CONFIG = {
  scrollDistance: "+=4200",
  scrubSmoothing: 1,
  particleCount: 10000,
  particleSize: 1.6,
  spread: 2400,
  orbRadius: 280,
  cameraZStart: 600,
  cameraZEnd: 150,
  idleRotationSpeed: 0.0007,
  scrollRotationFactor: 0.45,
};

const THEMES = [
  { id: "#pinned-stage", bg: "#030303", accent: "#FF5F1F", border: "#1e1e1e", panel: "rgba(20, 20, 20, 0.4)" },
  { id: "#rules", bg: "#050508", accent: "#FF5F1F", border: "#1a1c23", panel: "rgba(15, 20, 30, 0.4)" },
  { id: "#structure", bg: "#02040a", accent: "#3b82f6", border: "#161b22", panel: "rgba(10, 15, 25, 0.4)" },
  { id: "#demo", bg: "#000000", accent: "#10B981", border: "#171717", panel: "rgba(15, 15, 15, 0.4)" },
  { id: "#event", bg: "#05030a", accent: "#FF5F1F", border: "#201633", panel: "rgba(20, 15, 35, 0.4)" },
  { id: "#faq", bg: "#020202", accent: "#eab308", border: "#111111", panel: "rgba(10, 10, 10, 0.4)" },
  { id: "#access", bg: "#000000", accent: "#FF5F1F", border: "#1a1a1a", panel: "rgba(15, 15, 15, 0.4)" },
];

export function PinnedHeroStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const webglRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, particles: THREE.Points;
    let animationFrameId: number;

    const state = {
      scrollProgress: 0,
      targetProgress: 0,
    };

    const webglState = {
      fieldPositions: new Float32Array(CONFIG.particleCount * 3),
      orbPositions: new Float32Array(CONFIG.particleCount * 3),
    };

    const themeProxy = {
      bg: new THREE.Color(THEMES[0].bg),
      accent: new THREE.Color(THEMES[0].accent),
    };

    // 1. Initialize WebGL
    const initWebGL = () => {
      if (!webglRef.current) return;
      webglRef.current.innerHTML = "";

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(themeProxy.bg.getHex(), 0.0015);
      scene.background = themeProxy.bg;

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
      camera.position.z = CONFIG.cameraZStart;

      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      webglRef.current.appendChild(renderer.domElement);

      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(CONFIG.particleCount * 3);

      for (let i = 0; i < CONFIG.particleCount; i++) {
        webglState.fieldPositions[i * 3] = (Math.random() - 0.5) * CONFIG.spread;
        webglState.fieldPositions[i * 3 + 1] = (Math.random() - 0.5) * CONFIG.spread;
        webglState.fieldPositions[i * 3 + 2] = (Math.random() - 0.5) * CONFIG.spread;

        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = CONFIG.orbRadius * Math.cbrt(Math.random());

        webglState.orbPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        webglState.orbPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        webglState.orbPositions[i * 3 + 2] = r * Math.cos(phi);

        vertices[i * 3] = webglState.orbPositions[i * 3];
        vertices[i * 3 + 1] = webglState.orbPositions[i * 3 + 1];
        vertices[i * 3 + 2] = webglState.orbPositions[i * 3 + 2];
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

      const material = new THREE.PointsMaterial({
        color: themeProxy.accent,
        size: CONFIG.particleSize,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      particles = new THREE.Points(geometry, material);
      scene.add(particles);

      window.addEventListener("resize", handleResize);
      renderWebGL();
    };

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const renderWebGL = () => {
      animationFrameId = requestAnimationFrame(renderWebGL);

      state.scrollProgress += (state.targetProgress - state.scrollProgress) * 0.05;
      const p = state.scrollProgress;
      const t = Math.max(0, Math.min(1, (p - 0.15) / (0.75 - 0.15)));
      const smooth = t * t * (3 - 2 * t);

      let orbMix = 0.8 * (1 - smooth);
      orbMix = Math.max(orbMix, 0.12);

      const positions = particles.geometry.attributes.position.array as Float32Array;
      const field = webglState.fieldPositions;
      const orb = webglState.orbPositions;

      for (let i = 0; i < positions.length; i++) {
        positions[i] = field[i] + (orb[i] - field[i]) * orbMix;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      camera.position.z = CONFIG.cameraZStart - (CONFIG.cameraZStart - CONFIG.cameraZEnd) * state.scrollProgress;
      if (scene.fog && "density" in scene.fog) {
        (scene.fog as THREE.FogExp2).density = 0.0015 + state.scrollProgress * 0.0005;
      }

      const dynamicRotation = CONFIG.idleRotationSpeed + p * 0.001;
      particles.rotation.y += dynamicRotation;
      particles.rotation.x = state.scrollProgress * CONFIG.scrollRotationFactor;

      renderer.render(scene, camera);
    };

    // 2. Lenis Smooth Scroll Setup
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.8,
      anchors: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);

    // 3. Theme Application on Scroll
    const applyTheme = (theme: (typeof THEMES)[0]) => {
      gsap.to(document.documentElement, {
        "--bg": theme.bg,
        "--accent": theme.accent,
        "--border": theme.border,
        "--panel": theme.panel,
        duration: 1.2,
        ease: "power2.out",
      });

      const targetBg = new THREE.Color(theme.bg);
      const targetAccent = new THREE.Color(theme.accent);

      gsap.to(themeProxy.bg, {
        r: targetBg.r,
        g: targetBg.g,
        b: targetBg.b,
        duration: 1.2,
        onUpdate: () => {
          if (scene && scene.fog) {
            scene.background = themeProxy.bg;
            (scene.fog as THREE.FogExp2).color.copy(themeProxy.bg);
          }
        },
      });

      gsap.to(themeProxy.accent, {
        r: targetAccent.r,
        g: targetAccent.g,
        b: targetAccent.b,
        duration: 1.2,
        onUpdate: () => {
          if (particles) {
            (particles.material as THREE.PointsMaterial).color.copy(themeProxy.accent);
          }
        },
      });
    };

    THEMES.forEach((theme) => {
      ScrollTrigger.create({
        trigger: theme.id,
        start: "top 50%",
        end: "bottom 50%",
        onEnter: () => applyTheme(theme),
        onEnterBack: () => applyTheme(theme),
      });

      ScrollTrigger.create({
        trigger: theme.id,
        start: "top 60%",
        end: "bottom 40%",
        onToggle: (self) => {
          if (self.isActive) {
            const navLinks = document.querySelectorAll(".nav-link");
            const targetLink = document.querySelector(`.nav-link[href="${theme.id}"]`);
            if (targetLink) {
              navLinks.forEach((l) => l.classList.remove("is-active"));
              targetLink.classList.add("is-active");
            }
          }
        },
      });
    });

    // 4. Hero Arrival Animation
    gsap.set("#clash-title", { autoAlpha: 0, y: 24, scale: 0.96 });
    gsap.set(".clash-impact", { autoAlpha: 0, scale: 0.65, svgOrigin: "500 200" });
    gsap.to("#ui-top, #ui-bottom", { opacity: 1, y: 0, duration: 1, ease: "power2.out", delay: 0.5 });
    gsap.to("#hero-descriptor, #hero-ctas", { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power2.out", delay: 0.8 });

    // 5. Pinned Stage Master Scroll Timeline
    gsap.set(".feature-card", { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#pinned-stage",
        start: "top top",
        end: CONFIG.scrollDistance,
        pin: true,
        scrub: CONFIG.scrubSmoothing,
        onUpdate: (self) => {
          state.targetProgress = self.progress;
          gsap.set("#scroll-progress-hud", { scaleY: self.progress });
        },
      },
    });

    // PHASE 2: Forward Push (Scanline sweep + grid)
    tl.to("#phase-1-content", { autoAlpha: 0, y: -40, filter: "blur(8px)", duration: 1, ease: "power2.inOut", pointerEvents: "none" }, 0.1)
      .to("#phase-2-content", { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.2, ease: "power2.out", pointerEvents: "auto" }, 0.5)
      .to("#phase-2-scanline", { opacity: 0.35, duration: 0.2, ease: "power1.inOut" }, 0.6)
      .to("#phase-2-scanline", { top: "110%", duration: 1.2, ease: "linear" }, 0.6)
      .to("#phase-2-scanline", { opacity: 0, duration: 0.2, ease: "power1.inOut" }, 1.6);

    // PHASE 3: Content Emergence with 4 3D Feature Cards
    tl.to("#phase-2-content", { opacity: 0, y: -40, filter: "blur(8px)", duration: 1, ease: "power2.inOut", pointerEvents: "none" }, 1.7)
      .to("#phase-3-content", { opacity: 1, duration: 0.8, ease: "power2.out", pointerEvents: "auto" }, 1.8)
      .to("#phase-3-intro", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 1.9)
      .fromTo(
        ".feature-card",
        { opacity: 0, y: 30, scale: 0.94, filter: "blur(12px)", rotateX: 6 },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", rotateX: 0, stagger: 0.18, duration: 1.2, ease: "power3.out" },
        2.1
      );

    // Hold Cards in View
    tl.to(".feature-card", { y: -15, duration: 1.8, ease: "none" }, 3.3);
    tl.to({}, { duration: 0.4 }, 5.1);

    // PHASE 4: Bridge Moment
    tl.to("#phase-3-content", { opacity: 0, y: -40, filter: "blur(8px)", duration: 1, ease: "power2.inOut", pointerEvents: "none" }, 5.5)
      .to("#bridge-content", { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power2.out", pointerEvents: "auto" }, 5.8)
      .to(".bridge-stagger", { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: "power3.out" }, 5.9);

    // PHASE 5: Exit Stage
    tl.to("#bridge-content, #ui-top, #ui-bottom", {
      opacity: 0,
      y: -20,
      filter: "blur(4px)",
      duration: 1,
      ease: "power2.inOut",
    }, 7.6);

    // Make room for the clash and a readable title hold before the existing tour.
    tl.shiftChildren(3.2);
    tl.to(".clash-bull", { x: 66, rotation: -3, svgOrigin: "290 260", duration: 0.95, ease: "power2.in" }, 0)
      .to(".clash-bear", { x: -44, y: 40, rotation: -8, svgOrigin: "710 260", duration: 0.95, ease: "power2.in" }, 0)
      .to(".clash-labels, .clash-scroll-cue", { autoAlpha: 0, duration: 0.3 }, 0.5)
      .to(".clash-impact", { autoAlpha: 0.9, scale: 1, duration: 0.15 }, 0.9)
      .to(".clash-impact", { autoAlpha: 0, scale: 2.7, duration: 0.65, ease: "power2.out" }, 1.05)
      .to(".clash-bull", { x: 42, rotation: 1, duration: 0.4, ease: "power3.out" }, 0.95)
      .to(".clash-bear", { x: -22, y: 10, rotation: -2, duration: 0.4, ease: "power3.out" }, 0.95)
      .to(".clash-art", { autoAlpha: 0.12, scale: 1.08, duration: 0.75 }, 1.2)
      .fromTo("#clash-title", { autoAlpha: 0, y: 24, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out", immediateRender: false }, 1.4);

    // 6. Typography Mask Reveals for lower sections
    document.querySelectorAll(".reveal-text").forEach((text) => {
      gsap.fromTo(
        text,
        { yPercent: 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: text.closest(".reveal-block"),
            start: "top 85%",
          },
        }
      );
    });

    document.querySelectorAll(".reveal-block").forEach((block) => {
      gsap.fromTo(
        block.querySelectorAll(".reveal-item"),
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: block,
            start: "top 80%",
          },
        }
      );
    });

    // The vector hero and scroll sequence also work on devices without WebGL.
    try {
      initWebGL();
    } catch {
      webglRef.current?.querySelector("canvas")?.remove();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      gsap.ticker.remove(tick);
      lenis.destroy();
      particles?.geometry.dispose();
      if (particles) (particles.material as THREE.PointsMaterial).dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
    });
    return () => media.revert();
  }, []);

  return (
    <>
      {/* Three.js Particle WebGL Canvas */}
      <div id="webgl-container" ref={webglRef} className="fixed inset-0 z-0 pointer-events-none w-full h-full">
        <div className="absolute inset-0 bg-noise z-10" />
      </div>

      {/* SECTION 1: THE PINNED HERO STAGE */}
      <section
        id="pinned-stage"
        ref={containerRef}
        className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-transparent z-10"
      >
        {/* HUD Overlay Frame */}
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6 md:px-12 md:py-8 mt-16">
          <div className="flex justify-between items-center opacity-0 translate-y-[-10px]" id="ui-top">
            <div className="text-[10px] font-mono font-medium tracking-widest uppercase flex items-center gap-3">
              <span className="text-[var(--muted)]">SYS.01 // RUAS DATA SCIENCE</span>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-[var(--muted)] font-medium">
              OCT 1ST // SLH 15
            </div>
          </div>

          <div className="flex justify-between items-end opacity-0 translate-y-[10px]" id="ui-bottom">
            <div className="flex flex-col gap-1 text-[10px] font-mono text-[var(--muted)] font-medium tracking-widest uppercase">
              <span className="text-[#10B981] flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
                Status: Engine Live
              </span>
              <span>Mode: 4-Phase Multi-Round</span>
            </div>
            <div className="flex flex-col items-end gap-3 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] font-medium">
              <span>Depth Mapping</span>
              <div className="w-[1px] h-12 bg-[var(--border)] relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 w-full h-full bg-[var(--accent)] transform origin-top scale-y-0 will-change-transform"
                  id="scroll-progress-hud"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3D Perspective Container */}
        <div className="hero-phases flex w-full z-20 px-6 absolute inset-0 items-center justify-center perspective-[1000px]">
          {/* Phase 1: Arrival */}
          <div id="phase-1-content" className="absolute flex flex-col items-center justify-center text-center w-full pointer-events-auto px-4">
            <div className="w-full max-w-[980px] mx-auto flex flex-col items-center">
              <div className="clash-stage">
                <BullBearClash />
                <div id="clash-title">
                  <p className="clash-eyebrow font-mono">RUAS / THE ULTIMATE TRADING SIMULATION</p>
                  <h1 className="font-display">Bulls <span>&</span> Bears</h1>
                  <p className="clash-title-caption font-mono">TWO FORCES. ONE MARKET.</p>
                </div>
                <p className="clash-scroll-cue font-mono">SCROLL TO COLLIDE <span>↓</span></p>
              </div>

              <div className="flex flex-col items-center gap-3 mt-2 opacity-0 translate-y-[15px]" id="hero-descriptor">
                <span className="text-[10px] md:text-xs tracking-[0.25em] uppercase text-[var(--accent)] font-mono font-bold">
                  READ THE NEWS · MAKE YOUR MOVE · OUTSMART THE MARKET
                </span>
                <p className="text-xs md:text-sm text-[var(--muted)] font-normal max-w-xl leading-relaxed">
                  A high-octane algorithmic and negotiation trading floor. Start with <strong className="text-white font-mono">$100,000</strong>, race against real-time countdown clocks, and compete for scarce <strong className="text-white font-mono">100-share float limits</strong>.
                </p>
              </div>

              <div className="flex gap-4 mt-8 opacity-0 translate-y-[15px]" id="hero-ctas">
                <a
                  href="https://tally.so/r/NpkK20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 text-xs tracking-widest uppercase font-mono font-bold bg-[var(--accent)] text-black hover:bg-white transition-colors duration-300 rounded-sm shadow-[0_0_25px_rgba(255,95,31,0.4)] flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  REGISTER NOW
                </a>
                <a
                  href="#rules"
                  className="px-8 py-3.5 text-xs tracking-widest uppercase font-mono font-medium border border-[var(--border)] bg-black/50 backdrop-blur-md text-[var(--fg)] hover:bg-[var(--fg)] hover:text-black transition-colors duration-300 rounded-sm hidden sm:inline-block"
                >
                  Explore Protocol
                </a>
              </div>
            </div>
          </div>

          {/* Phase 2: Forward Push */}
          <div
            id="phase-2-content"
            className="absolute inset-0 w-full flex flex-col items-center justify-center text-center opacity-0 pointer-events-none blur-[6px] scale-[0.98] px-4 overflow-hidden"
          >
            <div id="phase-2-grid" className="absolute inset-0 pointer-events-none" />
            <div id="phase-2-scanline" className="absolute left-0 right-0 h-px pointer-events-none" />
            <div className="w-full max-w-[980px] mx-auto flex flex-col items-center py-12 md:py-16 relative z-10">
              <h3 className="text-2xl md:text-4xl sm:text-5xl tracking-tight font-display font-bold leading-relaxed text-[var(--fg)] drop-shadow-2xl uppercase">
                Institutional arena for
                <br />
                <span className="text-[var(--accent)]">data science quants.</span>
              </h3>
            </div>
          </div>

          {/* Phase 3: Content Emergence with 4 3D Feature Cards */}
          <div id="phase-3-content" className="absolute w-full flex flex-col items-center justify-center opacity-0 pointer-events-none px-4">
            <div id="phase-3-intro" className="w-full max-w-[980px] mx-auto text-center mb-6 px-6 opacity-0 translate-y-[20px]">
              <div className="text-[10px] text-[var(--muted)] font-mono font-medium tracking-widest mb-2 uppercase">
                SYS.02 // CORE MECHANICS
              </div>
              <h3 className="text-2xl md:text-3xl tracking-tight text-[var(--fg)] font-display font-bold mb-1">
                Real market dynamics with zero latency.
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] font-normal max-w-xl mx-auto">
                Anticipate price shocks, corner scarce supply, and negotiate under strict 10-minute clocks.
              </p>
            </div>

            {/* 4 Feature Cards Grid */}
            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-4">
              {/* Card 1 */}
              <div className="feature-card aspect-[3/4] bg-[rgba(15,15,15,0.4)] backdrop-blur-xl border border-[var(--border)] flex flex-col rounded-sm group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-[var(--muted)]">
                <div className="aspect-video w-full border-b border-[var(--border)] bg-[var(--panel)] flex flex-col relative z-20 group-hover:bg-[rgba(25,25,25,0.5)] transition-colors duration-500">
                  <div className="h-5 border-b border-[var(--border)] flex items-center px-2 gap-1.5 bg-black/40">
                    <div className="w-1.5 h-1.5 bg-[var(--accent)]" />
                    <div className="w-1.5 h-1.5 bg-[var(--border)]" />
                    <div className="w-1.5 h-1.5 bg-[var(--border)]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center w-full h-full text-[var(--accent)]">
                    <TrendingUp className="w-10 h-10 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-end z-20">
                  <span className="text-[10px] font-mono tracking-widest text-[var(--muted)] uppercase font-medium mb-1">01</span>
                  <h4 className="text-base font-bold text-[var(--fg)] mb-1 group-hover:text-white transition-colors">
                    Global Asset Universe
                  </h4>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Trade market leaders across Tech, Finance, Energy, and Healthcare with live order flow.
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--accent)] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </div>

              {/* Card 2 */}
              <div className="feature-card aspect-[3/4] bg-[rgba(15,15,15,0.4)] backdrop-blur-xl border border-[var(--border)] flex flex-col rounded-sm group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-[var(--muted)]">
                <div className="aspect-video w-full border-b border-[var(--border)] bg-[var(--panel)] flex flex-col relative z-20 group-hover:bg-[rgba(25,25,25,0.5)] transition-colors duration-500">
                  <div className="h-5 border-b border-[var(--border)] flex items-center px-2 gap-1.5 bg-black/40">
                    <div className="w-1.5 h-1.5 bg-[var(--border)]" />
                    <div className="w-1.5 h-1.5 bg-[#3b82f6]" />
                    <div className="w-1.5 h-1.5 bg-[var(--border)]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center w-full h-full text-[#3b82f6]">
                    <Lock className="w-10 h-10 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-end z-20">
                  <span className="text-[10px] font-mono tracking-widest text-[var(--muted)] uppercase font-medium mb-1">02</span>
                  <h4 className="text-base font-bold text-[var(--fg)] mb-1 group-hover:text-white transition-colors">
                    100-Share Scarcity
                  </h4>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Finite liquidity pools per equity. Corner supplies and command superior market pricing power.
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#3b82f6] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </div>

              {/* Card 3 */}
              <div className="feature-card aspect-[3/4] bg-[rgba(15,15,15,0.4)] backdrop-blur-xl border border-[var(--border)] flex flex-col rounded-sm group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-[var(--muted)]">
                <div className="aspect-video w-full border-b border-[var(--border)] bg-[var(--panel)] flex flex-col relative z-20 group-hover:bg-[rgba(25,25,25,0.5)] transition-colors duration-500">
                  <div className="h-5 border-b border-[var(--border)] flex items-center px-2 gap-1.5 bg-black/40">
                    <div className="w-1.5 h-1.5 bg-[var(--border)]" />
                    <div className="w-1.5 h-1.5 bg-[var(--border)]" />
                    <div className="w-1.5 h-1.5 bg-[#10B981]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center w-full h-full text-[#10B981]">
                    <ArrowLeftRight className="w-10 h-10 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-end z-20">
                  <span className="text-[10px] font-mono tracking-widest text-[var(--muted)] uppercase font-medium mb-1">03</span>
                  <h4 className="text-base font-bold text-[var(--fg)] mb-1 group-hover:text-white transition-colors">
                    P2P Swaps & 120s Direct Sales
                  </h4>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Propose bilateral equity swaps and direct team offers with live 120-second collision safeguards.
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#10B981] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </div>

              {/* Card 4 */}
              <div className="feature-card aspect-[3/4] bg-[rgba(15,15,15,0.4)] backdrop-blur-xl border border-[var(--border)] flex flex-col rounded-sm group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-[var(--muted)]">
                <div className="aspect-video w-full border-b border-[var(--border)] bg-[var(--panel)] flex flex-col relative z-20 group-hover:bg-[rgba(25,25,25,0.5)] transition-colors duration-500">
                  <div className="h-5 border-b border-[var(--border)] flex items-center px-2 gap-1.5 bg-black/40">
                    <div className="w-1.5 h-1.5 bg-[var(--accent)]" />
                    <div className="w-1.5 h-1.5 bg-[#10B981]" />
                    <div className="w-1.5 h-1.5 bg-[#3b82f6]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center w-full h-full text-[#a855f7]">
                    <ShieldCheck className="w-10 h-10 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-end z-20">
                  <span className="text-[10px] font-mono tracking-widest text-[var(--muted)] uppercase font-medium mb-1">04</span>
                  <h4 className="text-base font-bold text-[var(--fg)] mb-1 group-hover:text-white transition-colors">
                    Anti-Cheat Atomic Ledger
                  </h4>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Zero short selling, zero overdrafts. Every transaction is programmatically audited in real time.
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#a855f7] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </div>
            </div>
          </div>

          {/* Phase 4: Bridge Moment */}
          <div
            id="bridge-content"
            className="absolute flex flex-col items-center justify-center text-center w-full opacity-0 pointer-events-none blur-[10px] translate-y-[20px] px-4"
          >
            <div className="w-full max-w-[980px] mx-auto flex flex-col items-center py-12 md:py-16">
              <div className="bridge-stagger text-[10px] text-[var(--accent)] font-mono font-medium tracking-widest mb-6 uppercase flex items-center gap-3 drop-shadow-xl opacity-0 translate-y-[12px]">
                <div className="w-1.5 h-1.5 bg-[var(--accent)]" />
                [ TOURNAMENT_ACTIVE // SLH 15 ]
              </div>
              <h2 className="bridge-stagger text-3xl md:text-5xl lg:text-6xl tracking-tight text-[var(--fg)] font-display font-bold drop-shadow-2xl mb-4 opacity-0 translate-y-[12px]">
                We don't just simulate markets.
              </h2>
              <p className="bridge-stagger text-xs sm:text-base text-[var(--muted)] font-normal max-w-[680px] mx-auto mb-2 opacity-0 translate-y-[12px]">
                We analyze macroeconomic order flow, pressure-test execution timing,
              </p>
              <p className="bridge-stagger text-xs sm:text-base text-[var(--fg)] font-medium max-w-[680px] mx-auto opacity-0 translate-y-[12px]">
                and crown the <span className="text-[var(--accent)] font-bold">ultimate quantitative champion.</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
