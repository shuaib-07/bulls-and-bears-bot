"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const db_1 = require("@/src/lib/db");
async function POST(request) {
    try {
        const { action, teamName, passcode } = await request.json();
        if (!teamName || !passcode) {
            return server_1.NextResponse.json({ error: "Team name and passcode are required." }, { status: 400 });
        }
        if (typeof passcode !== "string" || !/^[0-9]{4}$/.test(passcode)) {
            return server_1.NextResponse.json({ error: "PIN must contain exactly 4 digits." }, { status: 400 });
        }
        const cleanTeamName = teamName.trim();
        const state = (0, db_1.getGameState)();
        // Check if team exists
        const existingKey = Object.keys(state.teams).find((k) => state.teams[k].teamName.toLowerCase() === cleanTeamName.toLowerCase());
        if (action === "login") {
            if (!existingKey) {
                return server_1.NextResponse.json({ error: "Team not found. Please register first." }, { status: 404 });
            }
            const team = state.teams[existingKey];
            if (team.passcode !== passcode) {
                return server_1.NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
            }
            return server_1.NextResponse.json({ success: true, team });
        }
        if (action === "register") {
            if (existingKey) {
                // If password matches, treat as login
                if (state.teams[existingKey].passcode === passcode) {
                    return server_1.NextResponse.json({ success: true, team: state.teams[existingKey] });
                }
                return server_1.NextResponse.json({ error: "Team name already taken. Please choose another name." }, { status: 409 });
            }
            const newId = `team-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const newTeam = {
                id: newId,
                teamName: cleanTeamName,
                passcode,
                cashBalance: 100000,
                isFrozen: false,
                portfolio: {},
            };
            state.teams[newId] = newTeam;
            return server_1.NextResponse.json({ success: true, team: newTeam });
        }
        return server_1.NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: "Failed to process authentication." }, { status: 500 });
    }
}
