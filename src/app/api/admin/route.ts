import { randomUUID } from "node:crypto";
import { runGameStateRequest } from "@/src/lib/db/runtime";
import { NextResponse } from "next/server";
import { getGameState, getInitialGameState } from "@/src/lib/db";
import { STOCKS_DATA, ROUNDS_DATA } from "@/src/lib/market-data";
import { snapshotFinalScores } from "@/src/lib/final-scores";

const ADMIN_SECRET_PIN = "9988"; // Quick host pin

async function execute(request: Request) {
  try {
    const { pin, action, payload } = await request.json();

    if (pin !== ADMIN_SECRET_PIN) {
      return NextResponse.json({ error: "Unauthorized: Invalid Admin PIN." }, { status: 401 });
    }

    const state = getGameState();

    if (action === "START_SCORE_ANNOUNCEMENT") {
      if (state.currentRound !== 5) {
        return NextResponse.json({ error: "Final scores can be announced only after reaching Round 5." }, { status: 400 });
      }
      if (!Object.keys(state.teams).length) {
        return NextResponse.json({ error: "Register teams before announcing scores." }, { status: 400 });
      }
      if (!state.scoresAnnouncement) state.scoresAnnouncement = snapshotFinalScores(state);
      state.status = "FINISHED";
      state.tradingExpiresAt = null;
      state.swaps.forEach((swap) => { if (swap.status === "PENDING") swap.status = "CANCELLED"; });
      state.directSellOffers.forEach((offer) => { if (offer.status === "PENDING") offer.status = "CANCELLED"; });
      return NextResponse.json({ success: true, message: "Final scores frozen. Reveal teams from last place to first on /stage.", state });
    }

    if (action === "REVEAL_NEXT_SCORE") {
      const announcement = state.scoresAnnouncement;
      if (!announcement) return NextResponse.json({ error: "Start the final score announcement first." }, { status: 400 });
      if (announcement.revealedCount >= announcement.teams.length) return NextResponse.json({ error: "All teams have already been announced." }, { status: 400 });
      announcement.revealedCount += 1;
      const team = announcement.teams[announcement.teams.length - announcement.revealedCount];
      return NextResponse.json({ success: true, message: `Announced #${team.rank}: ${team.teamName}.`, state });
    }

    if (state.scoresAnnouncement && !["RESET_GAME", "TOGGLE_LEADERBOARD", "TOGGLE_STAGE_AUDIT"].includes(action)) {
      return NextResponse.json({ error: "Final scores are frozen. Reset the simulation to make further game changes." }, { status: 409 });
    }

    if (action === "SET_MARKET_SELL_COMMISSION") {
      const percent = payload?.percent;
      if (typeof payload?.enabled !== "boolean" || typeof percent !== "number" || !Number.isFinite(percent) || percent < 0 || percent > 100) {
        return NextResponse.json({ error: "Commission must be a number between 0% and 100%, with an enabled or disabled setting." }, { status: 400 });
      }
      state.marketSellCommissionEnabled = payload.enabled;
      state.marketSellCommissionPercent = percent;
      return NextResponse.json({ success: true, message: `Market-sale commission ${payload.enabled ? `set to ${percent}%` : "disabled"}. Direct trades and swaps are exempt.`, state });
    }

    if (action === "SET_NEGOTIATED_PRICES") {
      if (typeof payload?.enabled !== "boolean") return NextResponse.json({ error: "Choose whether negotiated prices are enabled." }, { status: 400 });
      state.negotiatedPricesEnabled = payload.enabled;
      return NextResponse.json({ success: true, message: `Negotiated prices ${payload.enabled ? "enabled" : "disabled"} for new direct offers. Existing offers retain their agreed price.`, state });
    }

    if (action === "SET_MARKET_SELL_LOCK") {
      if (typeof payload?.enabled !== "boolean") {
        return NextResponse.json({ error: "Choose whether the market-sale lock is enabled." }, { status: 400 });
      }
      state.marketSellLockEnabled = payload.enabled;
      return NextResponse.json({ success: true, message: `Market-sale lock ${payload.enabled ? "enabled" : "disabled"} for all teams.`, state });
    }

    if (action === "RELEASE_NEWS") {
      state.status = "NEWS_RELEASED";
      state.tradingExpiresAt = null;

      // Sync and calculate prices for the active round
      const roundNum = state.currentRound;
      const roundKey = `r${roundNum}` as keyof (typeof STOCKS_DATA)[0]["prices"];
      const customShifts = state.customPriceShifts?.[roundNum] || {};

      STOCKS_DATA.forEach((s) => {
        if (customShifts[s.ticker] !== undefined) {
          const shiftPct = customShifts[s.ticker];
          const currentPrice = state.stockPrices[s.ticker] || s.startingPrice;
          state.stockPrices[s.ticker] = Math.max(1, parseFloat((currentPrice * (1 + shiftPct / 100)).toFixed(2)));
        } else if (s.prices[roundKey] !== undefined) {
          state.stockPrices[s.ticker] = s.prices[roundKey];
        }
      });

      return NextResponse.json({
        success: true,
        message: `Step 1 complete: News released for Round ${state.currentRound}! Stock prices updated and intelligence live.`,
        state,
      });
    }

    if (action === "OPEN_TRADING") {
      const minutes = payload?.minutes || 10;
      state.status = "TRADING_OPEN";
      state.tradingExpiresAt = Date.now() + minutes * 60 * 1000;
      return NextResponse.json({ success: true, message: `Trading window OPEN for ${minutes} minutes!`, state });
    }

    if (action === "CLOSE_TRADING") {
      state.status = "TRADING_CLOSED";
      state.tradingExpiresAt = null;
      return NextResponse.json({ success: true, message: "Trading closed and market locked.", state });
    }

    if (action === "APPLY_PRICE_UPDATE") {
      const roundNum = state.currentRound;
      const roundKey = `r${roundNum}` as keyof (typeof STOCKS_DATA)[0]["prices"];
      const roundChanges = state.customPriceShifts?.[roundNum] || ROUNDS_DATA.find((r) => r.round === roundNum)?.marketChanges || {};

      STOCKS_DATA.forEach((s) => {
        // If a custom percentage shift was set by the admin
        if (state.customPriceShifts?.[roundNum] && state.customPriceShifts[roundNum][s.ticker] !== undefined) {
          const shiftPct = state.customPriceShifts[roundNum][s.ticker];
          const currentPrice = state.stockPrices[s.ticker] || s.startingPrice;
          state.stockPrices[s.ticker] = Math.max(1, parseFloat((currentPrice * (1 + shiftPct / 100)).toFixed(2)));
        } else if (s.prices[roundKey] !== undefined) {
          state.stockPrices[s.ticker] = s.prices[roundKey];
        }
      });

      return NextResponse.json({ success: true, message: `Market prices updated for Round ${state.currentRound}!`, state });
    }

    if (action === "UPDATE_CUSTOM_SCENARIO") {
      const { round, title, subtitle, newsStories } = payload;
      if (!state.customScenarios) state.customScenarios = {};
      state.customScenarios[round] = {
        title,
        subtitle,
        newsStories,
      };
      return NextResponse.json({ success: true, message: `Custom scenario updated for Round ${round}!`, state });
    }

    if (action === "UPDATE_PRICE_SHIFTS") {
      const { round, shifts } = payload;
      if (!state.customPriceShifts) state.customPriceShifts = {};
      state.customPriceShifts[round] = {
        ...(state.customPriceShifts[round] || {}),
        ...shifts,
      };
      return NextResponse.json({ success: true, message: `Custom price shifts saved for Round ${round}!`, state });
    }

    if (action === "RESET_CUSTOM_SCENARIO") {
      const { round } = payload;
      if (state.customScenarios && state.customScenarios[round]) {
        delete state.customScenarios[round];
      }
      if (state.customPriceShifts && state.customPriceShifts[round]) {
        delete state.customPriceShifts[round];
      }
      return NextResponse.json({ success: true, message: `Round ${round} scenario reset to default!`, state });
    }

    if (action === "EXTEND_TIMER") {
      const extraMinutes = Number(payload?.minutes) || 2;
      const now = Date.now();
      if (state.status !== "TRADING_OPEN" || !state.tradingExpiresAt) {
        state.status = "TRADING_OPEN";
        state.tradingExpiresAt = now + extraMinutes * 60 * 1000;
      } else {
        const base = Math.max(now, state.tradingExpiresAt);
        state.tradingExpiresAt = base + extraMinutes * 60 * 1000;
      }
      const remainingSec = Math.max(0, Math.floor((state.tradingExpiresAt - now) / 1000));
      const m = Math.floor(remainingSec / 60);
      const s = remainingSec % 60;
      return NextResponse.json({
        success: true,
        message: `Timer extended by +${extraMinutes}m! New clock: ${m}m ${s}s`,
        state,
      });
    }

    if (action === "PREVIOUS_ROUND") {
      if (state.currentRound > 0) {
        state.currentRound -= 1;
        state.status = "SETUP";
        state.tradingExpiresAt = null;

        if (state.currentRound < 2) {
          state.marketExpanded = false;
        }

        // Sync baseline prices for the reverted round
        const targetRound = state.currentRound;
        const roundKey = `r${targetRound}` as keyof (typeof STOCKS_DATA)[0]["prices"];
        STOCKS_DATA.forEach((s) => {
          if (targetRound === 0) {
            state.stockPrices[s.ticker] = s.startingPrice;
          } else if (s.prices[roundKey] !== undefined) {
            state.stockPrices[s.ticker] = s.prices[roundKey];
          }
        });

        return NextResponse.json({
          success: true,
          message: `Reverted back to Round ${state.currentRound}!`,
          state,
        });
      } else {
        return NextResponse.json({ error: "Already at baseline Round 0." }, { status: 400 });
      }
    }

    if (action === "SET_ROUND") {
      const targetRound = Math.max(0, Math.min(5, Number(payload?.round) ?? 0));
      state.currentRound = targetRound;
      state.status = "SETUP";
      state.tradingExpiresAt = null;

      if (targetRound >= 2) {
        state.marketExpanded = true;
      } else {
        state.marketExpanded = false;
      }

      // Sync baseline prices or custom shifts for the target round
      const roundKey = `r${targetRound}` as keyof (typeof STOCKS_DATA)[0]["prices"];
      const customShifts = state.customPriceShifts?.[targetRound] || {};

      STOCKS_DATA.forEach((s) => {
        if (targetRound === 0) {
          state.stockPrices[s.ticker] = s.startingPrice;
        } else if (customShifts[s.ticker] !== undefined) {
          const shiftPct = customShifts[s.ticker];
          const currentPrice = state.stockPrices[s.ticker] || s.startingPrice;
          state.stockPrices[s.ticker] = Math.max(1, parseFloat((currentPrice * (1 + shiftPct / 100)).toFixed(2)));
        } else if (s.prices[roundKey] !== undefined) {
          state.stockPrices[s.ticker] = s.prices[roundKey];
        }
      });

      return NextResponse.json({
        success: true,
        message: `Simulation phase jumped to Round ${targetRound}! Stock prices synchronized and round intelligence ready.`,
        state,
      });
    }

    if (action === "ADVANCE_ROUND") {
      if (state.currentRound < 5) {
        state.currentRound += 1;
        state.status = "SETUP";
        state.tradingExpiresAt = null;

        // If reaching round 2, auto activate expansion
        if (state.currentRound >= 2) {
          state.marketExpanded = true;
        }

        // Automatically sync and apply prices for the new round
        const targetRound = state.currentRound;
        const roundKey = `r${targetRound}` as keyof (typeof STOCKS_DATA)[0]["prices"];
        const customShifts = state.customPriceShifts?.[targetRound] || {};

        STOCKS_DATA.forEach((s) => {
          if (customShifts[s.ticker] !== undefined) {
            const shiftPct = customShifts[s.ticker];
            const currentPrice = state.stockPrices[s.ticker] || s.startingPrice;
            state.stockPrices[s.ticker] = Math.max(1, parseFloat((currentPrice * (1 + shiftPct / 100)).toFixed(2)));
          } else if (s.prices[roundKey] !== undefined) {
            state.stockPrices[s.ticker] = s.prices[roundKey];
          }
        });

        return NextResponse.json({
          success: true,
          message: `Advanced to Round ${state.currentRound}! Stock prices synchronized and new round intelligence ready.`,
          state,
        });
      } else {
        return NextResponse.json({ error: "Already at final round (Round 5)." }, { status: 400 });
      }
    }

    if (action === "TRIGGER_EXPANSION") {
      state.marketExpanded = true;
      return NextResponse.json({ success: true, message: "10 New Stocks have entered the market!", state });
    }

    if (action === "FINAL_LIQUIDATION") {
      // Liquidate all team portfolios into cash at current prices
      Object.values(state.teams).forEach((team) => {
        let liquidationSum = 0;
        Object.entries(team.portfolio).forEach(([ticker, qty]) => {
          const price = state.stockPrices[ticker] || 0;
          const value = price * qty;
          liquidationSum += value;

          state.transactions.push({
            id: randomUUID(),
            timestamp: new Date().toLocaleTimeString(),
            round: state.currentRound,
            teamName: team.teamName,
            type: "LIQUIDATION",
            teamId: team.id,
            ticker,
            quantity: qty,
            price,
            total: value,
          });
        });

        team.cashBalance += liquidationSum;
        team.portfolio = {};
      });

      state.status = "FINISHED";
      state.leaderboardVisible = true;

      return NextResponse.json({ success: true, message: "Final liquidation complete! All assets converted to cash.", state });
    }

    if (action === "TOGGLE_LEADERBOARD") {
      state.leaderboardVisible = !state.leaderboardVisible;
      return NextResponse.json({ success: true, message: `Leaderboard visibility set to ${state.leaderboardVisible}`, state });
    }

    if (action === "TOGGLE_STAGE_AUDIT") {
      state.stageAuditVisible = state.stageAuditVisible !== undefined ? !state.stageAuditVisible : false;
      return NextResponse.json({
        success: true,
        message: `Stage Audit Stream set to ${state.stageAuditVisible ? "VISIBLE" : "HIDDEN"}`,
        state,
      });
    }

    if (action === "CREATE_TEAM") {
      const { teamName, passcode, initialCash, tableNumber, members } = payload;
      if (!teamName || !teamName.trim()) {
        return NextResponse.json({ error: "Team Name is required." }, { status: 400 });
      }

      const teamId = randomUUID();
      const generatedPasscode = passcode && passcode.trim() ? passcode.trim() : Math.floor(1000 + Math.random() * 9000).toString();

      state.teams[teamId] = {
        id: teamId,
        teamName: teamName.trim(),
        passcode: generatedPasscode,
        cashBalance: Number(initialCash) || 100000,
        isFrozen: false,
        tableNumber: tableNumber || `Table ${Object.keys(state.teams).length + 1}`,
        members: Array.isArray(members) ? members : [],
        portfolio: {},
      };

      return NextResponse.json({
        success: true,
        message: `Team "${teamName}" created successfully! PIN: ${generatedPasscode}`,
        state,
        team: state.teams[teamId],
      });
    }

    if (action === "UPDATE_TEAM") {
      const { teamId, teamName, passcode, cashBalance, tableNumber, members, isFrozen } = payload;
      if (!state.teams[teamId]) {
        return NextResponse.json({ error: "Team not found." }, { status: 404 });
      }

      if (teamName && teamName.trim()) state.teams[teamId].teamName = teamName.trim();
      if (passcode && passcode.trim()) state.teams[teamId].passcode = passcode.trim();
      if (cashBalance !== undefined && !isNaN(Number(cashBalance))) state.teams[teamId].cashBalance = Number(cashBalance);
      if (tableNumber !== undefined) state.teams[teamId].tableNumber = tableNumber;
      if (members !== undefined && Array.isArray(members)) state.teams[teamId].members = members;
      if (isFrozen !== undefined) state.teams[teamId].isFrozen = Boolean(isFrozen);

      return NextResponse.json({
        success: true,
        message: `Team "${state.teams[teamId].teamName}" updated successfully!`,
        state,
      });
    }

    if (action === "DELETE_TEAM") {
      const { teamId } = payload;
      if (!state.teams[teamId]) {
        return NextResponse.json({ error: "Team not found." }, { status: 404 });
      }
      const deletedName = state.teams[teamId].teamName;
      Object.entries(state.teams[teamId].portfolio).forEach(([ticker, qty]) => {
        state.stockFloats[ticker] = Math.min(100, (state.stockFloats[ticker] || 0) + qty);
      });
      delete state.teams[teamId];
      getGameState();
      return NextResponse.json({
        success: true,
        message: `Team "${deletedName}" deleted successfully!`,
        state,
      });
    }

    if (action === "REGENERATE_PIN") {
      const { teamId } = payload;
      if (!state.teams[teamId]) {
        return NextResponse.json({ error: "Team not found." }, { status: 404 });
      }
      const newPin = Math.floor(1000 + Math.random() * 9000).toString();
      state.teams[teamId].passcode = newPin;
      return NextResponse.json({
        success: true,
        message: `PIN regenerated for "${state.teams[teamId].teamName}": ${newPin}`,
        newPin,
        state,
      });
    }

    if (action === "REGENERATE_ALL_PINS") {
      Object.values(state.teams).forEach((t) => {
        t.passcode = Math.floor(1000 + Math.random() * 9000).toString();
      });
      return NextResponse.json({
        success: true,
        message: "New 4-digit PINs generated for all registered teams!",
        state,
      });
    }

    if (action === "BULK_IMPORT_TEAMS") {
      const { teams } = payload;
      if (!Array.isArray(teams) || teams.length === 0) {
        return NextResponse.json({ error: "No valid teams provided for import." }, { status: 400 });
      }
      let importedCount = 0;
      teams.forEach((t: any, idx: number) => {
        if (!t.teamName || !t.teamName.trim()) return;
        const teamId = randomUUID();
        const pin = t.passcode && t.passcode.trim() ? t.passcode.trim() : Math.floor(1000 + Math.random() * 9000).toString();
        state.teams[teamId] = {
          id: teamId,
          teamName: t.teamName.trim(),
          passcode: pin,
          cashBalance: Number(t.cashBalance) || 100000,
          isFrozen: false,
          tableNumber: t.tableNumber || `Table ${Object.keys(state.teams).length + 1}`,
          members: Array.isArray(t.members) ? t.members : [],
          portfolio: {},
        };
        importedCount++;
      });
      return NextResponse.json({
        success: true,
        message: `Successfully imported ${importedCount} teams with auto-generated credentials!`,
        state,
      });
    }

    if (action === "FREEZE_TEAM") {
      const { teamId, isFrozen } = payload;
      if (state.teams[teamId]) {
        state.teams[teamId].isFrozen = isFrozen;
      }
      return NextResponse.json({ success: true, message: `Team freeze status updated.`, state });
    }

    if (action === "ADJUST_BALANCE") {
      const { teamId, cashDelta } = payload;
      if (state.teams[teamId]) {
        state.teams[teamId].cashBalance += Number(cashDelta) || 0;
      }
      return NextResponse.json({ success: true, message: "Cash balance adjusted.", state });
    }

    if (action === "TOGGLE_TEAM_READY") {
      const { teamId } = payload;
      if (state.teams[teamId]) {
        state.teams[teamId].isReady = !state.teams[teamId].isReady;
      }
      return NextResponse.json({
        success: true,
        message: `Updated readiness status for "${state.teams[teamId]?.teamName || teamId}".`,
        state,
      });
    }

    if (action === "SET_ALL_TEAMS_READY") {
      const { isReady } = payload;
      const targetState = isReady !== undefined ? Boolean(isReady) : true;
      Object.values(state.teams).forEach((t) => {
        t.isReady = targetState;
      });
      return NextResponse.json({
        success: true,
        message: `All teams marked ${targetState ? "READY" : "STANDBY"}.`,
        state,
      });
    }

    if (action === "RESET_GAME") {
      const fresh = getInitialGameState();
      const keepTeams = payload?.keepTeams === true;
      if (keepTeams) {
        Object.values(state.teams).forEach((team) => {
          fresh.teams[team.id] = {
            ...team,
            cashBalance: 100000,
            portfolio: {},
            isReady: false,
            isFrozen: false,
            peerTradesByRound: {},
          };
        });
      }
      Object.assign(state, fresh);
      return NextResponse.json({
        success: true,
        message: `Simulation reset. ${keepTeams ? "Teams kept with fresh balances." : "All teams removed."} Previous transactions and offers cleared.`,
        state,
      });
    }

    return NextResponse.json({ error: "Invalid admin action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to execute admin command." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return runGameStateRequest(request, execute);
}
