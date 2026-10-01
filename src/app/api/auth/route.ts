import { randomUUID } from "node:crypto";
import { runGameStateRequest } from "@/src/lib/db/runtime";
import { NextResponse } from "next/server";
import { getGameState } from "@/src/lib/db";

async function execute(request: Request) {
  try {
    const { action, teamName, passcode } = await request.json();

    if (!teamName || !passcode) {
      return NextResponse.json({ error: "Team name and passcode are required." }, { status: 400 });
    }

    if (typeof passcode !== "string" || !/^[0-9]{4}$/.test(passcode)) {
      return NextResponse.json({ error: "PIN must contain exactly 4 digits." }, { status: 400 });
    }

    const cleanTeamName = teamName.trim();
    const state = getGameState();

    // Check if team exists
    const existingKey = Object.keys(state.teams).find(
      (k) => state.teams[k].teamName.toLowerCase() === cleanTeamName.toLowerCase()
    );

    if (action === "login") {
      if (!existingKey) {
        return NextResponse.json({ error: "Team not found. Please register first." }, { status: 404 });
      }
      const team = state.teams[existingKey];
      if (team.passcode !== passcode) {
        return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
      }
      return NextResponse.json({ success: true, team });
    }

    if (action === "register") {
      if (existingKey) {
        // If password matches, treat as login
        if (state.teams[existingKey].passcode === passcode) {
          return NextResponse.json({ success: true, team: state.teams[existingKey] });
        }
        return NextResponse.json({ error: "Team name already taken. Please choose another name." }, { status: 409 });
      }

      const newId = randomUUID();
      const newTeam = {
        id: newId,
        teamName: cleanTeamName,
        passcode,
        cashBalance: 100000,
        isFrozen: false,
        portfolio: {},
      };

      state.teams[newId] = newTeam;
      return NextResponse.json({ success: true, team: newTeam });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process authentication." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return runGameStateRequest(request, execute);
}
