import assert from "node:assert/strict";
import { POST } from "../src/app/api/auth/route";
import { getGameState, getInitialGameState } from "../src/lib/db";

async function run() {
  Object.assign(getGameState(), getInitialGameState());
  const request = (action: string, passcode: unknown) => POST(new Request("http://localhost/api/auth", {
    method: "POST", body: JSON.stringify({ action, teamName: "PIN Test", passcode }),
  }));
  for (const passcode of ["", "123", "12345", "12ab", " 1234", "1234 ", "１２３４", 1234, null]) {
    assert.equal((await request("register", passcode)).status, 400);
    assert.equal((await request("login", passcode)).status, 400);
  }
  assert.equal(Object.keys(getGameState().teams).length, 0);
  assert.equal((await request("register", "0007")).status, 200);
  assert.equal((await request("login", "0007")).status, 200);
  assert.equal((await request("login", "0008")).status, 401);
  console.log("PIN checks passed: exactly four numeric digits, leading zeros, and invalid input rejection.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
