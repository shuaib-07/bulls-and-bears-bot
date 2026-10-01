"use strict";
'use client';
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
exports.Stepper = Stepper;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_1 = require("motion/react");
const hi_1 = require("react-icons/hi");
const digitVariants = {
    initial: (dir) => ({
        y: dir > 0 ? 20 : -20,
        opacity: 0,
        scale: 0.5,
        z: 0,
        filter: 'blur(2px)',
    }),
    animate: {
        y: 0,
        opacity: 1,
        scale: 1,
        z: 10,
        filter: 'blur(0px)',
    },
    exit: (dir) => ({
        y: dir > 0 ? -20 : 20,
        opacity: 0,
        scale: 0.5,
        z: 0,
        filter: 'blur(2px)',
    }),
};
function Stepper({ value, defaultValue = 0, min = 0, max = 999, onChange, }) {
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState(defaultValue);
    const [direction, setDirection] = React.useState(0);
    const current = isControlled ? value : internal;
    const digits = current.toString().split('');
    const [prevDigits, setPrevDigits] = React.useState([]);
    const [prevTicks, setPrevTicks] = React.useState([]);
    const len = digits.length;
    const lenDiff = len - prevDigits.length;
    const nextTicks = digits.map((digit, i) => {
        const prevI = i - lenDiff;
        const prevDigit = prevI >= 0 ? prevDigits[prevI] : undefined;
        const prevTick = prevI >= 0 ? prevTicks[prevI] : 0;
        return digit !== prevDigit ? (prevTick ?? 0) + 1 : (prevTick ?? 0);
    });
    if (prevDigits.join("") !== digits.join("")) {
        setPrevTicks(nextTicks);
        setPrevDigits(digits);
    }
    const step = (dir) => {
        const next = Math.min(max, Math.max(min, current + dir));
        if (next === current)
            return;
        setDirection(dir);
        if (!isControlled)
            setInternal(next);
        onChange?.(next);
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex w-full justify-center", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 rounded-full border-2 border-[#E6E6EF] bg-transparent px-1 py-1 shadow-sm sm:gap-5 dark:border-zinc-800", children: [(0, jsx_runtime_1.jsx)(react_1.motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.92 }, transition: { type: 'spring', stiffness: 300, damping: 22 }, onClick: () => step(-1), disabled: current <= min, className: "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F0EFF6] text-[#5A5A63] disabled:opacity-50 sm:h-14 sm:w-14 dark:bg-zinc-800 dark:text-zinc-400", children: (0, jsx_runtime_1.jsx)(hi_1.HiMinus, { className: "h-4 w-4 sm:h-5 sm:w-5" }) }), (0, jsx_runtime_1.jsx)("div", { className: "relative flex shrink-0 items-center justify-center gap-1 text-xl font-bold text-[#242426] perspective-midrange transform-3d sm:h-8 sm:text-3xl dark:text-white", children: digits.map((digit, index) => ((0, jsx_runtime_1.jsx)("div", { className: "relative w-3 transform-3d sm:h-8 sm:w-4", children: (0, jsx_runtime_1.jsx)(react_1.AnimatePresence, { mode: "popLayout", initial: false, custom: direction, children: (0, jsx_runtime_1.jsx)(react_1.motion.span, { custom: direction, variants: digitVariants, initial: "initial", animate: "animate", exit: "exit", transition: {
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 16,
                                    mass: 1.2,
                                }, className: "absolute inset-0 flex items-center justify-center tabular-nums", children: digit }, nextTicks[index]) }) }, `${index}-${len}`))) }), (0, jsx_runtime_1.jsx)(react_1.motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.92 }, transition: { type: 'spring', stiffness: 300, damping: 22 }, onClick: () => step(1), disabled: current >= max, className: "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F0EFF6] text-[#5A5A63] disabled:opacity-50 sm:h-14 sm:w-14 dark:bg-zinc-800 dark:text-zinc-400", children: (0, jsx_runtime_1.jsx)(hi_1.HiPlus, { className: "h-4 w-4 sm:h-5 sm:w-5" }) })] }) }));
}
