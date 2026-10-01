"use client";

import { useState } from "react";
import {
  Bell,
  ArrowLeftRight,
  TrendingUp,
  Newspaper,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface ActivityNotification {
  id: string;
  who: string;
  initials: string;
  what: string;
  context?: string;
  time: string;
  type: "SWAP" | "TRADE" | "NEWS" | "SYSTEM";
  unread?: boolean;
}

export function NotificationsTimeline({
  notifications = [],
}: {
  notifications?: ActivityNotification[];
}) {
  const [filter, setFilter] = useState<"ALL" | "SWAP" | "TRADE">("ALL");

  const filtered = notifications.filter((n) => {
    if (filter === "ALL") return true;
    return n.type === filter;
  });

  const getIcon = (type: ActivityNotification["type"]) => {
    switch (type) {
      case "SWAP":
        return <ArrowLeftRight className="w-3 h-3 text-[#FF5F1F]" />;
      case "TRADE":
        return <TrendingUp className="w-3 h-3 text-[#10B981]" />;
      case "NEWS":
        return <Newspaper className="w-3 h-3 text-[#3b82f6]" />;
      default:
        return <CheckCircle2 className="w-3 h-3 text-[#a855f7]" />;
    }
  };

  return (
    <div className="bg-[#09090b] border border-[#27272a] rounded-sm overflow-hidden font-mono text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#1e1e1e] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#FF5F1F]" />
          <span className="font-bold text-white text-xs uppercase">Terminal Feed</span>
          <span className="rounded-full bg-[#FF5F1F] px-1.5 py-0.2 font-mono text-[9px] text-black font-bold">
            {notifications.filter((n) => n.unread).length}
          </span>
        </div>
        <span className="text-[10px] text-[#71717a] uppercase">Realtime Synced</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[#18181b] px-3 py-2 bg-[#030303]">
        {(["ALL", "TRADE", "SWAP"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase transition-colors ${
              filter === tab
                ? "bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/40"
                : "text-[#71717a] hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <ul className="divide-y divide-[#18181b] max-h-80 overflow-y-auto">
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-xs text-[#71717a] text-center">No activity recorded yet.</li>
        )}
        {filtered.map((n) => (
          <li
            key={n.id}
            className={`relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#18181b] ${
              n.unread ? "bg-[#FF5F1F]/5" : ""
            }`}
          >
            {n.unread && (
              <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-[#FF5F1F] animate-pulse" />
            )}

            <div className="w-8 h-8 rounded-sm bg-[#18181b] border border-[#27272a] flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0">
              {n.initials}
            </div>

            <div className="min-w-0 flex-1 leading-snug">
              <div className="text-xs">
                <span className="font-bold text-white">{n.who}</span>{" "}
                <span className="text-[#a1a1aa]">{n.what}</span>{" "}
                {n.context && <strong className="text-[#d4d4d8]">{n.context}</strong>}
              </div>
              <div className="mt-1 text-[10px] text-[#71717a] flex items-center gap-2">
                <span>{n.time}</span>
                <span>•</span>
                <span className="flex items-center gap-1">{getIcon(n.type)} {n.type}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
