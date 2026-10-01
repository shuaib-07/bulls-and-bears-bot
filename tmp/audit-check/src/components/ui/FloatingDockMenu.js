"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloatingDockMenu = FloatingDockMenu;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("motion/react");
const utils_1 = require("@/src/lib/utils");
const lucide_react_1 = require("lucide-react");
const solidIcons = {
    arrowRight: ((0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M5 12h14M12 5l7 7-7 7" }) })),
};
const DEFAULT_TABS = [
    {
        id: "trade",
        label: "Trade",
        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-4 h-4 text-emerald-400" }),
        menuItems: [],
    },
];
function FloatingDockMenu({ tabs = DEFAULT_TABS, defaultActiveIndex = null, menuWidth = 360, showIcons = true, entryEase, entryDuration, exitEase, exitDuration, onTabChange, onItemToggle, className, isFixed = true, searchSuggestions = [
    "NVDA — NVIDIA Corp",
    "AAPL — Apple Inc",
    "TSLA — Tesla Inc",
    "MSFT — Microsoft Corp",
    "XOM — ExxonMobil",
    "LMT — Lockheed Martin",
    "Semiconductors",
    "Clean Energy",
], onSearch, }) {
    const [activeIndex, setActiveIndex] = (0, react_1.useState)(defaultActiveIndex);
    const layoutGroupId = (0, react_1.useId)();
    const [menuState, setMenuState] = (0, react_1.useState)(() => {
        const initial = {};
        tabs.forEach((tab) => {
            initial[tab.id] = {};
            tab.menuItems.forEach((item) => {
                initial[tab.id][item.id] = item.enabled ?? false;
            });
        });
        return initial;
    });
    // Integrated Search State
    const [searchOpen, setSearchOpen] = (0, react_1.useState)(false);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const inputRef = (0, react_1.useRef)(null);
    const containerRef = (0, react_1.useRef)(null);
    const defaultSpring = {
        type: "spring",
        stiffness: 450,
        damping: 32,
    };
    const activeTransition = entryEase
        ? {
            duration: entryDuration || 0.28,
            ease: entryEase,
        }
        : defaultSpring;
    const exitTransition = exitEase
        ? {
            duration: exitDuration || 0.2,
            ease: exitEase,
        }
        : defaultSpring;
    const handleTabClick = (index) => {
        if (searchOpen) {
            setSearchOpen(false);
            setSearchQuery("");
        }
        const nextIndex = activeIndex === index ? null : index;
        setActiveIndex(nextIndex);
        onTabChange?.(nextIndex);
    };
    const openSearch = () => {
        setActiveIndex(null);
        onTabChange?.(null);
        setSearchOpen(true);
        // Smooth focus after animation frame
        requestAnimationFrame(() => {
            setTimeout(() => inputRef.current?.focus(), 60);
        });
    };
    const closeSearch = () => {
        setSearchOpen(false);
        setSearchQuery("");
    };
    const handleSearchSubmit = (e) => {
        if (e)
            e.preventDefault();
        if (searchQuery.trim()) {
            onSearch?.(searchQuery.trim());
            closeSearch();
        }
    };
    const handlePickSuggestion = (value) => {
        setSearchQuery(value);
        onSearch?.(value);
        closeSearch();
    };
    (0, react_1.useEffect)(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setActiveIndex(null);
                onTabChange?.(null);
                if (searchOpen)
                    closeSearch();
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                if (searchOpen)
                    closeSearch();
                setActiveIndex(null);
                onTabChange?.(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [searchOpen, onTabChange]);
    const toggleSwitch = (tabId, itemId) => {
        const nextState = !menuState[tabId]?.[itemId];
        setMenuState((prev) => ({
            ...prev,
            [tabId]: {
                ...prev[tabId],
                [itemId]: nextState,
            },
        }));
        onItemToggle?.(tabId, itemId, nextState);
    };
    const currentTab = activeIndex !== null ? tabs[activeIndex] : null;
    const isAnyActive = activeIndex !== null || searchOpen;
    return ((0, jsx_runtime_1.jsx)("div", { ref: containerRef, className: (0, utils_1.cn)("z-50 flex flex-col items-center justify-end select-none font-mono", isFixed
            ? "fixed inset-x-0 bottom-4 sm:bottom-6 mx-auto w-fit max-w-[calc(100vw-24px)]"
            : "relative w-fit max-w-full", className), children: (0, jsx_runtime_1.jsx)(react_2.LayoutGroup, { id: `floating-dock-group-${layoutGroupId}`, children: (0, jsx_runtime_1.jsxs)(react_2.motion.div, { layout: true, transition: activeTransition, style: {
                    width: isAnyActive
                        ? Math.min(menuWidth, typeof window !== "undefined" ? window.innerWidth - 32 : menuWidth)
                        : "auto",
                    transformOrigin: "bottom center",
                }, className: (0, utils_1.cn)("relative overflow-hidden rounded-2xl", "bg-[#09090b]/95 text-white", "border border-[#27272a] shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(255,95,31,0.15)] backdrop-blur-xl", "flex flex-col justify-end p-1.5 transition-all duration-200"), children: [(0, jsx_runtime_1.jsx)(react_2.AnimatePresence, { initial: false, children: searchOpen && ((0, jsx_runtime_1.jsx)(react_2.motion.div, { initial: { opacity: 0, height: 0, marginBottom: 0 }, animate: {
                                opacity: 1,
                                height: "auto",
                                marginBottom: 6,
                                transition: { height: activeTransition, opacity: { duration: 0.18 } },
                            }, exit: {
                                opacity: 0,
                                height: 0,
                                marginBottom: 0,
                                transition: { height: exitTransition, opacity: { duration: 0.14 } },
                            }, className: "w-full overflow-hidden", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full rounded-xl bg-[#030303] border border-[#1e1e1e] p-2.5 space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between px-1 text-[10px] uppercase font-bold text-[#71717a] border-b border-[#18181b] pb-1.5", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1.5 text-amber-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "w-3.5 h-3.5" }), "Quick Search & Instant Filter"] }), (0, jsx_runtime_1.jsx)("span", { children: "Press Enter \u21B5" })] }), (0, jsx_runtime_1.jsx)("ul", { className: "flex flex-col gap-1 max-h-48 overflow-y-auto pr-1", children: searchSuggestions.map((item, idx) => ((0, jsx_runtime_1.jsx)(react_2.motion.li, { initial: { opacity: 0, y: 3 }, animate: { opacity: 1, y: 0 }, transition: { delay: idx * 0.02 }, children: (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => handlePickSuggestion(item), className: "w-full flex items-center justify-between p-2 rounded-lg text-left text-xs text-[#d4d4d8] hover:bg-[#18181b] hover:text-[#FF5F1F] border border-transparent hover:border-[#27272a] transition-all group", children: [(0, jsx_runtime_1.jsx)("span", { className: "truncate font-semibold", children: item }), (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUpRight, { className: "w-3.5 h-3.5 text-[#71717a] group-hover:text-[#FF5F1F] transition-colors shrink-0" })] }) }, item))) })] }) }, "search-suggestions-panel")) }), (0, jsx_runtime_1.jsx)(react_2.AnimatePresence, { initial: false, children: currentTab && !searchOpen && ((0, jsx_runtime_1.jsx)(react_2.motion.div, { initial: {
                                opacity: 0,
                                height: 0,
                                marginBottom: 0,
                            }, animate: {
                                opacity: 1,
                                height: "auto",
                                marginBottom: 6,
                                transition: {
                                    height: activeTransition,
                                    marginBottom: activeTransition,
                                    opacity: { duration: 0.16, ease: "easeOut" },
                                },
                            }, exit: {
                                opacity: 0,
                                height: 0,
                                marginBottom: 0,
                                transition: {
                                    height: exitTransition,
                                    marginBottom: exitTransition,
                                    opacity: { duration: 0.12, ease: "easeOut" },
                                },
                            }, className: "w-full overflow-hidden", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full rounded-xl bg-[#030303] border border-[#1e1e1e] p-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-1.5 flex items-center justify-between px-2.5 py-1 border-b border-[#18181b]", children: (0, jsx_runtime_1.jsxs)("span", { className: "font-mono text-[11px] font-extrabold tracking-wider text-[#FF5F1F] uppercase flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[#FF5F1F] animate-pulse" }), currentTab.label, " Controls"] }) }), (0, jsx_runtime_1.jsx)(react_2.AnimatePresence, { mode: "popLayout", initial: false, children: (0, jsx_runtime_1.jsx)(react_2.motion.div, { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 }, transition: { duration: 0.14 }, className: "flex flex-col gap-1", children: currentTab.menuItems.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "p-3 text-center text-xs text-[#71717a]", children: "No options available for this tab." })) : (currentTab.menuItems.map((item) => {
                                                const isToggle = item.type === "toggle";
                                                const isEnabled = menuState[currentTab.id]?.[item.id] ?? false;
                                                if (isToggle) {
                                                    return ((0, jsx_runtime_1.jsxs)("div", { onClick: () => toggleSwitch(currentTab.id, item.id), className: (0, utils_1.cn)("group flex items-center justify-between rounded-lg p-2 transition-all cursor-pointer", "hover:bg-[#18181b] border border-transparent hover:border-[#27272a]"), children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [item.icon && ((0, jsx_runtime_1.jsx)("div", { className: "flex size-7 items-center justify-center rounded-md bg-[#18181b] text-white border border-[#27272a]", children: item.icon })), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col text-left", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-semibold text-white group-hover:text-[#FF5F1F] transition-colors", children: item.label }), item.sublabel && ((0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a] font-normal", children: item.sublabel }))] })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", role: "switch", "aria-checked": isEnabled, className: (0, utils_1.cn)("relative h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 outline-none", isEnabled ? "bg-[#10B981]" : "bg-[#27272a]"), children: (0, jsx_runtime_1.jsx)(react_2.motion.span, { layout: true, transition: { type: "spring", stiffness: 500, damping: 30 }, className: (0, utils_1.cn)("block size-4 rounded-full bg-white shadow-sm", isEnabled ? "translate-x-4" : "translate-x-0") }) })] }, item.id));
                                                }
                                                return ((0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => {
                                                        item.onClick?.();
                                                        setActiveIndex(null);
                                                        onTabChange?.(null);
                                                    }, className: (0, utils_1.cn)("group flex w-full items-center justify-between rounded-lg p-2 transition-all text-left", "hover:bg-[#18181b] border border-transparent hover:border-[#27272a] active:scale-[0.99]"), children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [item.icon && ((0, jsx_runtime_1.jsx)("div", { className: "flex size-7 items-center justify-center rounded-md bg-[#18181b] text-white border border-[#27272a]", children: item.icon })), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-semibold text-white group-hover:text-[#FF5F1F] transition-colors", children: item.label }), item.sublabel && ((0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a] font-normal", children: item.sublabel }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5", children: [item.badge && ((0, jsx_runtime_1.jsx)("span", { className: "rounded bg-[#FF5F1F]/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#FF5F1F] border border-[#FF5F1F]/40", children: item.badge })), (0, jsx_runtime_1.jsx)("span", { className: "text-[#71717a] group-hover:text-white transition-colors", children: solidIcons.arrowRight })] })] }, item.id));
                                            })) }, currentTab.id) })] }) }, "menu-content-wrapper")) }), (0, jsx_runtime_1.jsx)("div", { className: "flex w-full items-center rounded-xl bg-[#030303] p-1 border border-[#1e1e1e] relative min-h-[42px] overflow-hidden", children: (0, jsx_runtime_1.jsx)(react_2.AnimatePresence, { mode: "wait", children: searchOpen ? ((0, jsx_runtime_1.jsxs)(react_2.motion.form, { onSubmit: handleSearchSubmit, initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 }, transition: { duration: 0.16 }, className: "flex items-center w-full px-2 gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "w-4 h-4 text-[#FF5F1F] shrink-0" }), (0, jsx_runtime_1.jsx)("input", { ref: inputRef, type: "search", value: searchQuery, onChange: (e) => {
                                            setSearchQuery(e.target.value);
                                            onSearch?.(e.target.value);
                                        }, placeholder: "Search stock ticker, sector, or name...", className: "flex-1 bg-transparent border-0 outline-none text-xs text-white placeholder:text-[#71717a]" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: closeSearch, className: "p-1 rounded-md text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-4 h-4" }) })] }, "dock-search-form")) : ((0, jsx_runtime_1.jsxs)(react_2.motion.div, { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 }, transition: { duration: 0.16 }, className: (0, utils_1.cn)("flex items-center gap-1 w-full", isAnyActive ? "justify-center" : "justify-start"), children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-1", children: tabs.map((tab, idx) => {
                                            const iconNode = tab.icon;
                                            const isActive = activeIndex === idx;
                                            const showLabel = true;
                                            return ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleTabClick(idx), className: (0, utils_1.cn)("relative flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-lg px-3 transition-all outline-none", isActive
                                                    ? "font-bold text-white bg-[#FF5F1F]/20 border border-[#FF5F1F]/50 shadow-[0_0_15px_rgba(255,95,31,0.25)]"
                                                    : "text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent"), children: (0, jsx_runtime_1.jsxs)("div", { className: "relative z-10 flex items-center justify-center gap-1.5", children: [iconNode && ((0, jsx_runtime_1.jsx)("div", { className: "flex size-4 shrink-0 items-center justify-center", children: iconNode })), showLabel && ((0, jsx_runtime_1.jsx)("span", { className: "text-xs font-bold tracking-tight whitespace-nowrap", children: tab.label }))] }) }, tab.id));
                                        }) }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-px bg-[#27272a] mx-0.5" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: openSearch, className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#a1a1aa] hover:text-[#FF5F1F] hover:bg-[#18181b] transition-all outline-none", title: "Search Markets", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "w-4 h-4" }) })] }, "dock-tabs-bar")) }) })] }) }) }));
}
exports.default = FloatingDockMenu;
