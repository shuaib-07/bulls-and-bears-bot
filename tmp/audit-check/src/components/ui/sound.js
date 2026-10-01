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
exports.setSoundMuted = setSoundMuted;
exports.useSoundMuted = useSoundMuted;
exports.setSoundVolume = setSoundVolume;
exports.useSoundVolume = useSoundVolume;
exports.playSound = playSound;
exports.SoundEffects = SoundEffects;
exports.SoundToggle = SoundToggle;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/src/lib/utils");
// Global Sound State
let isMuted = false;
let soundVolume = 0.6;
const listeners = new Set();
function notify() {
    listeners.forEach((listener) => listener());
}
function setSoundMuted(muted) {
    isMuted = muted;
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem("bulls_sound_muted", String(muted));
        }
        catch { }
    }
    notify();
}
function useSoundMuted() {
    const [muted, setMuted] = React.useState(() => {
        if (typeof window === "undefined")
            return false;
        try {
            return localStorage.getItem("bulls_sound_muted") === "true";
        }
        catch {
            return false;
        }
    });
    React.useEffect(() => {
        const handler = () => setMuted(isMuted);
        listeners.add(handler);
        return () => {
            listeners.delete(handler);
        };
    }, []);
    return muted;
}
function setSoundVolume(volume) {
    soundVolume = Math.max(0, Math.min(1, volume));
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem("bulls_sound_volume", String(soundVolume));
        }
        catch { }
    }
    notify();
}
function useSoundVolume() {
    const [vol, setVol] = React.useState(() => {
        if (typeof window === "undefined")
            return 0.6;
        try {
            const stored = localStorage.getItem("bulls_sound_volume");
            return stored ? parseFloat(stored) : 0.6;
        }
        catch {
            return 0.6;
        }
    });
    React.useEffect(() => {
        const handler = () => setVol(soundVolume);
        listeners.add(handler);
        return () => {
            listeners.delete(handler);
        };
    }, []);
    return vol;
}
// Low-latency Web Audio Context synthesis engine
let audioCtx = null;
function getAudioContext() {
    if (typeof window === "undefined")
        return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext ||
            window
                .webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => { });
    }
    return audioCtx;
}
function playSound(name = "tap") {
    if (isMuted || soundVolume <= 0)
        return;
    const ctx = getAudioContext();
    if (!ctx)
        return;
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(soundVolume, now);
    masterGain.connect(ctx.destination);
    switch (name) {
        case "press":
        case "click":
        case "tap": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(480, now);
            osc.frequency.exponentialRampToValueAtTime(240, now + 0.04);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.045);
            break;
        }
        case "toggle": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(580, now);
            osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.055);
            break;
        }
        case "submit":
        case "buy":
        case "success": {
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0, now + idx * 0.06);
                gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.06 + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.14);
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.15);
            });
            break;
        }
        case "sell":
        case "swap": {
            const notes = [659.25, 523.25, 783.99]; // E5, C5, G5
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                gain.gain.setValueAtTime(0.2, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.13);
            });
            break;
        }
        case "error": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.18);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.19);
            break;
        }
        case "bell": {
            const freqs = [880, 1760, 2640];
            freqs.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.25 / (i + 1), now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(now);
                osc.stop(now + 1.25);
            });
            break;
        }
        case "siren": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(900, now + 0.2);
            osc.frequency.linearRampToValueAtTime(600, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.5);
            break;
        }
    }
}
// Single Global Listener that reads `data-slot` and `data-sound`
function SoundEffects() {
    React.useEffect(() => {
        const handlePointerDown = (e) => {
            const target = e.target;
            if (!target)
                return;
            const element = target.closest("[data-sound], [data-slot], button, a, input[type='checkbox'], input[type='radio'], input[type='submit']");
            if (!element)
                return;
            const explicitSound = element.getAttribute("data-sound");
            if (explicitSound) {
                playSound(explicitSound);
                return;
            }
            const slot = element.getAttribute("data-slot");
            if (slot) {
                switch (slot) {
                    case "button":
                    case "scroll-progress":
                    case "scroll-progress-surface":
                        playSound("tap");
                        return;
                    case "tab":
                    case "switch":
                    case "checkbox":
                        playSound("toggle");
                        return;
                    case "dialog-close":
                        playSound("press");
                        return;
                }
            }
            // Default HTML tag press feedback
            if (element.tagName === "BUTTON" || element.tagName === "A") {
                playSound("tap");
            }
        };
        document.addEventListener("pointerdown", handlePointerDown, { passive: true });
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, []);
    return null;
}
function SoundToggle({ className, ...props }) {
    const muted = useSoundMuted();
    return ((0, jsx_runtime_1.jsx)("button", { type: "button", "data-slot": "sound-toggle", "data-sound": "toggle", "aria-label": muted ? "Unmute audio" : "Mute audio", onClick: () => setSoundMuted(!muted), className: (0, utils_1.cn)("inline-flex items-center justify-center rounded-sm p-2 text-zinc-400 hover:text-white transition-colors border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 select-none", className), ...props, children: muted ? ((0, jsx_runtime_1.jsx)(lucide_react_1.VolumeX, { className: "w-4 h-4 text-zinc-500" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Volume2, { className: "w-4 h-4 text-emerald-400" })) }));
}
