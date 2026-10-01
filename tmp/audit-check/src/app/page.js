"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LandingPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const Navbar_1 = require("@/src/components/landing/Navbar");
const PinnedHeroStage_1 = require("@/src/components/landing/PinnedHeroStage");
const RulesSection_1 = require("@/src/components/landing/RulesSection");
const GameStructure_1 = require("@/src/components/landing/GameStructure");
const InteractiveDemo_1 = require("@/src/components/landing/InteractiveDemo");
const EventDetails_1 = require("@/src/components/landing/EventDetails");
const FAQSection_1 = require("@/src/components/landing/FAQSection");
const Footer_1 = require("@/src/components/landing/Footer");
const scroll_progress_1 = require("@/src/components/ui/scroll-progress");
function LandingPage() {
    return ((0, jsx_runtime_1.jsxs)("main", { className: "relative min-h-screen bg-[var(--bg)] text-[var(--fg)] overflow-x-hidden selection:bg-[var(--accent)]/30 selection:text-white", children: [(0, jsx_runtime_1.jsx)(scroll_progress_1.ScrollProgress, {}), (0, jsx_runtime_1.jsx)(Navbar_1.Navbar, {}), (0, jsx_runtime_1.jsx)(PinnedHeroStage_1.PinnedHeroStage, {}), (0, jsx_runtime_1.jsxs)("div", { className: "relative z-10 w-full space-y-12 pb-16", children: [(0, jsx_runtime_1.jsx)(RulesSection_1.RulesSection, {}), (0, jsx_runtime_1.jsx)(GameStructure_1.GameStructure, {}), (0, jsx_runtime_1.jsx)(InteractiveDemo_1.InteractiveDemo, {}), (0, jsx_runtime_1.jsx)(EventDetails_1.EventDetails, {}), (0, jsx_runtime_1.jsx)(FAQSection_1.FAQSection, {}), (0, jsx_runtime_1.jsx)(Footer_1.Footer, {})] })] }));
}
