"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionsRequired = exports.adminPin = void 0;
exports.teamSession = teamSession;
exports.isTeamAuthenticated = isTeamAuthenticated;
const node_crypto_1 = require("node:crypto");
const adminPin = () => process.env.ADMIN_PIN || "9988";
exports.adminPin = adminPin;
const secret = () => process.env.SESSION_SECRET || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "local-development-only";
const sessionsRequired = () => Boolean(process.env.SESSION_SECRET || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);
exports.sessionsRequired = sessionsRequired;
const signature = (value) => (0, node_crypto_1.createHmac)("sha256", secret()).update(value).digest("base64url");
function teamSession(team) {
    const payload = Buffer.from(JSON.stringify({ id: team.id, credentials: signature(team.passcode), expires: Date.now() + 12 * 60 * 60 * 1000 })).toString("base64url");
    return `${payload}.${signature(payload)}`;
}
function isTeamAuthenticated(request, team) {
    if (!(0, exports.sessionsRequired)())
        return true; // Zero-config local development and isolated unit tests.
    if (!team)
        return false;
    try {
        const token = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("bb_team="))?.slice(8);
        if (!token)
            return false;
        const [payload, provided] = token.split(".");
        const expected = signature(payload);
        if (!provided || provided.length !== expected.length || !(0, node_crypto_1.timingSafeEqual)(Buffer.from(provided), Buffer.from(expected)))
            return false;
        const value = JSON.parse(Buffer.from(payload, "base64url").toString());
        return value.id === team.id && value.credentials === signature(team.passcode) && value.expires > Date.now();
    }
    catch {
        return false;
    }
}
