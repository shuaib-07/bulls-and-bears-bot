"use client";

import { useState, useEffect, useCallback, useId } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Edit3,
  Check,
  Copy,
  Printer,
  FileSpreadsheet,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Sparkles,
  Phone,
  GraduationCap,
  DollarSign,
  Plus,
  X,
  Dices,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { CompanyLogo } from "@/src/components/ui/CompanyLogo";
import { sounds } from "@/src/lib/sounds";
import { formatCurrency, formatNumber } from "@/src/lib/utils";



interface MemberFormState {
  id: string;
  name: string;
  rollNo: string;
  phone: string;
  role: string;
}

export default function AdminTeamsManagementPage() {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "FROZEN">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Team Create / Edit Modal State
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formTeamName, setFormTeamName] = useState("");
  const [formPasscode, setFormPasscode] = useState("");
  const [formTableNumber, setFormTableNumber] = useState("");
  const [formCashBalance, setFormCashBalance] = useState("100000");
  const [formMembers, setFormMembers] = useState<MemberFormState[]>([
    { id: "1", name: "", rollNo: "", phone: "", role: "Leader" },
  ]);

  // Bulk Import Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");

  // Printable Placards Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Cash Adjustment Modal State
  const [adjustModalTeam, setAdjustModalTeam] = useState<any | null>(null);
  const [customCashDelta, setCustomCashDelta] = useState<string>("5000");

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { headers: { "x-admin-pin": pin } });
      if (!res.ok) return;
      const data = await res.json();
      setGameState(data.gameState);
      setTeams(data.leaderboard || []);
    } catch (e) {
      console.error(e);
    }
  }, [pin]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [fetchState]);

  const handleAdminAction = async (action: string, payload: any = {}) => {
    setIsProcessing(true);
    setActionStatus(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, action, payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionStatus(`❌ Error: ${data.error}`);
        sounds.playTradeError();
        setIsProcessing(false);
        return;
      }

      setActionStatus(`✅ ${data.message}`);
      sounds.playTradeSuccess();
      fetchState();
      return data;
    } catch (e) {
      setActionStatus("❌ Network error executing admin command.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPin = (teamId: string, teamPin: string) => {
    navigator.clipboard.writeText(teamPin);
    setCopiedPinId(teamId);
    sounds.playTick();
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const togglePinReveal = (teamId: string) => {
    setRevealedPins((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
    sounds.playTick();
  };

  const openCreateModal = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const nextTableNum = `Table ${teams.length + 1}`;
    setEditingTeam(null);
    setFormTeamName("");
    setFormPasscode(randomPin);
    setFormTableNumber(nextTableNum);
    setFormCashBalance("100000");
    setFormMembers([
      { id: "1", name: "", rollNo: "", phone: "", role: "Leader" },
      { id: "2", name: "", rollNo: "", phone: "", role: "Trader" },
    ]);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (team: any) => {
    setEditingTeam(team);
    setFormTeamName(team.teamName);
    setFormPasscode(team.passcode || "1234");
    setFormTableNumber(team.tableNumber || "Table 1");
    setFormCashBalance(String(team.cashBalance || 100000));
    setFormMembers(
      team.members && team.members.length > 0
        ? team.members.map((m: any, idx: number) => ({
            id: m.id || String(idx + 1),
            name: m.name || "",
            rollNo: m.rollNo || "",
            phone: m.phone || "",
            role: m.role || "Member",
          }))
        : [{ id: "1", name: "", rollNo: "", phone: "", role: "Leader" }]
    );
    setIsCreateModalOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeamName.trim()) {
      alert("Please provide a valid team name.");
      return;
    }

    const filteredMembers = formMembers
      .filter((m) => m.name.trim().length > 0)
      .map((m) => ({
        id: m.id || `m-${Date.now()}-${Math.random()}`,
        name: m.name.trim(),
        rollNo: m.rollNo.trim(),
        phone: m.phone.trim(),
        role: m.role,
      }));

    if (editingTeam) {
      // Update
      await handleAdminAction("UPDATE_TEAM", {
        teamId: editingTeam.id,
        teamName: formTeamName.trim(),
        passcode: formPasscode.trim(),
        tableNumber: formTableNumber.trim(),
        cashBalance: Number(formCashBalance) || 100000,
        members: filteredMembers,
      });
    } else {
      // Create
      await handleAdminAction("CREATE_TEAM", {
        teamName: formTeamName.trim(),
        passcode: formPasscode.trim(),
        tableNumber: formTableNumber.trim(),
        initialCash: Number(formCashBalance) || 100000,
        members: filteredMembers,
      });
    }

    setIsCreateModalOpen(false);
  };

  const handleBulkImport = async () => {
    if (!bulkCsvText.trim()) return;

    // Parse CSV rows: TeamName, Table, Passcode, Cash, Member1 Name, Member1 Roll, Member1 Phone...
    const lines = bulkCsvText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsedTeams: any[] = [];

    for (const line of lines) {
      // Ignore header comment
      if (line.toLowerCase().startsWith("team name") || line.startsWith("#")) continue;

      const cols = line.split(",").map((c) => c.trim());
      if (cols.length === 0 || !cols[0]) continue;

      const teamName = cols[0];
      const tableNumber = cols[1] || `Table ${parsedTeams.length + teams.length + 1}`;
      const passcode = cols[2] && cols[2].length >= 3 ? cols[2] : Math.floor(1000 + Math.random() * 9000).toString();
      const cashBalance = Number(cols[3]) || 100000;

      // Extract optional members from additional columns
      const members: any[] = [];
      let mIdx = 4;
      while (mIdx < cols.length) {
        const mName = cols[mIdx];
        const mRoll = cols[mIdx + 1] || "";
        const mPhone = cols[mIdx + 2] || "";
        if (mName && mName.length > 0) {
          members.push({
            id: `m-bulk-${Date.now()}-${mIdx}`,
            name: mName,
            rollNo: mRoll,
            phone: mPhone,
            role: members.length === 0 ? "Leader" : "Trader",
          });
        }
        mIdx += 3;
      }

      parsedTeams.push({
        teamName,
        tableNumber,
        passcode,
        cashBalance,
        members,
      });
    }

    if (parsedTeams.length === 0) {
      alert("No valid team records found in pasted CSV format.");
      return;
    }

    await handleAdminAction("BULK_IMPORT_TEAMS", { teams: parsedTeams });
    setIsBulkModalOpen(false);
    setBulkCsvText("");
  };

  if (!isAuthenticated) {
    return (
      <div className="responsive-page min-h-screen bg-[#030303] flex items-center justify-center p-4 font-mono cyber-grid">
        <div className="w-full max-w-sm bg-[#09090b] border border-[#27272a] p-6 rounded-xl shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5 text-[#FF5F1F]">
            <div className="w-8 h-8 rounded-lg bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" />
            </div>
            <span className="font-display font-black text-white text-base tracking-wider">TEAM ROSTER SECURITY</span>
          </div>

          <p className="text-xs text-[#a1a1aa] leading-relaxed">
            Enter host PIN to access participant rosters, credential generator, and student details.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, action: "AUTHENTICATE" }) });
              if (response.ok) {
                setIsAuthenticated(true);
                sounds.playTradeSuccess();
              } else {
                alert("Incorrect host PIN.");
              }
            }}
            className="space-y-4 pt-1"
          >
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#71717a] mb-1.5">Host PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Host PIN"
                className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2.5 text-white outline-none text-xs tracking-widest font-bold"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#FF5F1F] text-black font-bold uppercase rounded-lg hover:bg-white transition-all text-xs shadow-[0_0_15px_rgba(255,95,31,0.3)]"
            >
              Unlock Team Center
            </button>
          </form>

          <div className="pt-2 text-center border-t border-[#18181b]">
            <Link href="/admin" className="text-[11px] text-[#71717a] hover:text-[#FF5F1F] transition-colors">
              ← Return to Master Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Teams List
  const filteredTeams = teams.filter((t) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && !t.isFrozen) ||
      (statusFilter === "FROZEN" && t.isFrozen);

    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const matchesTeamName = t.teamName.toLowerCase().includes(q);
    const matchesTable = (t.tableNumber || "").toLowerCase().includes(q);
    const matchesPasscode = (t.passcode || "").includes(q);
    const matchesMembers = (t.members || []).some(
      (m: any) =>
        m.name.toLowerCase().includes(q) ||
        (m.rollNo || "").toLowerCase().includes(q) ||
        (m.phone || "").includes(q)
    );

    return matchesTeamName || matchesTable || matchesPasscode || matchesMembers;
  });

  const totalMembersCount = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
  const totalCashUnderManagement = teams.reduce((acc, t) => acc + (t.totalPortfolioValue || t.cashBalance || 0), 0);

  return (
    <div className="responsive-page min-h-screen bg-[#030303] text-[#fafafa] font-mono select-none pb-24 cyber-grid">
      {/* 1. TOP CONTROL BAR */}
      <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-[1750px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Return to Master Admin"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF5F1F]" />
              <span className="hidden sm:inline">Admin Dashboard</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-display font-extrabold text-white flex items-center gap-2">
                  TEAM &amp; ROSTER MANAGEMENT
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/40">
                    SLH 15
                  </span>
                </h1>
                <div className="text-[10px] text-[#71717a]">
                  Ramaiah University • Event Participant Directory &amp; Credential Generator
                </div>
              </div>
            </div>
          </div>

          {/* Quick HUD Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/stage"
              target="_blank"
              className="px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#d4d4d8] hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              <span>Projector (/stage)</span>
            </Link>

            <button
              onClick={() => {
                fetchState();
                sounds.playTick();
              }}
              className="p-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#d4d4d8] hover:text-white rounded-lg transition-colors"
              title="Refresh Roster State"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionStatus && (
        <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3 bg-[#09090b] border border-[#27272a] text-xs rounded-xl flex items-center justify-between shadow-lg">
            <span className="font-semibold">{actionStatus}</span>
            <button onClick={() => setActionStatus(null)} className="text-[#71717a] hover:text-white text-xs px-2 py-1 rounded bg-[#18181b]">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN BODY */}
      <main className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 bg-[#09090b] border border-[#1e1e1e] rounded-xl space-y-1 shadow-md">
            <div className="flex items-center justify-between text-[#71717a] text-[10px] font-bold uppercase tracking-wider">
              <span>Total Teams</span>
              <Users className="w-4 h-4 text-[#FF5F1F]" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              {teams.length}
            </div>
            <div className="text-[10px] text-[#10B981] font-semibold">
              {teams.filter((t) => !t.isFrozen).length} Active • {teams.filter((t) => t.isFrozen).length} Frozen
            </div>
          </div>

          <div className="p-4 bg-[#09090b] border border-[#1e1e1e] rounded-xl space-y-1 shadow-md">
            <div className="flex items-center justify-between text-[#71717a] text-[10px] font-bold uppercase tracking-wider">
              <span>Student Members</span>
              <GraduationCap className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              {totalMembersCount}
            </div>
            <div className="text-[10px] text-[#71717a]">
              Across all competition tables
            </div>
          </div>

          <div className="p-4 bg-[#09090b] border border-[#1e1e1e] rounded-xl space-y-1 shadow-md">
            <div className="flex items-center justify-between text-[#71717a] text-[10px] font-bold uppercase tracking-wider">
              <span>Avg Team Size</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              {teams.length > 0 ? (totalMembersCount / teams.length).toFixed(1) : "0"}
            </div>
            <div className="text-[10px] text-[#71717a]">Members per station</div>
          </div>

          <div className="p-4 bg-[#09090b] border border-[#1e1e1e] rounded-xl space-y-1 shadow-md">
            <div className="flex items-center justify-between text-[#71717a] text-[10px] font-bold uppercase tracking-wider">
              <span>Total Assets in Play</span>
              <DollarSign className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="text-sm min-[400px]:text-base sm:text-2xl break-words font-display font-extrabold text-[#10B981]">
              {formatCurrency(totalCashUnderManagement)}
            </div>
            <div className="text-[10px] text-[#71717a]">Cash &amp; stock portfolios</div>
          </div>
        </div>

        {/* 3. CONTROLS BAR & TOOLBAR */}
        <div className="p-4 bg-[#09090b] border border-[#27272a] rounded-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xl">
          {/* Left: Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team name, student name, roll no, phone..."
                className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg pl-9 pr-3.5 py-2 text-white placeholder-[#71717a] text-xs outline-none font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-[#030303] border border-[#27272a] p-1 rounded-lg">
              {(["ALL", "ACTIVE", "FROZEN"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    statusFilter === st
                      ? "bg-[#FF5F1F] text-black"
                      : "text-[#71717a] hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-[#030303] border border-[#27272a] p-1 rounded-lg">
              <button
                onClick={() => setViewMode("GRID")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                  viewMode === "GRID" ? "bg-[#27272a] text-white" : "text-[#71717a] hover:text-white"
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                  viewMode === "TABLE" ? "bg-[#27272a] text-white" : "text-[#71717a] hover:text-white"
                }`}
              >
                Roster Table
              </button>
            </div>
          </div>

          {/* Right: Master Event Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#FF5F1F] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              title="Print table credential cards for event desks"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF5F1F]" />
              <span>Print Table Placards</span>
            </button>

            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-amber-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              title="Bulk import teams from Excel/CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk CSV Import</span>
            </button>

            <button
              onClick={() => {
                if (confirm("Regenerate random 4-digit PINs for ALL registered teams? (Existing PINs will be updated immediately)")) {
                  handleAdminAction("REGENERATE_ALL_PINS");
                }
              }}
              className="px-3 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-sky-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              title="Re-generate PINs for all teams"
            >
              <Dices className="w-3.5 h-3.5 text-sky-400" />
              <span>Regen All PINs</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#FF5F1F] text-black font-extrabold uppercase rounded-lg hover:bg-white transition-all text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,95,31,0.35)]"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register Team</span>
            </button>
          </div>
        </div>

        {/* 4. TEAMS LIST: CARD GRID VIEW */}
        {viewMode === "GRID" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTeams.map((team) => {
              const isRevealed = Boolean(revealedPins[team.id]);
              const isCopied = copiedPinId === team.id;
              const membersCount = team.members?.length || 0;

              return (
                <div
                  key={team.id}
                  className={`p-5 bg-[#09090b] border rounded-xl flex flex-col justify-between space-y-4 shadow-xl transition-all relative overflow-hidden ${
                    team.isFrozen
                      ? "border-rose-900/40 bg-rose-950/10"
                      : "border-[#1e1e1e] hover:border-[#3f3f46]"
                  }`}
                >
                  {/* Card Header: Table # + Status + Team Name */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/40 uppercase tracking-wider">
                        {team.tableNumber || "Table —"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAdminAction("FREEZE_TEAM", { teamId: team.id, isFrozen: !team.isFrozen })}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                            team.isFrozen
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                              : "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40"
                          }`}
                        >
                          {team.isFrozen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          <span>{team.isFrozen ? "FROZEN" : "ACTIVE"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">
                          {team.teamName}
                        </h3>
                        <div className="text-[10px] text-[#71717a] mt-0.5">
                          ID: <code className="text-[#a1a1aa]">{team.id}</code>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold text-[#10B981]">
                          {formatCurrency(team.totalPortfolioValue || team.cashBalance)}
                        </div>
                        <div className="text-[10px] text-[#71717a]">
                          Cash: {formatCurrency(team.cashBalance)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passcode & Credential HUD */}
                  <div className="p-3 bg-[#030303] border border-[#1e1e1e] rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-[9px] text-[#71717a] font-bold uppercase tracking-wider">
                          Login Passcode PIN
                        </div>
                        <div className="font-mono font-extrabold text-sm tracking-widest text-white">
                          {isRevealed ? team.passcode : "••••"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePinReveal(team.id)}
                        className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white rounded transition-colors"
                        title={isRevealed ? "Hide PIN" : "Reveal PIN"}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleCopyPin(team.id, team.passcode)}
                        className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white rounded transition-colors flex items-center gap-1 text-[10px] font-bold"
                        title="Copy PIN"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleAdminAction("REGENERATE_PIN", { teamId: team.id })}
                        className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-amber-400 rounded transition-colors"
                        title="Generate Fresh PIN"
                      >
                        <Dices className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Student Members Roster Preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#71717a]">
                      <span>Roster ({membersCount} Members)</span>
                      <span>Role &amp; Details</span>
                    </div>

                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {membersCount === 0 ? (
                        <div className="p-2 bg-[#030303] border border-[#18181b] rounded text-[11px] text-[#52525b] text-center">
                          No student members assigned yet.
                        </div>
                      ) : (
                        team.members.map((member: any, mIdx: number) => (
                          <div
                            key={member.id || mIdx}
                            className="p-2 bg-[#030303] border border-[#18181b] rounded flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F1F]" />
                              <div>
                                <div className="font-bold text-white text-[11px] leading-tight">
                                  {member.name}
                                </div>
                                <div className="text-[10px] text-[#71717a] flex items-center gap-1.5">
                                  {member.rollNo && <span>{member.rollNo}</span>}
                                  {member.phone && <span>• {member.phone}</span>}
                                </div>
                              </div>
                            </div>

                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#18181b] text-[#a1a1aa] border border-[#27272a] uppercase">
                              {member.role || "Member"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Portfolio Holdings Summary */}
                  <div className="pt-2 border-t border-[#18181b] flex items-center justify-between text-[10px] text-[#71717a]">
                    <span>
                      Holdings: {Object.keys(team.portfolio || {}).length} Equities (
                      {(Object.values(team.portfolio || {}) as number[]).reduce((a: number, b: number) => a + Number(b || 0), 0)} sh)
                    </span>
                    <span className={team.pnl >= 0 ? "text-[#10B981] font-bold" : "text-[#F43F5E] font-bold"}>
                      PnL: {team.pnl >= 0 ? `+${team.pnlPercent?.toFixed(1)}%` : `${team.pnlPercent?.toFixed(1)}%`}
                    </span>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => openEditModal(team)}
                      className="py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#FF5F1F]" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        setAdjustModalTeam(team);
                        setCustomCashDelta("5000");
                      }}
                      className="py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cash</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Permanently delete team "${team.teamName}" and all associated data?`)) {
                          handleAdminAction("DELETE_TEAM", { teamId: team.id });
                        }
                      }}
                      className="py-1.5 bg-[#18181b] hover:bg-rose-950/40 border border-[#27272a] hover:border-rose-500/50 text-rose-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 5. TEAMS LIST: COMPACT ROSTER TABLE VIEW */
          <div className="bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#030303] text-[#71717a] uppercase font-bold text-[10px] border-b border-[#27272a]">
                  <tr>
                    <th className="p-3.5">Table</th>
                    <th className="p-3.5">Team Name</th>
                    <th className="p-3.5">Login PIN</th>
                    <th className="p-3.5">Student Members &amp; Contacts</th>
                    <th className="p-3.5">Cash Balance</th>
                    <th className="p-3.5">Net Worth</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18181b]">
                  {filteredTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-[#121215] transition-colors">
                      <td className="p-3.5 font-bold text-[#FF5F1F]">
                        {team.tableNumber || "—"}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{team.teamName}</div>
                        <div className="text-[10px] text-[#71717a]">ID: {team.id}</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold tracking-widest text-amber-300">
                        <div className="flex items-center gap-1.5">
                          <span>{team.passcode}</span>
                          <button
                            onClick={() => handleCopyPin(team.id, team.passcode)}
                            className="text-[#71717a] hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          {(team.members || []).map((m: any, idx: number) => (
                            <div key={idx} className="text-[11px] text-[#d4d4d8] flex items-center gap-1.5">
                              <span className="font-semibold text-white">{m.name}</span>
                              {m.rollNo && <span className="text-[#71717a]">({m.rollNo})</span>}
                              {m.phone && <span className="text-[#10B981]">📱 {m.phone}</span>}
                            </div>
                          ))}
                          {(!team.members || team.members.length === 0) && (
                            <span className="text-[#52525b] italic">No members listed</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-white font-medium">
                        {formatCurrency(team.cashBalance)}
                      </td>
                      <td className="p-3.5 font-bold text-[#10B981]">
                        {formatCurrency(team.totalPortfolioValue || team.cashBalance)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            team.isFrozen
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                          }`}
                        >
                          {team.isFrozen ? "FROZEN" : "ACTIVE"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(team)}
                            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-white rounded"
                            title="Edit Team"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#FF5F1F]" />
                          </button>
                          <button
                            onClick={() => handleAdminAction("REGENERATE_PIN", { teamId: team.id })}
                            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-amber-400 rounded"
                            title="Regenerate PIN"
                          >
                            <Dices className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete team "${team.teamName}"?`)) {
                                handleAdminAction("DELETE_TEAM", { teamId: team.id });
                              }
                            }}
                            className="p-1.5 bg-[#18181b] hover:bg-rose-950/40 text-rose-400 rounded"
                            title="Delete Team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 5. MODALS                                                                 */}
      {/* ========================================================================= */}

      {/* CREATE / EDIT TEAM MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="modal-panel w-full max-w-2xl bg-[#09090b] border border-[#27272a] p-6 rounded-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F]">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingTeam ? `Edit Team: ${editingTeam.teamName}` : "Register New Competition Team"}
                    </h3>
                    <div className="text-[10px] text-[#71717a]">
                      Configure station table, login passcode, and student team members.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-[#71717a] hover:text-white text-xs px-2.5 py-1 rounded bg-[#18181b]"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveTeam} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Team Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#71717a] uppercase mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTeamName}
                      onChange={(e) => setFormTeamName(e.target.value)}
                      placeholder="e.g. Apex Capital, Quantum Quants"
                      className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white text-xs font-semibold outline-none"
                    />
                  </div>

                  {/* Table Station # */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#71717a] uppercase mb-1">
                      Table / Station Number
                    </label>
                    <input
                      type="text"
                      value={formTableNumber}
                      onChange={(e) => setFormTableNumber(e.target.value)}
                      placeholder="e.g. Table 4, SLH 15 Desk 2"
                      className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white text-xs font-semibold outline-none"
                    />
                  </div>

                  {/* 4-Digit Passcode PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-[#71717a] uppercase">
                        Login Passcode PIN *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newPin = Math.floor(1000 + Math.random() * 9000).toString();
                          setFormPasscode(newPin);
                          sounds.playTick();
                        }}
                        className="text-[10px] font-bold text-amber-400 hover:text-white flex items-center gap-1"
                      >
                        <Dices className="w-3 h-3" />
                        <span>Random PIN</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formPasscode}
                      onChange={(e) => setFormPasscode(e.target.value)}
                      placeholder="4-digit PIN (e.g. 1234)"
                      className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white font-mono font-bold tracking-widest text-xs outline-none"
                    />
                  </div>

                  {/* Initial Starting Cash */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#71717a] uppercase mb-1">
                      Starting Cash Balance ($)
                    </label>
                    <input
                      type="number"
                      value={formCashBalance}
                      onChange={(e) => setFormCashBalance(e.target.value)}
                      placeholder="100000"
                      className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic Student Members Section */}
                <div className="pt-2 border-t border-[#1e1e1e] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#FF5F1F]" />
                        Student Team Members (Roster)
                      </span>
                      <p className="text-[10px] text-[#71717a]">
                        Add participant names, University Roll / USN numbers, and contact numbers.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormMembers((prev) => [
                          ...prev,
                          {
                            id: String(Date.now()),
                            name: "",
                            rollNo: "",
                            phone: "",
                            role: prev.length === 0 ? "Leader" : "Trader",
                          },
                        ]);
                      }}
                      className="px-2.5 py-1 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#FF5F1F] hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Member</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formMembers.map((member, idx) => (
                      <div
                        key={member.id || idx}
                        className="p-3 bg-[#030303] border border-[#1e1e1e] rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        {/* Member Name */}
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Student Full Name"
                            value={member.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormMembers((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, name: val } : m))
                              );
                            }}
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          />
                        </div>

                        {/* Roll No / USN */}
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Roll No / USN"
                            value={member.rollNo}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormMembers((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, rollNo: val } : m))
                              );
                            }}
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          />
                        </div>

                        {/* Phone Number */}
                        <div className="sm:col-span-3">
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={member.phone}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormMembers((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, phone: val } : m))
                              );
                            }}
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          />
                        </div>

                        {/* Role & Delete */}
                        <div className="sm:col-span-2 flex items-center gap-1.5">
                          <select
                            value={member.role}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormMembers((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, role: val } : m))
                              );
                            }}
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-1.5 py-1.5 text-[10px] text-[#d4d4d8] outline-none"
                          >
                            <option value="Leader">Leader</option>
                            <option value="Analyst">Analyst</option>
                            <option value="Trader">Trader</option>
                            <option value="Member">Member</option>
                          </select>

                          {formMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormMembers((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="p-1.5 text-[#71717a] hover:text-rose-400 transition-colors"
                              title="Remove Member"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1e1e1e]">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="py-2.5 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="py-2.5 bg-[#FF5F1F] text-black font-extrabold uppercase rounded-xl hover:bg-white transition-all text-xs shadow-[0_0_15px_rgba(255,95,31,0.3)]"
                  >
                    {editingTeam ? "Save Team Changes" : "Create & Register Team"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BULK CSV IMPORT MODAL */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="modal-panel w-full max-w-xl bg-[#09090b] border border-[#27272a] p-6 rounded-2xl shadow-2xl space-y-4 font-mono"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Bulk CSV Team Importer</h3>
                </div>
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="text-[#71717a] hover:text-white text-xs px-2.5 py-1 rounded bg-[#18181b]"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                Paste your CSV rows below. Each row can define: <br />
                <code className="text-[#FF5F1F] text-[11px]">
                  Team Name, Table, PIN, Cash, Member 1 Name, Member 1 Roll, Member 1 Phone...
                </code>
              </p>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-[#71717a]">
                  <span>Sample Data:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkCsvText(
                        `Alpha Capital, Table 1, 1234, 100000, Aarav Sharma, RUAS22DS01, 9876543210, Priya Patel, RUAS22DS02, 9876543211\nBeta Quant, Table 2, 5678, 100000, Vikram Reddy, RUAS22DS03, 9876543212, Sneha Rao, RUAS22DS04, 9876543213\nGamma Ventures, Table 3, 9012, 100000, Aditya Kumar, RUAS22DS05, 9876543214, Ananya Iyer, RUAS22DS06, 9876543215`
                      );
                    }}
                    className="text-amber-400 underline hover:text-white"
                  >
                    Insert Sample
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  placeholder="Paste CSV rows here..."
                  className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg p-3 text-xs text-white font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="py-2.5 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="py-2.5 bg-amber-500 text-black font-extrabold uppercase rounded-xl hover:bg-white transition-all text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  Import All Teams
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINTABLE TABLE PLACARDS MODAL / PRINT SHEET */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-panel w-full max-w-4xl bg-white text-black p-8 rounded-2xl shadow-2xl space-y-6 my-8 font-sans print:p-0 print:m-0 print:shadow-none print:w-full"
            >
              {/* Screen-Only Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 print:hidden font-mono">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-[#FF5F1F]" />
                    Printable Table Credentials &amp; Badges
                  </h3>
                  <p className="text-xs text-gray-500">
                    Print and cut these credential placards for event volunteers to place on competition desks at SLH 15.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-[#FF5F1F] text-black font-bold text-xs uppercase rounded-lg hover:bg-black hover:text-white transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Now</span>
                  </button>

                  <button
                    onClick={() => setIsPrintModalOpen(false)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Placards 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                {teams.map((team, idx) => (
                  <div
                    key={team.id}
                    className="border-2 border-black p-5 rounded-xl flex flex-col justify-between space-y-4 page-break-inside-avoid bg-white shadow-sm"
                  >
                    {/* Card Header */}
                    <div className="border-b-2 border-black pb-3 flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          Ramaiah University • Bulls &amp; Bears
                        </div>
                        <h4 className="text-2xl font-black text-black leading-tight mt-0.5">
                          {team.teamName}
                        </h4>
                      </div>

                      <div className="bg-black text-white px-3 py-1 rounded font-black text-sm uppercase tracking-wider">
                        {team.tableNumber || `Table ${idx + 1}`}
                      </div>
                    </div>

                    {/* Big Credentials Box */}
                    <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                          Station Login PIN
                        </div>
                        <div className="font-mono text-3xl font-black text-black tracking-widest">
                          {team.passcode}
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-bold text-gray-600">
                        <div>Starting Cash:</div>
                        <div className="text-base font-black text-green-700">
                          {formatCurrency(team.cashBalance || 100000)}
                        </div>
                      </div>
                    </div>

                    {/* Student Members List */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Registered Team Members:
                      </div>
                      <div className="space-y-1 text-xs">
                        {(team.members || []).length === 0 ? (
                          <div className="text-gray-400 italic text-[11px]">No names listed</div>
                        ) : (
                          team.members.map((m: any, mIdx: number) => (
                            <div key={mIdx} className="flex items-center justify-between border-b border-gray-100 pb-1">
                              <span className="font-bold text-black">{m.name}</span>
                              <span className="text-gray-600 font-mono text-[11px]">{m.rollNo || m.role}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Footer instructions */}
                    <div className="text-[9px] text-gray-500 text-center border-t border-gray-200 pt-2 uppercase tracking-wider">
                      Log in at: <strong className="text-black">/trade</strong> • Oct 1st Event • SLH 15
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CASH BALANCE ADJUST MODAL */}
      {adjustModalTeam && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="modal-panel w-full max-w-sm bg-[#09090b] border border-[#27272a] p-5 rounded-xl shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e1e1e]">
              <div>
                <span className="text-xs text-[#FF5F1F] font-bold uppercase">Adjust Cash Balance</span>
                <h4 className="text-sm font-bold text-white">{adjustModalTeam.teamName}</h4>
              </div>
              <button
                onClick={() => setAdjustModalTeam(null)}
                className="text-[#71717a] hover:text-white text-xs px-2 py-1 rounded bg-[#18181b]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#a1a1aa]">
                <span>Current Cash Balance:</span>
                <strong className="text-white text-sm">{formatCurrency(adjustModalTeam.cashBalance)}</strong>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-[10px] font-bold text-[#71717a] uppercase mb-1.5">
                Quick Preset Deltas:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["+5000", "+10000", "-5000", "-10000"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomCashDelta(preset.replace("+", ""))}
                    className="py-1.5 bg-[#030303] border border-[#27272a] hover:border-[#FF5F1F] rounded-lg text-xs font-bold text-white transition-all text-center"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <label className="block text-[10px] font-bold text-[#71717a] uppercase mb-1.5">
                Custom Delta Amount ($ positive to grant, negative to deduct):
              </label>
              <input
                type="number"
                value={customCashDelta}
                onChange={(e) => setCustomCashDelta(e.target.value)}
                className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white font-bold text-sm outline-none"
              />
            </div>

            {/* Modal Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModalTeam(null)}
                className="py-2.5 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const delta = Number(customCashDelta);
                  if (!isNaN(delta)) {
                    handleAdminAction("ADJUST_BALANCE", {
                      teamId: adjustModalTeam.id,
                      cashDelta: delta,
                    });
                    setAdjustModalTeam(null);
                  }
                }}
                className="py-2.5 bg-[#FF5F1F] text-black hover:bg-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)]"
              >
                Apply Cash Delta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
