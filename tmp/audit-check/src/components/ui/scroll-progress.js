"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrollProgress = ScrollProgress;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const framer_motion_1 = require("framer-motion");
const utils_1 = require("@/src/lib/utils");
function ScrollProgress({ className, sections = [], containerRef, showTopBar = true, ...props }) {
    const { scrollYProgress } = (0, framer_motion_1.useScroll)(containerRef ? { container: containerRef } : undefined);
    const scaleX = (0, framer_motion_1.useSpring)(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [showTopBar && ((0, jsx_runtime_1.jsx)("div", { className: "fixed top-0 left-0 right-0 h-[3px] bg-transparent z-[100] pointer-events-none", children: (0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { className: (0, utils_1.cn)("h-full origin-left bg-gradient-to-r from-[#FF5F1F] via-[#FF8C38] to-[#10B981] shadow-[0_0_12px_rgba(255,95,31,0.8)]", className), style: { scaleX } }) })), sections.length > 0 && ((0, jsx_runtime_1.jsx)(FloatingSectionPill, { sections: sections, containerRef: containerRef, scrollYProgress: scrollYProgress, ...props }))] }));
}
function FloatingSectionPill({ sections, containerRef, scrollYProgress, className, }) {
    const [activeId, setActiveId] = React.useState(sections[0]?.id);
    React.useEffect(() => {
        const scroller = containerRef?.current ?? window;
        const update = () => {
            const active = sections.findLast(({ id }) => {
                const el = document.getElementById(id);
                if (!el)
                    return false;
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
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto", className), children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#09090b]/90 border border-[#27272a] backdrop-blur-md shadow-2xl shadow-black/80 font-mono text-xs", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-2 h-2 rounded-full bg-[#FF5F1F] animate-pulse" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[#a1a1aa] uppercase text-[10px] tracking-wider", children: "Section:" }), (0, jsx_runtime_1.jsx)("span", { className: "text-white font-bold", children: activeLabel })] }) }));
}
exports.default = ScrollProgress;
