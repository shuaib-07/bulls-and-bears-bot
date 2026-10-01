"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const google_1 = require("next/font/google");
require("./globals.css");
const sound_1 = require("@/src/components/ui/sound");
const sonner_1 = require("sonner");
const orbitron = (0, google_1.Orbitron)({
    subsets: ["latin"],
    variable: "--font-orbitron",
    display: "swap",
    weight: ["500", "600", "700", "800", "900"],
});
const plusJakarta = (0, google_1.Plus_Jakarta_Sans)({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
    weight: ["300", "400", "500", "600", "700", "800"],
});
const jetbrainsMono = (0, google_1.JetBrains_Mono)({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
    weight: ["400", "500", "600", "700"],
});
exports.metadata = {
    title: "Bulls & Bears — The Ultimate Trading Simulation",
    description: "Real-time multiplayer market simulation by Ramaiah University of Applied Sciences. Read the news. Make your move. Outsmart the market.",
};
function RootLayout({ children, }) {
    return ((0, jsx_runtime_1.jsx)("html", { lang: "en", className: `${orbitron.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} dark antialiased selection:bg-[#FF5F1F]/30 selection:text-white`, children: (0, jsx_runtime_1.jsxs)("body", { className: "bg-[#030303] text-[#fafafa] min-h-screen relative font-sans", children: [(0, jsx_runtime_1.jsx)(sonner_1.Toaster, { theme: "dark", richColors: true, closeButton: true, position: "top-right" }), (0, jsx_runtime_1.jsx)(sound_1.SoundEffects, {}), (0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-noise pointer-events-none z-50" }), children] }) }));
}
