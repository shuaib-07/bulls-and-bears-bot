"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlippingWordSwap = FlippingWordSwap;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("@/src/lib/utils");
const gsap_1 = __importDefault(require("gsap"));
const react_1 = require("react");
const graphemeSegmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
function segmentCharacters(text) {
    if (!graphemeSegmenter)
        return Array.from(text);
    return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
}
function FlippingWordSwap({ word1, word2, duration = 400, stagger = 44, className, toClassName, style, toStyle, }) {
    const containerRef = (0, react_1.useRef)(null);
    const timelineRef = (0, react_1.useRef)(null);
    const swappedRef = (0, react_1.useRef)(false);
    const [isSwapped, setIsSwapped] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const resolvedDuration = prefersReducedMotion
            ? 0
            : Math.max(180, duration) / 1000;
        const resolvedStagger = prefersReducedMotion
            ? 0
            : Math.max(0, stagger) / 1000;
        const context = gsap_1.default.context(() => {
            const firstWord = gsap_1.default.utils.toArray('[data-flip-word="first"]');
            const secondWord = gsap_1.default.utils.toArray('[data-flip-word="second"]');
            gsap_1.default.set(firstWord, {
                rotationX: 0,
                opacity: 1,
                transformOrigin: "center top",
            });
            gsap_1.default.set(secondWord, {
                rotationX: -82,
                opacity: 0,
                transformOrigin: "center bottom",
            });
            const timeline = gsap_1.default.timeline({ paused: true });
            timeline
                .to(firstWord, {
                rotationX: 82,
                opacity: 0,
                duration: resolvedDuration,
                stagger: resolvedStagger,
                ease: "power2.in",
            })
                .to(secondWord, {
                rotationX: 0,
                opacity: 1,
                duration: resolvedDuration,
                stagger: resolvedStagger,
                ease: "power2.out",
            }, `<${resolvedDuration * 0.62}`);
            if (swappedRef.current)
                timeline.progress(1);
            timelineRef.current = timeline;
        }, containerRef);
        return () => {
            timelineRef.current = null;
            context.revert();
        };
    }, [duration, stagger, word1, word2]);
    const updateSwap = (0, react_1.useCallback)((next) => {
        swappedRef.current = next;
        setIsSwapped(next);
        if (next) {
            timelineRef.current?.play();
        }
        else {
            timelineRef.current?.reverse();
        }
    }, []);
    const renderCharacters = (text, layer) => segmentCharacters(text).map((character, index) => ((0, jsx_runtime_1.jsx)("span", { "data-flip-word": layer, className: "inline-block whitespace-pre [backface-visibility:hidden] [will-change:transform,opacity]", children: character === " " ? "\u00a0" : character }, `${layer}-${index}-${character}`)));
    return ((0, jsx_runtime_1.jsx)("button", { ref: containerRef, type: "button", className: (0, utils_1.cn)("relative inline-grid cursor-pointer select-none border-0 bg-transparent p-0 align-baseline font-[inherit] leading-[inherit] tracking-[inherit] text-[inherit]", "rounded-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30 focus-visible:ring-offset-2", className), "aria-label": isSwapped ? word2 : word1, "aria-pressed": isSwapped, style: style, onMouseEnter: () => updateSwap(true), onMouseLeave: () => updateSwap(false), onPointerUp: (event) => {
            if (event.pointerType !== "mouse")
                updateSwap(!swappedRef.current);
        }, onFocus: (event) => {
            if (event.currentTarget.matches(":focus-visible"))
                updateSwap(true);
        }, onBlur: () => updateSwap(false), children: (0, jsx_runtime_1.jsxs)("span", { className: "col-start-1 row-start-1 inline-grid overflow-hidden [perspective:800px]", children: [(0, jsx_runtime_1.jsx)("span", { className: "col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre", "aria-hidden": "true", children: renderCharacters(word1, "first") }), (0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre", toClassName), "aria-hidden": "true", style: toStyle, children: renderCharacters(word2, "second") })] }) }));
}
