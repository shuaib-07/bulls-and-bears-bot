"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAND_CONFIG = void 0;
exports.CompanyLogo = CompanyLogo;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const utils_1 = require("@/src/lib/utils");
// Comprehensive Brand Slug and Color Database for all 30 Simulation Stocks
exports.BRAND_CONFIG = {
    AAPL: { name: "Apple", slug: "apple", theSvgSlug: "apple", variant: "default", color: "#A2AAAD", bg: "#18181b" },
    MSFT: { name: "Microsoft", slug: "microsoft", theSvgSlug: "microsoft", variant: "color", color: "#00A4EF", bg: "#001e36" },
    NVDA: { name: "NVIDIA", slug: "nvidia", theSvgSlug: "nvidia", variant: "default", color: "#76B900", bg: "#0d2600" },
    AMZN: { name: "Amazon", slug: "amazon", theSvgSlug: "amazon", variant: "default", color: "#FF9900", bg: "#2e1a00" },
    GOOGL: { name: "Google", slug: "google", theSvgSlug: "google", variant: "color", color: "#4285F4", bg: "#0a1936" },
    META: { name: "Meta", slug: "meta", theSvgSlug: "meta", variant: "color", color: "#0468FF", bg: "#03173b" },
    TSLA: { name: "Tesla", slug: "tesla", theSvgSlug: "tesla", variant: "default", color: "#E82127", bg: "#360507" },
    JPM: { name: "JPMorgan Chase", slug: "chase", theSvgSlug: "chase", variant: "default", color: "#117ACA", bg: "#041b2e" },
    GS: { name: "Goldman Sachs", slug: "goldmansachs", theSvgSlug: "goldman-sachs", variant: "default", color: "#7399C6", bg: "#0f1c29" },
    XOM: { name: "ExxonMobil", slug: "exxonmobil", color: "#EE1C25", bg: "#330608" },
    CVX: { name: "Chevron", slug: "chevron", color: "#005480", bg: "#001926" },
    CAT: { name: "Caterpillar", slug: "caterpillar", theSvgSlug: "caterpillar", variant: "default", color: "#FFCD00", bg: "#332900" },
    BA: { name: "Boeing", slug: "boeing", theSvgSlug: "boeing", variant: "default", color: "#0033A0", bg: "#001033" },
    WMT: { name: "Walmart", slug: "walmart", theSvgSlug: "walmart", variant: "default", color: "#FFC220", bg: "#332600" },
    KO: { name: "Coca-Cola", slug: "cocacola", theSvgSlug: "coca-cola", variant: "default", color: "#F40009", bg: "#330002" },
    NKE: { name: "Nike", slug: "nike", theSvgSlug: "nike", variant: "default", color: "#FAFAFA", bg: "#18181b" },
    UNH: { name: "UnitedHealth", slug: "unitedhealthgroup", color: "#002677", bg: "#000d2b" },
    PFE: { name: "Pfizer", slug: "pfizer", theSvgSlug: "pfizer", variant: "default", color: "#0093D0", bg: "#00202e" },
    V: { name: "Visa", slug: "visa", theSvgSlug: "visa", variant: "default", color: "#1A1F71", bg: "#07081f" },
    AMD: { name: "AMD", slug: "amd", theSvgSlug: "amd", variant: "default", color: "#ED1C24", bg: "#330608" },
    TSM: { name: "TSMC", slug: "tsmc", color: "#D52B1E", bg: "#2e0906" },
    AVGO: { name: "Broadcom", slug: "broadcom", theSvgSlug: "broadcom", variant: "default", color: "#CC092F", bg: "#2e020a" },
    ORCL: { name: "Oracle", slug: "oracle", theSvgSlug: "oracle", variant: "default", color: "#F80000", bg: "#330000" },
    NFLX: { name: "Netflix", slug: "netflix", theSvgSlug: "netflix", variant: "default", color: "#E50914", bg: "#330205" },
    LMT: { name: "Lockheed Martin", slug: "lockheedmartin", theSvgSlug: "lockheed-martin", variant: "default", color: "#002F6C", bg: "#001026" },
    GE: { name: "GE Aerospace", slug: "generalelectric", theSvgSlug: "general-electric", variant: "default", color: "#005EB8", bg: "#00172e" },
    COP: { name: "ConocoPhillips", slug: "conocophillips", color: "#D52B1E", bg: "#2e0906" },
    MCD: { name: "McDonald's", slug: "mcdonalds", theSvgSlug: "mcdonalds", variant: "default", color: "#FFBC0D", bg: "#332600" },
    DIS: { name: "Disney", slug: "disney", theSvgSlug: "disney", variant: "default", color: "#113CCF", bg: "#04113b" },
    LIN: { name: "Linde", slug: "linde", color: "#005A9C", bg: "#00192b" },
};
function CompanyLogo({ ticker, size = "md", className, showBackground = true, }) {
    const [sourceIndex, setSourceIndex] = (0, react_1.useState)(0);
    const brand = exports.BRAND_CONFIG[ticker.toUpperCase()] || {
        name: ticker,
        slug: ticker.toLowerCase(),
        color: "#FF5F1F",
        bg: "#18181b",
    };
    const sizeClasses = {
        sm: "w-6 h-6 text-[10px] p-0.5",
        md: "w-8 h-8 text-xs p-1",
        lg: "w-10 h-10 text-sm p-1.5",
        xl: "w-14 h-14 text-base font-bold p-2",
    };
    // Robust Multi-Layer Fallback Chain:
    // 1. High-res local bundled colored SVG from /logos/
    // 2. thesvg.org CDN direct
    // 3. GitHub raw jsdelivr for thesvg
    // 4. SimpleIcons
    const theSvgUrl = brand.theSvgSlug
        ? `https://thesvg.org/icons/${brand.theSvgSlug}/${brand.variant || "default"}.svg`
        : null;
    const theSvgJsdelivr = brand.theSvgSlug
        ? `https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/${brand.theSvgSlug}/${brand.variant || "default"}.svg`
        : null;
    const sources = [
        `/logos/${ticker.toLowerCase()}.svg`,
        theSvgUrl,
        theSvgJsdelivr,
        `https://cdn.simpleicons.org/${brand.slug}`,
    ].filter(Boolean);
    const currentUrl = sources[sourceIndex];
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("rounded-md flex items-center justify-center overflow-hidden border flex-shrink-0 relative select-none transition-all shadow-sm", showBackground ? "bg-white border-zinc-200" : "bg-transparent border-transparent", sizeClasses[size], className), style: {
            boxShadow: showBackground ? `0 2px 8px -2px ${brand.color}40` : "none",
        }, children: currentUrl ? ((0, jsx_runtime_1.jsx)("img", { src: currentUrl, alt: `${brand.name} logo`, className: "w-full h-full object-contain filter drop-shadow-sm transition-transform group-hover:scale-105", onError: () => {
                if (sourceIndex < sources.length - 1) {
                    setSourceIndex((prev) => prev + 1);
                }
                else {
                    setSourceIndex(-1); // Switch to fallback colored badge
                }
            }, loading: "lazy" })) : ((0, jsx_runtime_1.jsx)("span", { className: "font-mono font-black tracking-tighter", style: { color: brand.color }, children: ticker.slice(0, 2) })) }));
}
