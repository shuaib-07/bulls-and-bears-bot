import { adminPin } from "@/src/lib/session";
import { randomUUID } from "node:crypto";
import { runGameStateRequest } from "@/src/lib/db/runtime";
import { NextResponse } from "next/server";
import { getGameState, getInitialGameState } from "@/src/lib/db";
import { STOCKS_DATA, ROUNDS_DATA } from "@/src/lib/market-data";
import { snapshotFinalScores } from "@/src/lib/final-scores";



async function execute(request: Request) {
  try {
    const { pin, action, payload } = await request.json();

    if (pin !== adminPin()) {
      return NextResponse.json({ error: "Unauthorized: Invalid Admin PIN." }, { status: 401 });
    }

    if (action === "AUTHENTICATE") return NextResponse.json({ success: true });
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
      return NextResponse.json({ success: true, message: `Market-sale commission ${payload.enabled ? `set to ${percent}%` : "disabled"}. Share swaps are exempt.`, state });
    }

    if (action === "SET_NEGOTIATED_PRICES") {
      return NextResponse.json({ error: "Direct sales and negotiated sale prices are disabled." }, { status: 403 });
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

      return NextResponse.json({
        success: true,
        message: `Step 1 complete: News released for Round ${state.currentRound}! Intelligence is live; trading remains closed.`,
        state,
      });
    }

    if (action === "OPEN_TRADING") {
      const minutes = payload?.minutes ?? 10;
      if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) return NextResponse.json({ error: "Trading duration must be between 0 and 1440 minutes." }, { status: 400 });
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
      if (state.status === "TRADING_OPEN") return NextResponse.json({ error: "Close trading before applying market shifts." }, { status: 409 });
      state.priceUpdateBases ??= {};
      state.priceUpdateBases[state.currentRound] ??= { ...state.stockPrices };
      const roundNum = state.currentRound;
      const roundKey = `r${roundNum}` as keyof (typeof STOCKS_DATA)[0]["prices"];
      const roundChanges = state.customPriceShifts?.[roundNum] || ROUNDS_DATA.find((r) => r.round === roundNum)?.marketChanges || {};

      STOCKS_DATA.forEach((s) => {
        // If a custom percentage shift was set by the admin
        if (state.customPriceShifts?.[roundNum] && state.customPriceShifts[roundNum][s.ticker] !== undefined) {
          const shiftPct = state.customPriceShifts[roundNum][s.ticker];
          const currentPrice = state.priceUpdateBases![roundNum][s.ticker] || s.startingPrice;
          state.stockPrices[s.ticker] = Math.min(99999999.99, Math.max(1, parseFloat((currentPrice * (1 + shiftPct / 100)).toFixed(2))));
        } else if (s.prices[roundKey] !== undefined) {
          state.stockPrices[s.ticker] = s.prices[roundKey];
        }
      });

      return NextResponse.json({ success: true, message: `Market prices updated for Round ${state.currentRound}!`, state });
    }

    if (action === "UPDATE_CUSTOM_SCENARIO") {
      const { round, title, subtitle, newsStories } = payload;
      if (!Number.isInteger(round) || round < 0 || round > 5 || typeof title !== "string" || typeof subtitle !== "string" || !Array.isArray(newsStories) || newsStories.some((story) => !story || typeof story.headline !== "string" || !Number.isInteger(story.id))) return NextResponse.json({ error: "Choose a valid round, title, subtitle and news stories." }, { status: 400 });
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
      if (!Number.isInteger(round) || round < 0 || round > 5 || !shifts || typeof shifts !== "object" || Object.entries(shifts).some(([ticker, percent]) => !STOCKS_DATA.some((stock) => stock.ticker === ticker) || typeof percent !== "number" || !Number.isFinite(percent) || percent <= -100 || percent > 1000000)) return NextResponse.json({ error: "Choose a valid round, ticker and finite percentage greater than -100%." }, { status: 400 });
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
      const extraMinutes = payload?.minutes ?? 2;
      if (typeof extraMinutes !== "number" || !Number.isFinite(extraMinutes) || extraMinutes <= 0 || extraMinutes > 1440) return NextResponse.json({ error: "Timer extension must be between 0 and 1440 minutes." }, { status: 400 });
      if (state.status !== "TRADING_OPEN" || !state.tradingExpiresAt || state.tradingExpiresAt <= Date.now()) return NextResponse.json({ error: "Open trading before extending the timer." }, { status: 409 });
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
      const targetRound = payload?.round;
      if (!Number.isInteger(targetRound) || targetRound < 0 || targetRound > 5) return NextResponse.json({ error: "Choose a round from 0 to 5." }, { status: 400 });
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
          state.stockPrices[s.ticker] = Math.min(99999999.99, Math.max(1, parseFloat((currentPrice * (1 + shiftPct / 100)).toFixed(2))));
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
        state.priceUpdateBases ??= {};
        state.priceUpdateBases[state.currentRound] = { ...state.stockPrices };
        state.status = "SETUP";
        state.tradingExpiresAt = null;

        // If reaching round 2, auto activate expansion
        if (state.currentRound >= 2) {
          state.marketExpanded = true;
        }

        return NextResponse.json({
          success: true,
          message: `Advanced to Round ${state.currentRound}! New round intelligence ready; market shifts remain a separate step.`,
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
          state.stockFloats[ticker] = (state.stockFloats[ticker] || 0) + qty;

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

        team.cashBalance = Math.round((team.cashBalance + liquidationSum) * 100) / 100;
        team.portfolio = {};
      });

      state.status = "FINISHED";
      state.tradingExpiresAt = null;
      state.swaps.forEach((offer) => { if (offer.status === "PENDING") offer.status = "CANCELLED"; });
      state.directSellOffers.forEach((offer) => { if (offer.status === "PENDING") offer.status = "CANCELLED"; });
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
      if (typeof teamName !== "string" || !teamName.trim()) {
        return NextResponse.json({ error: "Team Name is required." }, { status: 400 });
      }

      if (Object.values(state.teams).some((team) => team.teamName.toLowerCase() === teamName.trim().toLowerCase())) return NextResponse.json({ error: "Team name is already registered." }, { status: 400 });
      if (passcode && (typeof passcode !== "string" || !/^\d{4}$/.test(passcode))) return NextResponse.json({ error: "PIN must contain four digits." }, { status: 400 });
      if (initialCash !== undefined && (!Number.isFinite(Number(initialCash)) || Number(initialCash) < 0 || Number(initialCash) > 9999999999.99)) return NextResponse.json({ error: "Initial cash must be a valid non-negative amount." }, { status: 400 });
      const teamId = randomUUID();
      const generatedPasscode = passcode && passcode.trim() ? passcode.trim() : Math.floor(1000 + Math.random() * 9000).toString();

      state.teams[teamId] = {
        id: teamId,
        teamName: teamName.trim(),
        passcode: generatedPasscode,
        cashBalance: initialCash === undefined ? 100000 : Math.round(Number(initialCash) * 100) / 100,
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

      if (teamName !== undefined && (typeof teamName !== "string" || !teamName.trim() || Object.values(state.teams).some((team) => team.id !== teamId && team.teamName.toLowerCase() === teamName.trim().toLowerCase()))) return NextResponse.json({ error: "Choose a unique, non-empty team name." }, { status: 400 });
      if (passcode && (typeof passcode !== "string" || !/^\d{4}$/.test(passcode))) return NextResponse.json({ error: "PIN must contain four digits." }, { status: 400 });
      if (cashBalance !== undefined && (!Number.isFinite(Number(cashBalance)) || Number(cashBalance) < 0 || Number(cashBalance) > 9999999999.99)) return NextResponse.json({ error: "Cash must be a valid non-negative amount." }, { status: 400 });
      if (teamName && teamName.trim()) state.teams[teamId].teamName = teamName.trim();
      if (passcode && passcode.trim()) state.teams[teamId].passcode = passcode.trim();
      if (cashBalance !== undefined && !isNaN(Number(cashBalance))) state.teams[teamId].cashBalance = Math.round(Number(cashBalance) * 100) / 100;
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
      const names = new Set(Object.values(state.teams).map((team) => team.teamName.toLowerCase()));
      for (const team of teams) {
        if (typeof team?.teamName !== "string" || !team.teamName.trim() || names.has(team.teamName.trim().toLowerCase()) || (team.passcode && (typeof team.passcode !== "string" || !/^\d{4}$/.test(team.passcode))) || (team.cashBalance !== undefined && (!Number.isFinite(Number(team.cashBalance)) || Number(team.cashBalance) < 0 || Number(team.cashBalance) > 9999999999.99))) return NextResponse.json({ error: "Import requires unique team names, four-digit PINs and valid non-negative cash amounts. No teams were imported." }, { status: 400 });
        names.add(team.teamName.trim().toLowerCase());
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
          cashBalance: t.cashBalance === undefined ? 100000 : Math.round(Number(t.cashBalance) * 100) / 100,
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
        const next = state.teams[teamId].cashBalance + Number(cashDelta);
        if (!Number.isFinite(next) || next < 0 || next > 9999999999.99) return NextResponse.json({ error: "Adjustment would produce an invalid cash balance." }, { status: 400 });
        state.teams[teamId].cashBalance = Math.round(next * 100) / 100;
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
