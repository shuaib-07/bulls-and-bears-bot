"use strict";
// Synthesized Web Audio Sound Effects for Bulls & Bears
Object.defineProperty(exports, "__esModule", { value: true });
exports.sounds = void 0;
class SoundEngine {
    ctx = null;
    getContext() {
        if (typeof window === "undefined")
            return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
        return this.ctx;
    }
    // 🔔 Wall Street Opening Market Bell
    playMarketBell() {
        const ctx = this.getContext();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Layered bell harmonics
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0.3 / (i + 1), now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8 + i * 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + 2.0 + i * 0.1);
        });
    }
    // 🚨 Breaking News Siren Alert
    playNewsAlert() {
        const ctx = this.getContext();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.15);
        osc.frequency.linearRampToValueAtTime(880, now + 0.3);
        osc.frequency.linearRampToValueAtTime(440, now + 0.45);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
    }
    // 💰 Trade Executed / Cash Register Chime
    playTradeSuccess() {
        const ctx = this.getContext();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        const notes = [587.33, 880, 1174.66]; // D5, A5, D6
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.2, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.45);
        });
    }
    // ❌ Error / Trade Rejection Buzz
    playTradeError() {
        const ctx = this.getContext();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }
    // 🔕 Market Close Gong
    playMarketClose() {
        const ctx = this.getContext();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 2.5);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.6);
    }
    // ⏱ Subtle Tick / UI Click Sound
    playTick() {
        const ctx = this.getContext();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }
}
exports.sounds = new SoundEngine();
