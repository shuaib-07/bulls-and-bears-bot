import { createHmac, timingSafeEqual } from "node:crypto";
import type { MemoryTeam } from "./db";

export const adminPin = () => process.env.ADMIN_PIN || "9988";
const secret = () => process.env.SESSION_SECRET || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "local-development-only";
export const sessionsRequired = () => Boolean(process.env.SESSION_SECRET || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);
const signature = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");
export function teamSession(team: MemoryTeam) {
  const payload = Buffer.from(JSON.stringify({ id: team.id, credentials: signature(team.passcode), expires: Date.now() + 12 * 60 * 60 * 1000 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function isTeamAuthenticated(request: Request, team: MemoryTeam | undefined) {
  if (!sessionsRequired()) return true; // Zero-config local development and isolated unit tests.
  if (!team) return false;
  try {
    const token = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("bb_team="))?.slice(8);
    if (!token) return false;
    const [payload, provided] = token.split(".");
    const expected = signature(payload);
    if (!provided || provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return false;
    const value = JSON.parse(Buffer.from(payload, "base64url").toString());
    return value.id === team.id && value.credentials === signature(team.passcode) && value.expires > Date.now();
  } catch { return false; }
}
