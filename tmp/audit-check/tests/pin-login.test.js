"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const route_1 = require("../src/app/api/auth/route");
const db_1 = require("../src/lib/db");
async function run() {
    Object.assign((0, db_1.getGameState)(), (0, db_1.getInitialGameState)());
    const request = (action, passcode) => (0, route_1.POST)(new Request("http://localhost/api/auth", {
        method: "POST", body: JSON.stringify({ action, teamName: "PIN Test", passcode }),
    }));
    for (const passcode of ["", "123", "12345", "12ab", " 1234", "1234 ", "１２３４", 1234, null]) {
        strict_1.default.equal((await request("register", passcode)).status, 400);
        strict_1.default.equal((await request("login", passcode)).status, 400);
    }
    strict_1.default.equal(Object.keys((0, db_1.getGameState)().teams).length, 0);
    strict_1.default.equal((await request("register", "0007")).status, 200);
    strict_1.default.equal((await request("login", "0007")).status, 200);
    strict_1.default.equal((await request("login", "0008")).status, 401);
    console.log("PIN checks passed: exactly four numeric digits, leading zeros, and invalid input rejection.");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
