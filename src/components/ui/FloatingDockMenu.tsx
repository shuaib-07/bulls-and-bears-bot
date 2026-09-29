"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence, LayoutGroup, Transition } from "motion/react";
import { cn } from "@/src/lib/utils";
import { Search, X, Clock, ArrowUpRight, TrendingUp } from "lucide-react";

export interface MenuItemOption {
  id: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  enabled?: boolean;
  type?: "toggle" | "action";
  badge?: string;
  onClick?: () => void;
}

export interface NavTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  menuItems: MenuItemOption[];
}

export interface FloatingDockMenuProps {
  tabs?: NavTabItem[];
  defaultActiveIndex?: number | null;
  menuWidth?: number;
  showIcons?: boolean;
  entryEase?: [number, number, number, number] | string;
  entryDuration?: number;
  exitEase?: [number, number, number, number] | string;
  exitDuration?: number;
  onTabChange?: (index: number | null) => void;
  onItemToggle?: (tabId: string, itemId: string, enabled: boolean) => void;
  className?: string;
  isFixed?: boolean;
  searchSuggestions?: string[];
  onSearch?: (query: string) => void;
}

const solidIcons = {
  arrowRight: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
};

const DEFAULT_TABS: NavTabItem[] = [
  {
    id: "trade",
    label: "Trade",
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    menuItems: [],
  },
];

