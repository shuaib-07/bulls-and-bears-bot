# Running the classroom game on Vercel

The Next.js API routes run on Vercel Functions. Browsers submit orders; the server validates the login, simulation, trading window, balances, holdings, supply and administrator rules. Neon stores the shared game state and normalized teams, stocks, orders and audit records. No separate backend server or Neon function is required.

Set these server-only variables in Vercel Project Settings ? Environment Variables, then redeploy:

- `DATABASE_URL`: your Neon PostgreSQL connection string.
- `ADMIN_PIN`: a private host PIN. Local development defaults to 9988; the dashboard no longer pre-fills or publishes it.
- `SESSION_SECRET`: a long random secret shared across deployments. Without it, the database URL is used for signing team sessions; changing that URL then invalidates logins.

Do not prefix these variables with `NEXT_PUBLIC_`. Preview deployments should use a separate Neon branch/database so testing does not change the classroom game.

The deployed app refuses to use process memory if its database connection is missing. Database failures return an error instead of confirming an unsaved order. Schema additions are applied automatically on the first API request; `database.sql` also describes the updated schema.

All game changes commit through a versioned PostgreSQL transaction. Conflicting orders reload and revalidate before retrying. A purchase fills the full requested quantity or fails. Balances, float, orders and audit writes commit together. For this 10-team event, writes share one game revision; larger events may warrant finer-grained locks.

Reset creates a new simulation ID. Both reset choices clear transactions, orders, readiness, portfolios, final results and game settings. Keeping teams preserves names, rosters and PINs and resets cash to $100,000. Older simulation orders are rejected. Reset is deliberately destructive; the current implementation does not archive prior games.

Market-sale lock starts enabled, requiring two completed swaps per round. Accepted swaps count for both teams. Direct stock sales between teams are permanently disabled; pending direct offers are cancelled. Market commission starts enabled at 5%. Negotiated direct-sale prices are unavailable. Market purchases remain available whenever trading is open. News release does not advance rounds or apply price changes; use the separate market-shift step after closing trading.

`/demo` uses fictional data in the browser and never calls the game APIs. `/stage` polls the shared state, cycles news every three seconds, and shows the manual final-score reveal after the host freezes Round 5 scores.

Verification: TypeScript checks and seven transaction/game test suites pass. `tests/postgres-transactions.cjs` runs real Neon integration checks in a disposable schema after compiling tests with `tmp/audit-tsconfig.json`; it does not reset or change the live game.

Credential note: the existing repository tracked `.env`, and its original `.env.example` contained credentials. The example now uses placeholders and `.gitignore` excludes environment files. Ignore rules do not remove secrets from existing Git history; rotate the exposed database/storage credentials and remove them from history before publishing the repository.

Local production build verification is blocked by this environment failing to download Google Fonts. TypeScript and database tests pass, but a successful Vercel build and visual checks on small phones still need verification.
