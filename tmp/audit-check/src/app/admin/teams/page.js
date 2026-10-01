"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminTeamsManagementPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const sounds_1 = require("@/src/lib/sounds");
const utils_1 = require("@/src/lib/utils");
const DEFAULT_PIN = "9988";
function AdminTeamsManagementPage() {
    const [pin, setPin] = (0, react_1.useState)(DEFAULT_PIN);
    const [isAuthenticated, setIsAuthenticated] = (0, react_1.useState)(false);
    const [gameState, setGameState] = (0, react_1.useState)(null);
    const [teams, setTeams] = (0, react_1.useState)([]);
    const [actionStatus, setActionStatus] = (0, react_1.useState)(null);
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [statusFilter, setStatusFilter] = (0, react_1.useState)("ALL");
    const [viewMode, setViewMode] = (0, react_1.useState)("GRID");
    const [copiedPinId, setCopiedPinId] = (0, react_1.useState)(null);
    const [revealedPins, setRevealedPins] = (0, react_1.useState)({});
    // Team Create / Edit Modal State
    const [editingTeam, setEditingTeam] = (0, react_1.useState)(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = (0, react_1.useState)(false);
    const [formTeamName, setFormTeamName] = (0, react_1.useState)("");
    const [formPasscode, setFormPasscode] = (0, react_1.useState)("");
    const [formTableNumber, setFormTableNumber] = (0, react_1.useState)("");
    const [formCashBalance, setFormCashBalance] = (0, react_1.useState)("100000");
    const [formMembers, setFormMembers] = (0, react_1.useState)([
        { id: "1", name: "", rollNo: "", phone: "", role: "Leader" },
    ]);
    // Bulk Import Modal State
    const [isBulkModalOpen, setIsBulkModalOpen] = (0, react_1.useState)(false);
    const [bulkCsvText, setBulkCsvText] = (0, react_1.useState)("");
    // Printable Placards Modal State
    const [isPrintModalOpen, setIsPrintModalOpen] = (0, react_1.useState)(false);
    // Cash Adjustment Modal State
    const [adjustModalTeam, setAdjustModalTeam] = (0, react_1.useState)(null);
    const [customCashDelta, setCustomCashDelta] = (0, react_1.useState)("5000");
    const fetchState = (0, react_1.useCallback)(async () => {
        try {
            const res = await fetch("/api/state");
            if (!res.ok)
                return;
            const data = await res.json();
            setGameState(data.gameState);
            setTeams(data.leaderboard || []);
        }
        catch (e) {
            console.error(e);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        fetchState();
        const interval = setInterval(fetchState, 1500);
        return () => clearInterval(interval);
    }, [fetchState]);
    const handleAdminAction = async (action, payload = {}) => {
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
                sounds_1.sounds.playTradeError();
                setIsProcessing(false);
                return;
            }
            setActionStatus(`✅ ${data.message}`);
            sounds_1.sounds.playTradeSuccess();
            fetchState();
            return data;
        }
        catch (e) {
            setActionStatus("❌ Network error executing admin command.");
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleCopyPin = (teamId, teamPin) => {
        navigator.clipboard.writeText(teamPin);
        setCopiedPinId(teamId);
        sounds_1.sounds.playTick();
        setTimeout(() => setCopiedPinId(null), 2000);
    };
    const togglePinReveal = (teamId) => {
        setRevealedPins((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
        sounds_1.sounds.playTick();
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
    const openEditModal = (team) => {
        setEditingTeam(team);
        setFormTeamName(team.teamName);
        setFormPasscode(team.passcode || "1234");
        setFormTableNumber(team.tableNumber || "Table 1");
        setFormCashBalance(String(team.cashBalance || 100000));
        setFormMembers(team.members && team.members.length > 0
            ? team.members.map((m, idx) => ({
                id: m.id || String(idx + 1),
                name: m.name || "",
                rollNo: m.rollNo || "",
                phone: m.phone || "",
                role: m.role || "Member",
            }))
            : [{ id: "1", name: "", rollNo: "", phone: "", role: "Leader" }]);
        setIsCreateModalOpen(true);
    };
    const handleSaveTeam = async (e) => {
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
        }
        else {
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
        if (!bulkCsvText.trim())
            return;
        // Parse CSV rows: TeamName, Table, Passcode, Cash, Member1 Name, Member1 Roll, Member1 Phone...
        const lines = bulkCsvText
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        const parsedTeams = [];
        for (const line of lines) {
            // Ignore header comment
            if (line.toLowerCase().startsWith("team name") || line.startsWith("#"))
                continue;
            const cols = line.split(",").map((c) => c.trim());
            if (cols.length === 0 || !cols[0])
                continue;
            const teamName = cols[0];
            const tableNumber = cols[1] || `Table ${parsedTeams.length + teams.length + 1}`;
            const passcode = cols[2] && cols[2].length >= 3 ? cols[2] : Math.floor(1000 + Math.random() * 9000).toString();
            const cashBalance = Number(cols[3]) || 100000;
            // Extract optional members from additional columns
            const members = [];
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
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-[#030303] flex items-center justify-center p-4 font-mono cyber-grid", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-sm bg-[#09090b] border border-[#27272a] p-6 rounded-xl shadow-2xl space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5 text-[#FF5F1F]", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-lg bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { className: "w-5 h-5 text-[#FF5F1F]" }) }), (0, jsx_runtime_1.jsx)("span", { className: "font-display font-black text-white text-base tracking-wider", children: "TEAM ROSTER SECURITY" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-[#a1a1aa] leading-relaxed", children: "Enter host PIN to access participant rosters, credential generator, and student details." }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: (e) => {
                            e.preventDefault();
                            if (pin === DEFAULT_PIN) {
                                setIsAuthenticated(true);
                                sounds_1.sounds.playTradeSuccess();
                            }
                            else {
                                alert("Incorrect PIN. (Hint: default is 9988)");
                            }
                        }, className: "space-y-4 pt-1", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] uppercase font-bold text-[#71717a] mb-1.5", children: "Host PIN" }), (0, jsx_runtime_1.jsx)("input", { type: "password", value: pin, onChange: (e) => setPin(e.target.value), placeholder: "PIN (Default 9988)", className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2.5 text-white outline-none text-xs tracking-widest font-bold", autoFocus: true })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "w-full py-2.5 bg-[#FF5F1F] text-black font-bold uppercase rounded-lg hover:bg-white transition-all text-xs shadow-[0_0_15px_rgba(255,95,31,0.3)]", children: "Unlock Team Center" })] }), (0, jsx_runtime_1.jsx)("div", { className: "pt-2 text-center border-t border-[#18181b]", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/admin", className: "text-[11px] text-[#71717a] hover:text-[#FF5F1F] transition-colors", children: "\u2190 Return to Master Admin Dashboard" }) })] }) }));
    }
    // Filtered Teams List
    const filteredTeams = teams.filter((t) => {
        const matchesStatus = statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && !t.isFrozen) ||
            (statusFilter === "FROZEN" && t.isFrozen);
        if (!matchesStatus)
            return false;
        if (!searchQuery.trim())
            return true;
        const q = searchQuery.toLowerCase();
        const matchesTeamName = t.teamName.toLowerCase().includes(q);
        const matchesTable = (t.tableNumber || "").toLowerCase().includes(q);
        const matchesPasscode = (t.passcode || "").includes(q);
        const matchesMembers = (t.members || []).some((m) => m.name.toLowerCase().includes(q) ||
            (m.rollNo || "").toLowerCase().includes(q) ||
            (m.phone || "").includes(q));
        return matchesTeamName || matchesTable || matchesPasscode || matchesMembers;
    });
    const totalMembersCount = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
    const totalCashUnderManagement = teams.reduce((acc, t) => acc + (t.totalPortfolioValue || t.cashBalance || 0), 0);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-[#030303] text-[#fafafa] font-mono select-none pb-24 cyber-grid", children: [(0, jsx_runtime_1.jsx)("header", { className: "sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-4 sm:px-6 lg:px-8 py-3.5", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-[1750px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/admin", className: "p-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold", title: "Return to Master Admin", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "w-4 h-4 text-[#FF5F1F]" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Admin Dashboard" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-lg bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h1", { className: "text-sm sm:text-base font-display font-extrabold text-white flex items-center gap-2", children: ["TEAM & ROSTER MANAGEMENT", (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/40", children: "SLH 15" })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a]", children: "Ramaiah University \u2022 Event Participant Directory & Credential Generator" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-wrap", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/stage", target: "_blank", className: "px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#d4d4d8] hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ExternalLink, { className: "w-3.5 h-3.5 text-sky-400" }), (0, jsx_runtime_1.jsx)("span", { children: "Projector (/stage)" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                        fetchState();
                                        sounds_1.sounds.playTick();
                                    }, className: "p-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#d4d4d8] hover:text-white rounded-lg transition-colors", title: "Refresh Roster State", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "w-4 h-4 text-amber-400" }) })] })] }) }), actionStatus && ((0, jsx_runtime_1.jsx)("div", { className: "max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 mt-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#09090b] border border-[#27272a] text-xs rounded-xl flex items-center justify-between shadow-lg", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-semibold", children: actionStatus }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setActionStatus(null), className: "text-[#71717a] hover:text-white text-xs px-2 py-1 rounded bg-[#18181b]", children: "Dismiss" })] }) })), (0, jsx_runtime_1.jsxs)("main", { className: "max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-[#09090b] border border-[#1e1e1e] rounded-xl space-y-1 shadow-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-[#71717a] text-[10px] font-bold uppercase tracking-wider", children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Teams" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "w-4 h-4 text-[#FF5F1F]" })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-2xl sm:text-3xl font-display font-extrabold text-white", children: teams.length }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#10B981] font-semibold", children: [teams.filter((t) => !t.isFrozen).length, " Active \u2022 ", teams.filter((t) => t.isFrozen).length, " Frozen"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-[#09090b] border border-[#1e1e1e] rounded-xl space-y-1 shadow-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-[#71717a] text-[10px] font-bold uppercase tracking-wider", children: [(0, jsx_runtime_1.jsx)("span", { children: "Student Members" }), (0, jsx_runtime_1.jsx)(lucide_react_1.GraduationCap, { className: "w-4 h-4 text-sky-400" })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-2xl sm:text-3xl font-display font-extrabold text-white", children: totalMembersCount }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a]", children: "Across all competition tables" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-[#09090b] border border-[#1e1e1e] rounded-xl space-y-1 shadow-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-[#71717a] text-[10px] font-bold uppercase tracking-wider", children: [(0, jsx_runtime_1.jsx)("span", { children: "Avg Team Size" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { className: "w-4 h-4 text-amber-400" })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-2xl sm:text-3xl font-display font-extrabold text-white", children: teams.length > 0 ? (totalMembersCount / teams.length).toFixed(1) : "0" }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a]", children: "Members per station" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-[#09090b] border border-[#1e1e1e] rounded-xl space-y-1 shadow-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-[#71717a] text-[10px] font-bold uppercase tracking-wider", children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Assets in Play" }), (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "w-4 h-4 text-[#10B981]" })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-xl sm:text-2xl font-display font-extrabold text-[#10B981]", children: (0, utils_1.formatCurrency)(totalCashUnderManagement) }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a]", children: "Cash & stock portfolios" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-[#09090b] border border-[#27272a] rounded-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1 max-w-md", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search team name, student name, roll no, phone...", className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg pl-9 pr-3.5 py-2 text-white placeholder-[#71717a] text-xs outline-none font-medium" }), searchQuery && ((0, jsx_runtime_1.jsx)("button", { onClick: () => setSearchQuery(""), className: "absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white text-xs", children: "\u2715" }))] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-1 bg-[#030303] border border-[#27272a] p-1 rounded-lg", children: ["ALL", "ACTIVE", "FROZEN"].map((st) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setStatusFilter(st), className: `px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${statusFilter === st
                                                ? "bg-[#FF5F1F] text-black"
                                                : "text-[#71717a] hover:text-white"}`, children: st }, st))) }), (0, jsx_runtime_1.jsxs)("div", { className: "hidden sm:flex items-center gap-1 bg-[#030303] border border-[#27272a] p-1 rounded-lg", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setViewMode("GRID"), className: `px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${viewMode === "GRID" ? "bg-[#27272a] text-white" : "text-[#71717a] hover:text-white"}`, children: "Cards" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setViewMode("TABLE"), className: `px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${viewMode === "TABLE" ? "bg-[#27272a] text-white" : "text-[#71717a] hover:text-white"}`, children: "Roster Table" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-wrap", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsPrintModalOpen(true), className: "px-3 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#FF5F1F] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md", title: "Print table credential cards for event desks", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { className: "w-3.5 h-3.5 text-[#FF5F1F]" }), (0, jsx_runtime_1.jsx)("span", { children: "Print Table Placards" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsBulkModalOpen(true), className: "px-3 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-amber-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md", title: "Bulk import teams from Excel/CSV", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileSpreadsheet, { className: "w-3.5 h-3.5 text-amber-400" }), (0, jsx_runtime_1.jsx)("span", { children: "Bulk CSV Import" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                            if (confirm("Regenerate random 4-digit PINs for ALL registered teams? (Existing PINs will be updated immediately)")) {
                                                handleAdminAction("REGENERATE_ALL_PINS");
                                            }
                                        }, className: "px-3 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-sky-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md", title: "Re-generate PINs for all teams", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Dices, { className: "w-3.5 h-3.5 text-sky-400" }), (0, jsx_runtime_1.jsx)("span", { children: "Regen All PINs" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: openCreateModal, className: "px-4 py-2 bg-[#FF5F1F] text-black font-extrabold uppercase rounded-lg hover:bg-white transition-all text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,95,31,0.35)]", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserPlus, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: "+ Register Team" })] })] })] }), viewMode === "GRID" ? ((0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: filteredTeams.map((team) => {
                            const isRevealed = Boolean(revealedPins[team.id]);
                            const isCopied = copiedPinId === team.id;
                            const membersCount = team.members?.length || 0;
                            return ((0, jsx_runtime_1.jsxs)("div", { className: `p-5 bg-[#09090b] border rounded-xl flex flex-col justify-between space-y-4 shadow-xl transition-all relative overflow-hidden ${team.isFrozen
                                    ? "border-rose-900/40 bg-rose-950/10"
                                    : "border-[#1e1e1e] hover:border-[#3f3f46]"}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/40 uppercase tracking-wider", children: team.tableNumber || "Table —" }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-1.5", children: (0, jsx_runtime_1.jsxs)("button", { onClick: () => handleAdminAction("FREEZE_TEAM", { teamId: team.id, isFrozen: !team.isFrozen }), className: `text-[10px] font-bold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${team.isFrozen
                                                                ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                                                : "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40"}`, children: [team.isFrozen ? (0, jsx_runtime_1.jsx)(lucide_react_1.Lock, { className: "w-3 h-3" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Unlock, { className: "w-3 h-3" }), (0, jsx_runtime_1.jsx)("span", { children: team.isFrozen ? "FROZEN" : "ACTIVE" })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-bold text-white leading-tight", children: team.teamName }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#71717a] mt-0.5", children: ["ID: ", (0, jsx_runtime_1.jsx)("code", { className: "text-[#a1a1aa]", children: team.id })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-base font-bold text-[#10B981]", children: (0, utils_1.formatCurrency)(team.totalPortfolioValue || team.cashBalance) }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#71717a]", children: ["Cash: ", (0, utils_1.formatCurrency)(team.cashBalance)] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#030303] border border-[#1e1e1e] rounded-lg flex items-center justify-between text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.KeyRound, { className: "w-4 h-4 text-amber-400" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[9px] text-[#71717a] font-bold uppercase tracking-wider", children: "Login Passcode PIN" }), (0, jsx_runtime_1.jsx)("div", { className: "font-mono font-extrabold text-sm tracking-widest text-white", children: isRevealed ? team.passcode : "••••" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => togglePinReveal(team.id), className: "p-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white rounded transition-colors", title: isRevealed ? "Hide PIN" : "Reveal PIN", children: isRevealed ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { className: "w-3.5 h-3.5" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "w-3.5 h-3.5" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleCopyPin(team.id, team.passcode), className: "p-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white rounded transition-colors flex items-center gap-1 text-[10px] font-bold", title: "Copy PIN", children: isCopied ? (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-3.5 h-3.5 text-[#10B981]" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Copy, { className: "w-3.5 h-3.5" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleAdminAction("REGENERATE_PIN", { teamId: team.id }), className: "p-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-amber-400 rounded transition-colors", title: "Generate Fresh PIN", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Dices, { className: "w-3.5 h-3.5" }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-[10px] font-bold uppercase text-[#71717a]", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Roster (", membersCount, " Members)"] }), (0, jsx_runtime_1.jsx)("span", { children: "Role & Details" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-1 max-h-36 overflow-y-auto pr-1", children: membersCount === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "p-2 bg-[#030303] border border-[#18181b] rounded text-[11px] text-[#52525b] text-center", children: "No student members assigned yet." })) : (team.members.map((member, mIdx) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-2 bg-[#030303] border border-[#18181b] rounded flex items-center justify-between text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[#FF5F1F]" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "font-bold text-white text-[11px] leading-tight", children: member.name }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#71717a] flex items-center gap-1.5", children: [member.rollNo && (0, jsx_runtime_1.jsx)("span", { children: member.rollNo }), member.phone && (0, jsx_runtime_1.jsxs)("span", { children: ["\u2022 ", member.phone] })] })] })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#18181b] text-[#a1a1aa] border border-[#27272a] uppercase", children: member.role || "Member" })] }, member.id || mIdx)))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "pt-2 border-t border-[#18181b] flex items-center justify-between text-[10px] text-[#71717a]", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Holdings: ", Object.keys(team.portfolio || {}).length, " Equities (", Object.values(team.portfolio || {}).reduce((a, b) => a + Number(b || 0), 0), " sh)"] }), (0, jsx_runtime_1.jsxs)("span", { className: team.pnl >= 0 ? "text-[#10B981] font-bold" : "text-[#F43F5E] font-bold", children: ["PnL: ", team.pnl >= 0 ? `+${team.pnlPercent?.toFixed(1)}%` : `${team.pnlPercent?.toFixed(1)}%`] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-2 pt-1", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => openEditModal(team), className: "py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Edit3, { className: "w-3.5 h-3.5 text-[#FF5F1F]" }), (0, jsx_runtime_1.jsx)("span", { children: "Edit" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                                    setAdjustModalTeam(team);
                                                    setCustomCashDelta("5000");
                                                }, className: "py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "w-3.5 h-3.5 text-amber-400" }), (0, jsx_runtime_1.jsx)("span", { children: "Cash" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                                    if (confirm(`Permanently delete team "${team.teamName}" and all associated data?`)) {
                                                        handleAdminAction("DELETE_TEAM", { teamId: team.id });
                                                    }
                                                }, className: "py-1.5 bg-[#18181b] hover:bg-rose-950/40 border border-[#27272a] hover:border-rose-500/50 text-rose-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Delete" })] })] })] }, team.id));
                        }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden shadow-xl", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-xs", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-[#030303] text-[#71717a] uppercase font-bold text-[10px] border-b border-[#27272a]", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "p-3.5", children: "Table" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3.5", children: "Team Name" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3.5", children: "Login PIN" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3.5", children: "Student Members & Contacts" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3.5", children: "Cash Balance" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3.5", children: "Net Worth" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3.5", children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3.5 text-right", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-[#18181b]", children: filteredTeams.map((team) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-[#121215] transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "p-3.5 font-bold text-[#FF5F1F]", children: team.tableNumber || "—" }), (0, jsx_runtime_1.jsxs)("td", { className: "p-3.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "font-bold text-white text-sm", children: team.teamName }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#71717a]", children: ["ID: ", team.id] })] }), (0, jsx_runtime_1.jsx)("td", { className: "p-3.5 font-mono font-bold tracking-widest text-amber-300", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { children: team.passcode }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleCopyPin(team.id, team.passcode), className: "text-[#71717a] hover:text-white", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Copy, { className: "w-3 h-3" }) })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-3.5", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(team.members || []).map((m, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] text-[#d4d4d8] flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-white", children: m.name }), m.rollNo && (0, jsx_runtime_1.jsxs)("span", { className: "text-[#71717a]", children: ["(", m.rollNo, ")"] }), m.phone && (0, jsx_runtime_1.jsxs)("span", { className: "text-[#10B981]", children: ["\uD83D\uDCF1 ", m.phone] })] }, idx))), (!team.members || team.members.length === 0) && ((0, jsx_runtime_1.jsx)("span", { className: "text-[#52525b] italic", children: "No members listed" }))] }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-3.5 text-white font-medium", children: (0, utils_1.formatCurrency)(team.cashBalance) }), (0, jsx_runtime_1.jsx)("td", { className: "p-3.5 font-bold text-[#10B981]", children: (0, utils_1.formatCurrency)(team.totalPortfolioValue || team.cashBalance) }), (0, jsx_runtime_1.jsx)("td", { className: "p-3.5", children: (0, jsx_runtime_1.jsx)("span", { className: `px-2 py-0.5 rounded text-[10px] font-bold ${team.isFrozen
                                                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                                            : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"}`, children: team.isFrozen ? "FROZEN" : "ACTIVE" }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-3.5 text-right", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-end gap-1.5", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => openEditModal(team), className: "p-1.5 bg-[#18181b] hover:bg-[#27272a] text-white rounded", title: "Edit Team", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit3, { className: "w-3.5 h-3.5 text-[#FF5F1F]" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleAdminAction("REGENERATE_PIN", { teamId: team.id }), className: "p-1.5 bg-[#18181b] hover:bg-[#27272a] text-amber-400 rounded", title: "Regenerate PIN", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Dices, { className: "w-3.5 h-3.5" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                                                    if (confirm(`Delete team "${team.teamName}"?`)) {
                                                                        handleAdminAction("DELETE_TEAM", { teamId: team.id });
                                                                    }
                                                                }, className: "p-1.5 bg-[#18181b] hover:bg-rose-950/40 text-rose-400 rounded", title: "Delete Team", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" }) })] }) })] }, team.id))) })] }) }) }))] }), (0, jsx_runtime_1.jsx)(framer_motion_1.AnimatePresence, { children: isCreateModalOpen && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md", children: (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { scale: 0.88, opacity: 0, y: 20 }, animate: { scale: 1, opacity: 1, y: 0 }, exit: { scale: 0.88, opacity: 0, y: 20 }, transition: { type: "spring", damping: 25, stiffness: 350 }, className: "w-full max-w-2xl bg-[#09090b] border border-[#27272a] p-6 rounded-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-3 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-9 h-9 rounded-xl bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.UserPlus, { className: "w-5 h-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-base font-bold text-white", children: editingTeam ? `Edit Team: ${editingTeam.teamName}` : "Register New Competition Team" }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a]", children: "Configure station table, login passcode, and student team members." })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsCreateModalOpen(false), className: "text-[#71717a] hover:text-white text-xs px-2.5 py-1 rounded bg-[#18181b]", children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSaveTeam, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] font-bold text-[#71717a] uppercase mb-1", children: "Team Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: formTeamName, onChange: (e) => setFormTeamName(e.target.value), placeholder: "e.g. Apex Capital, Quantum Quants", className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white text-xs font-semibold outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] font-bold text-[#71717a] uppercase mb-1", children: "Table / Station Number" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: formTableNumber, onChange: (e) => setFormTableNumber(e.target.value), placeholder: "e.g. Table 4, SLH 15 Desk 2", className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white text-xs font-semibold outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-1", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] font-bold text-[#71717a] uppercase", children: "Login Passcode PIN *" }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => {
                                                                    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
                                                                    setFormPasscode(newPin);
                                                                    sounds_1.sounds.playTick();
                                                                }, className: "text-[10px] font-bold text-amber-400 hover:text-white flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Dices, { className: "w-3 h-3" }), (0, jsx_runtime_1.jsx)("span", { children: "Random PIN" })] })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: formPasscode, onChange: (e) => setFormPasscode(e.target.value), placeholder: "4-digit PIN (e.g. 1234)", className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white font-mono font-bold tracking-widest text-xs outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] font-bold text-[#71717a] uppercase mb-1", children: "Starting Cash Balance ($)" }), (0, jsx_runtime_1.jsx)("input", { type: "number", value: formCashBalance, onChange: (e) => setFormCashBalance(e.target.value), placeholder: "100000", className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white text-xs font-semibold outline-none" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "pt-2 border-t border-[#1e1e1e] space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.GraduationCap, { className: "w-4 h-4 text-[#FF5F1F]" }), "Student Team Members (Roster)"] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-[#71717a]", children: "Add participant names, University Roll / USN numbers, and contact numbers." })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => {
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
                                                        }, className: "px-2.5 py-1 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#FF5F1F] hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "w-3 h-3" }), (0, jsx_runtime_1.jsx)("span", { children: "Add Member" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: formMembers.map((member, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#030303] border border-[#1e1e1e] rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "sm:col-span-4", children: (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Student Full Name", value: member.name, onChange: (e) => {
                                                                    const val = e.target.value;
                                                                    setFormMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, name: val } : m)));
                                                                }, className: "w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none" }) }), (0, jsx_runtime_1.jsx)("div", { className: "sm:col-span-3", children: (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Roll No / USN", value: member.rollNo, onChange: (e) => {
                                                                    const val = e.target.value;
                                                                    setFormMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, rollNo: val } : m)));
                                                                }, className: "w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none" }) }), (0, jsx_runtime_1.jsx)("div", { className: "sm:col-span-3", children: (0, jsx_runtime_1.jsx)("input", { type: "tel", placeholder: "Phone Number", value: member.phone, onChange: (e) => {
                                                                    const val = e.target.value;
                                                                    setFormMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, phone: val } : m)));
                                                                }, className: "w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "sm:col-span-2 flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsxs)("select", { value: member.role, onChange: (e) => {
                                                                        const val = e.target.value;
                                                                        setFormMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, role: val } : m)));
                                                                    }, className: "w-full bg-[#09090b] border border-[#27272a] rounded-lg px-1.5 py-1.5 text-[10px] text-[#d4d4d8] outline-none", children: [(0, jsx_runtime_1.jsx)("option", { value: "Leader", children: "Leader" }), (0, jsx_runtime_1.jsx)("option", { value: "Analyst", children: "Analyst" }), (0, jsx_runtime_1.jsx)("option", { value: "Trader", children: "Trader" }), (0, jsx_runtime_1.jsx)("option", { value: "Member", children: "Member" })] }), formMembers.length > 1 && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                                                                        setFormMembers((prev) => prev.filter((_, i) => i !== idx));
                                                                    }, className: "p-1.5 text-[#71717a] hover:text-rose-400 transition-colors", title: "Remove Member", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-4 h-4" }) }))] })] }, member.id || idx))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3 pt-3 border-t border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setIsCreateModalOpen(false), className: "py-2.5 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl text-xs font-bold transition-all", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isProcessing, className: "py-2.5 bg-[#FF5F1F] text-black font-extrabold uppercase rounded-xl hover:bg-white transition-all text-xs shadow-[0_0_15px_rgba(255,95,31,0.3)]", children: editingTeam ? "Save Team Changes" : "Create & Register Team" })] })] })] }) })) }), (0, jsx_runtime_1.jsx)(framer_motion_1.AnimatePresence, { children: isBulkModalOpen && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md", children: (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { scale: 0.88, opacity: 0, y: 20 }, animate: { scale: 1, opacity: 1, y: 0 }, exit: { scale: 0.88, opacity: 0, y: 20 }, transition: { type: "spring", damping: 25, stiffness: 350 }, className: "w-full max-w-xl bg-[#09090b] border border-[#27272a] p-6 rounded-2xl shadow-2xl space-y-4 font-mono", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-3 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileSpreadsheet, { className: "w-5 h-5 text-amber-400" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-base font-bold text-white", children: "Bulk CSV Team Importer" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsBulkModalOpen(false), className: "text-[#71717a] hover:text-white text-xs px-2.5 py-1 rounded bg-[#18181b]", children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-[#a1a1aa] leading-relaxed", children: ["Paste your CSV rows below. Each row can define: ", (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("code", { className: "text-[#FF5F1F] text-[11px]", children: "Team Name, Table, PIN, Cash, Member 1 Name, Member 1 Roll, Member 1 Phone..." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-[10px] text-[#71717a]", children: [(0, jsx_runtime_1.jsx)("span", { children: "Sample Data:" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                                                    setBulkCsvText(`Alpha Capital, Table 1, 1234, 100000, Aarav Sharma, RUAS22DS01, 9876543210, Priya Patel, RUAS22DS02, 9876543211\nBeta Quant, Table 2, 5678, 100000, Vikram Reddy, RUAS22DS03, 9876543212, Sneha Rao, RUAS22DS04, 9876543213\nGamma Ventures, Table 3, 9012, 100000, Aditya Kumar, RUAS22DS05, 9876543214, Ananya Iyer, RUAS22DS06, 9876543215`);
                                                }, className: "text-amber-400 underline hover:text-white", children: "Insert Sample" })] }), (0, jsx_runtime_1.jsx)("textarea", { rows: 8, value: bulkCsvText, onChange: (e) => setBulkCsvText(e.target.value), placeholder: "Paste CSV rows here...", className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg p-3 text-xs text-white font-mono outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setIsBulkModalOpen(false), className: "py-2.5 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl text-xs font-bold transition-all", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleBulkImport, className: "py-2.5 bg-amber-500 text-black font-extrabold uppercase rounded-xl hover:bg-white transition-all text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)]", children: "Import All Teams" })] })] }) })) }), (0, jsx_runtime_1.jsx)(framer_motion_1.AnimatePresence, { children: isPrintModalOpen && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto", children: (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "w-full max-w-4xl bg-white text-black p-8 rounded-2xl shadow-2xl space-y-6 my-8 font-sans print:p-0 print:m-0 print:shadow-none print:w-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-4 border-b border-gray-200 print:hidden font-mono", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-bold text-gray-900 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { className: "w-5 h-5 text-[#FF5F1F]" }), "Printable Table Credentials & Badges"] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: "Print and cut these credential placards for event volunteers to place on competition desks at SLH 15." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => window.print(), className: "px-4 py-2 bg-[#FF5F1F] text-black font-bold text-xs uppercase rounded-lg hover:bg-black hover:text-white transition-all shadow-md flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: "Print Now" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsPrintModalOpen(false), className: "px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all", children: "Close" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4", children: teams.map((team, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "border-2 border-black p-5 rounded-xl flex flex-col justify-between space-y-4 page-break-inside-avoid bg-white shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-b-2 border-black pb-3 flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] font-black uppercase tracking-widest text-gray-500", children: "Ramaiah University \u2022 Bulls & Bears" }), (0, jsx_runtime_1.jsx)("h4", { className: "text-2xl font-black text-black leading-tight mt-0.5", children: team.teamName })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-black text-white px-3 py-1 rounded font-black text-sm uppercase tracking-wider", children: team.tableNumber || `Table ${idx + 1}` })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-100 border border-gray-300 p-4 rounded-lg flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] font-bold uppercase text-gray-500 tracking-wider", children: "Station Login PIN" }), (0, jsx_runtime_1.jsx)("div", { className: "font-mono text-3xl font-black text-black tracking-widest", children: team.passcode })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right text-[11px] font-bold text-gray-600", children: [(0, jsx_runtime_1.jsx)("div", { children: "Starting Cash:" }), (0, jsx_runtime_1.jsx)("div", { className: "text-base font-black text-green-700", children: (0, utils_1.formatCurrency)(team.cashBalance || 100000) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] font-black uppercase tracking-wider text-gray-500", children: "Registered Team Members:" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-1 text-xs", children: (team.members || []).length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "text-gray-400 italic text-[11px]", children: "No names listed" })) : (team.members.map((m, mIdx) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between border-b border-gray-100 pb-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-bold text-black", children: m.name }), (0, jsx_runtime_1.jsx)("span", { className: "text-gray-600 font-mono text-[11px]", children: m.rollNo || m.role })] }, mIdx)))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[9px] text-gray-500 text-center border-t border-gray-200 pt-2 uppercase tracking-wider", children: ["Log in at: ", (0, jsx_runtime_1.jsx)("strong", { className: "text-black", children: "/trade" }), " \u2022 Oct 1st Event \u2022 SLH 15"] })] }, team.id))) })] }) })) }), adjustModalTeam && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-sm bg-[#09090b] border border-[#27272a] p-5 rounded-xl shadow-2xl space-y-4 font-mono", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-2 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs text-[#FF5F1F] font-bold uppercase", children: "Adjust Cash Balance" }), (0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-bold text-white", children: adjustModalTeam.teamName })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setAdjustModalTeam(null), className: "text-[#71717a] hover:text-white text-xs px-2 py-1 rounded bg-[#18181b]", children: "\u2715" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2 text-xs", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-[#a1a1aa]", children: [(0, jsx_runtime_1.jsx)("span", { children: "Current Cash Balance:" }), (0, jsx_runtime_1.jsx)("strong", { className: "text-white text-sm", children: (0, utils_1.formatCurrency)(adjustModalTeam.cashBalance) })] }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] font-bold text-[#71717a] uppercase mb-1.5", children: "Quick Preset Deltas:" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-4 gap-2", children: ["+5000", "+10000", "-5000", "-10000"].map((preset) => ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setCustomCashDelta(preset.replace("+", "")), className: "py-1.5 bg-[#030303] border border-[#27272a] hover:border-[#FF5F1F] rounded-lg text-xs font-bold text-white transition-all text-center", children: preset }, preset))) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] font-bold text-[#71717a] uppercase mb-1.5", children: "Custom Delta Amount ($ positive to grant, negative to deduct):" }), (0, jsx_runtime_1.jsx)("input", { type: "number", value: customCashDelta, onChange: (e) => setCustomCashDelta(e.target.value), className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white font-bold text-sm outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setAdjustModalTeam(null), className: "py-2.5 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl text-xs font-bold transition-all", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                                        const delta = Number(customCashDelta);
                                        if (!isNaN(delta)) {
                                            handleAdminAction("ADJUST_BALANCE", {
                                                teamId: adjustModalTeam.id,
                                                cashDelta: delta,
                                            });
                                            setAdjustModalTeam(null);
                                        }
                                    }, className: "py-2.5 bg-[#FF5F1F] text-black hover:bg-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)]", children: "Apply Cash Delta" })] })] }) }))] }));
}