export function FloatingDockMenu({
  tabs = DEFAULT_TABS,
  defaultActiveIndex = null,
  menuWidth = 360,
  showIcons = true,
  entryEase,
  entryDuration,
  exitEase,
  exitDuration,
  onTabChange,
  onItemToggle,
  className,
  isFixed = true,
  searchSuggestions = [
    "NVDA — NVIDIA Corp",
    "AAPL — Apple Inc",
    "TSLA — Tesla Inc",
    "MSFT — Microsoft Corp",
    "XOM — ExxonMobil",
    "LMT — Lockheed Martin",
    "Semiconductors",
    "Clean Energy",
  ],
  onSearch,
}: FloatingDockMenuProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(defaultActiveIndex);
  const layoutGroupId = useId();
  const [menuState, setMenuState] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    tabs.forEach((tab) => {
      initial[tab.id] = {};
      tab.menuItems.forEach((item) => {
        initial[tab.id][item.id] = item.enabled ?? false;
      });
    });
    return initial;
  });

  // Integrated Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultSpring: Transition = {
    type: "spring",
    stiffness: 450,
    damping: 32,
  };

  const activeTransition: Transition = entryEase
    ? {
        duration: entryDuration || 0.28,
        ease: entryEase as [number, number, number, number],
      }
    : defaultSpring;

  const exitTransition: Transition = exitEase
    ? {
        duration: exitDuration || 0.2,
        ease: exitEase as [number, number, number, number],
      }
    : defaultSpring;

  const handleTabClick = (index: number) => {
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

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      closeSearch();
    }
  };

  const handlePickSuggestion = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
    closeSearch();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveIndex(null);
        onTabChange?.(null);
        if (searchOpen) closeSearch();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (searchOpen) closeSearch();
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

  const toggleSwitch = (tabId: string, itemId: string) => {
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

  return (
    <div
      ref={containerRef}
      className={cn(
        "z-50 flex flex-col items-center justify-end select-none font-mono",
        isFixed
          ? "fixed inset-x-0 bottom-4 sm:bottom-6 mx-auto w-fit max-w-[calc(100vw-24px)]"
          : "relative w-fit max-w-full",
        className
      )}
    >
      <LayoutGroup id={`floating-dock-group-${layoutGroupId}`}>
        <motion.div
          layout
          transition={activeTransition}
          style={{
            width: isAnyActive
              ? Math.min(menuWidth, typeof window !== "undefined" ? window.innerWidth - 32 : menuWidth)
              : "auto",
            transformOrigin: "bottom center",
          }}
          className={cn(
            "relative overflow-hidden rounded-2xl",
            "bg-[#09090b]/95 text-white",
            "border border-[#27272a] shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(255,95,31,0.15)] backdrop-blur-xl",
            "flex flex-col justify-end p-1.5 transition-all duration-200"
          )}
        >
          {/* ========================================================================= */}
          {/* SEARCH SUGGESTIONS PANEL (EXPANDS UPWARD WHEN SEARCH IS ACTIVE)           */}
          {/* ========================================================================= */}
          <AnimatePresence initial={false}>
            {searchOpen && (
              <motion.div
                key="search-suggestions-panel"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  marginBottom: 6,
                  transition: { height: activeTransition, opacity: { duration: 0.18 } },
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  marginBottom: 0,
                  transition: { height: exitTransition, opacity: { duration: 0.14 } },
                }}
                className="w-full overflow-hidden"
              >
                <div className="w-full rounded-xl bg-[#030303] border border-[#1e1e1e] p-2.5 space-y-2">
                  <div className="flex items-center justify-between px-1 text-[10px] uppercase font-bold text-[#71717a] border-b border-[#18181b] pb-1.5">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      Quick Search &amp; Instant Filter
                    </span>
                    <span>Press Enter ↵</span>
                  </div>

                  <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                    {searchSuggestions.map((item, idx) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <button
                          type="button"
                          onClick={() => handlePickSuggestion(item)}
                          className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs text-[#d4d4d8] hover:bg-[#18181b] hover:text-[#FF5F1F] border border-transparent hover:border-[#27272a] transition-all group"
                        >
                          <span className="truncate font-semibold">{item}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[#FF5F1F] transition-colors shrink-0" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================================= */}
          {/* TAB CONTROLS PANEL (TRADE, SWAP, INTEL, JOURNAL)                          */}
          {/* ========================================================================= */}
          <AnimatePresence initial={false}>
            {currentTab && !searchOpen && (
              <motion.div
                key="menu-content-wrapper"
                initial={{
                  opacity: 0,
                  height: 0,
                  marginBottom: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  marginBottom: 6,
                  transition: {
                    height: activeTransition,
                    marginBottom: activeTransition,
                    opacity: { duration: 0.16, ease: "easeOut" },
                  },
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  marginBottom: 0,
                  transition: {
                    height: exitTransition,
                    marginBottom: exitTransition,
                    opacity: { duration: 0.12, ease: "easeOut" },
                  },
                }}
                className="w-full overflow-hidden"
              >
                <div className="w-full rounded-xl bg-[#030303] border border-[#1e1e1e] p-2">
                  <div className="mb-1.5 flex items-center justify-between px-2.5 py-1 border-b border-[#18181b]">
                    <span className="font-mono text-[11px] font-extrabold tracking-wider text-[#FF5F1F] uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F1F] animate-pulse" />
                      {currentTab.label} Controls
                    </span>
                  </div>

                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={currentTab.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="flex flex-col gap-1"
                    >
                      {currentTab.menuItems.length === 0 ? (
                        <div className="p-3 text-center text-xs text-[#71717a]">
                          No options available for this tab.
                        </div>
                      ) : (
                        currentTab.menuItems.map((item) => {
                          const isToggle = item.type === "toggle";
                          const isEnabled = menuState[currentTab.id]?.[item.id] ?? false;

                          if (isToggle) {
                            return (
                              <div
                                key={item.id}
                                onClick={() => toggleSwitch(currentTab.id, item.id)}
                                className={cn(
                                  "group flex items-center justify-between rounded-lg p-2 transition-all cursor-pointer",
                                  "hover:bg-[#18181b] border border-transparent hover:border-[#27272a]"
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  {item.icon && (
                                    <div className="flex size-7 items-center justify-center rounded-md bg-[#18181b] text-white border border-[#27272a]">
                                      {item.icon}
                                    </div>
                                  )}
                                  <div className="flex flex-col text-left">
                                    <span className="text-xs font-semibold text-white group-hover:text-[#FF5F1F] transition-colors">
                                      {item.label}
                                    </span>
                                    {item.sublabel && (
                                      <span className="text-[10px] text-[#71717a] font-normal">
                                        {item.sublabel}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={isEnabled}
                                  className={cn(
                                    "relative h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 outline-none",
                                    isEnabled ? "bg-[#10B981]" : "bg-[#27272a]"
                                  )}
                                >
                                  <motion.span
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className={cn(
                                      "block size-4 rounded-full bg-white shadow-sm",
                                      isEnabled ? "translate-x-4" : "translate-x-0"
                                    )}
                                  />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                item.onClick?.();
                                setActiveIndex(null);
                                onTabChange?.(null);
                              }}
                              className={cn(
                                "group flex w-full items-center justify-between rounded-lg p-2 transition-all text-left",
                                "hover:bg-[#18181b] border border-transparent hover:border-[#27272a] active:scale-[0.99]"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                {item.icon && (
                                  <div className="flex size-7 items-center justify-center rounded-md bg-[#18181b] text-white border border-[#27272a]">
                                    {item.icon}
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-white group-hover:text-[#FF5F1F] transition-colors">
                                    {item.label}
                                  </span>
                                  {item.sublabel && (
                                    <span className="text-[10px] text-[#71717a] font-normal">
                                      {item.sublabel}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {item.badge && (
                                  <span className="rounded bg-[#FF5F1F]/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#FF5F1F] border border-[#FF5F1F]/40">
                                    {item.badge}
                                  </span>
                                )}
                                <span className="text-[#71717a] group-hover:text-white transition-colors">
                                  {solidIcons.arrowRight}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================================= */}
          {/* THE BOTTOM MAIN DOCK BAR: TABS + INTEGRATED SEARCH EXPANSION MORPH        */}
          {/* ========================================================================= */}
          <div className="flex w-full items-center rounded-xl bg-[#030303] p-1 border border-[#1e1e1e] relative min-h-[42px] overflow-hidden">
            <AnimatePresence mode="wait">
              {searchOpen ? (
                /* Search Form (fills bar cleanly when active) */
                <motion.form
                  key="dock-search-form"
                  onSubmit={handleSearchSubmit}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  className="flex items-center w-full px-2 gap-2"
                >
                  <Search className="w-4 h-4 text-[#FF5F1F] shrink-0" />
                  <input
                    ref={inputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      onSearch?.(e.target.value);
                    }}
                    placeholder="Search stock ticker, sector, or name..."
                    className="flex-1 bg-transparent border-0 outline-none text-xs text-white placeholder:text-[#71717a]"
                  />
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="p-1 rounded-md text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                /* Resting / Tab-Selection Navigation Bar */
                <motion.div
                  key="dock-tabs-bar"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  className={cn(
                    "flex items-center gap-1 w-full",
                    isAnyActive ? "justify-center" : "justify-start"
                  )}
                >
                  <div className="flex items-center gap-1">
                    {tabs.map((tab, idx) => {
                      const iconNode = tab.icon;
                      const isActive = activeIndex === idx;
                      const showLabel = true;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleTabClick(idx)}
                          className={cn(
                            "relative flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-lg px-3 transition-all outline-none",
                            isActive
                              ? "font-bold text-white bg-[#FF5F1F]/20 border border-[#FF5F1F]/50 shadow-[0_0_15px_rgba(255,95,31,0.25)]"
                              : "text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent"
                          )}
                        >
                          <div className="relative z-10 flex items-center justify-center gap-1.5">
                            {iconNode && (
                              <div className="flex size-4 shrink-0 items-center justify-center">{iconNode}</div>
                            )}
                            {showLabel && (
                              <span className="text-xs font-bold tracking-tight whitespace-nowrap">
                                {tab.label}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Icon Trigger Button */}
                  <div className="h-4 w-px bg-[#27272a] mx-0.5" />
                  <button
                    type="button"
                    onClick={openSearch}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#a1a1aa] hover:text-[#FF5F1F] hover:bg-[#18181b] transition-all outline-none"
                    title="Search Markets"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </LayoutGroup>
    </div>
  );
}

export default FloatingDockMenu;
