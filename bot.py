import os
import sqlite3
import discord
from discord import app_commands
from discord.ext import commands

# ----------------- CONFIGURATION & MASTER DATA -----------------
TOKEN = os.getenv("DISCORD_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
GUILD_ID = int(os.getenv("DISCORD_GUILD_ID", "0"))  # Optional: For instant slash command sync

STARTING_CASH = 100000.0
MARKET_CAP_FLOAT = 100

INITIAL_STOCKS = {
    "AAPL": 225.0, "MSFT": 500.0, "NVDA": 180.0, "AMZN": 230.0, "GOOGL": 250.0,
    "META": 600.0, "TSLA": 400.0, "JPM": 300.0,  "GS": 700.0,   "XOM": 120.0,
    "CVX": 160.0,  "CAT": 450.0,  "BA": 200.0,   "WMT": 105.0,  "KO": 80.0,
    "NKE": 75.0,   "UNH": 300.0,  "PFE": 30.0,   "V": 350.0,    "AMD": 170.0
}

EXPANSION_STOCKS = {
    "TSM": 200.0,  "AVGO": 300.0, "ORCL": 250.0, "NFLX": 1100.0, "LMT": 550.0,
    "GE": 300.0,   "COP": 100.0,  "MCD": 330.0,  "DIS": 120.0,   "LIN": 500.0
}

ROUND_PRICES = {
    0: {
        "AAPL": 236.25, "MSFT": 520.00, "NVDA": 196.20, "AMZN": 239.20, "GOOGL": 240.00,
        "META": 642.00, "TSLA": 376.00, "JPM": 312.00, "GS": 721.00, "XOM": 128.40,
        "CVX": 169.60, "CAT": 472.50, "BA": 186.00, "WMT": 109.20, "KO": 82.40,
        "NKE": 72.00, "UNH": 318.00, "PFE": 28.20, "V": 367.50, "AMD": 187.00
    },
    1: {
        "AAPL": 259.88, "MSFT": 592.80, "NVDA": 243.29, "AMZN": 260.73, "GOOGL": 276.00,
        "META": 757.56, "TSLA": 323.36, "JPM": 287.04, "GS": 648.90, "XOM": 112.99,
        "CVX": 152.64, "CAT": 529.20, "BA": 204.60, "WMT": 115.75, "KO": 85.70,
        "NKE": 77.76, "UNH": 298.92, "PFE": 25.94, "V": 393.23, "AMD": 235.62
    },
    2: {
        "AAPL": 218.30, "MSFT": 515.74, "NVDA": 184.90, "AMZN": 232.05, "GOOGL": 220.80,
        "META": 568.17, "TSLA": 381.56, "JPM": 350.19, "GS": 811.12, "XOM": 144.63,
        "CVX": 189.27, "CAT": 465.70, "BA": 173.91, "WMT": 109.96, "KO": 80.56,
        "NKE": 69.21, "UNH": 358.70, "PFE": 31.65, "V": 448.28, "AMD": 172.00,
        "TSM": 200.00, "AVGO": 300.00, "ORCL": 250.00, "NFLX": 1100.00, "LMT": 550.00,
        "GE": 300.00, "COP": 100.00, "MCD": 330.00, "DIS": 120.00, "LIN": 500.00
    },
    3: {
        "AAPL": 244.50, "MSFT": 603.42, "NVDA": 240.37, "AMZN": 264.54, "GOOGL": 269.38,
        "META": 710.21, "TSLA": 312.88, "JPM": 308.17, "GS": 689.45, "XOM": 121.49,
        "CVX": 162.77, "CAT": 558.84, "BA": 215.65, "WMT": 117.66, "KO": 84.59,
        "NKE": 76.82, "UNH": 394.57, "PFE": 35.76, "V": 502.07, "AMD": 223.60,
        "TSM": 254.00, "AVGO": 372.00, "ORCL": 290.00, "NFLX": 1243.00, "LMT": 649.00,
        "GE": 366.00, "COP": 85.00, "MCD": 353.10, "DIS": 136.80, "LIN": 600.00
    },
    4: {
        "AAPL": 207.82, "MSFT": 494.80, "NVDA": 168.26, "AMZN": 222.21, "GOOGL": 210.12,
        "META": 539.76, "TSLA": 391.10, "JPM": 400.62, "GS": 882.50, "XOM": 136.07,
        "CVX": 185.56, "CAT": 447.07, "BA": 161.74, "WMT": 127.07, "KO": 89.67,
        "NKE": 65.30, "UNH": 347.22, "PFE": 30.75, "V": 602.48, "AMD": 160.99,
        "TSM": 190.50, "AVGO": 290.16, "ORCL": 246.50, "NFLX": 1019.26, "LMT": 791.78,
        "GE": 307.44, "COP": 100.30, "MCD": 384.88, "DIS": 109.44, "LIN": 522.00
    },
    5: {
        "AAPL": 249.38, "MSFT": 583.86, "NVDA": 218.74, "AMZN": 259.99, "GOOGL": 262.65,
        "META": 658.51, "TSLA": 293.33, "JPM": 320.50, "GS": 688.35, "XOM": 111.58,
        "CVX": 148.45, "CAT": 572.25, "BA": 210.26, "WMT": 120.72, "KO": 86.08,
        "NKE": 75.09, "UNH": 416.66, "PFE": 38.44, "V": 530.18, "AMD": 209.29,
        "TSM": 247.65, "AVGO": 368.50, "ORCL": 295.80, "NFLX": 1243.50, "LMT": 989.72,
        "GE": 381.23, "COP": 80.24, "MCD": 423.37, "DIS": 131.33, "LIN": 657.72
    }
}

NEWS_FLASHES = {
    0: (
        "**ROUND 0 - THE OPENING BELL**\n"
        "1. Tech majors plan computing infrastructure expansion.\n"
        "2. Global consumer confidence beats projections.\n"
        "3. International route disruptions create oil market uncertainty.\n"
        "4. Commercial airlines alter fleet procurement strategy.\n"
        "5. Cross-border digital payment volumes strike new records.\n"
        "6. Preventative healthcare service demand escalates."
    ),
    1: (
        "**ROUND 1 - THE TECH SURGE**\n"
        "1. Critical semiconductor shortages spur multi-year supply pacts.\n"
        "2. Cloud giants unveil expansive AI data center builds in US & Asia.\n"
        "3. Online marketing budgets push digital advertising higher.\n"
        "4. Auto incentives pull-back strains electric mobility outlook.\n"
        "5. Retailers report stronger-than-expected e-commerce spending.\n"
        "6. Younger demographics pivot heavily toward premium sportswear."
    ),
    2: (
        "**ROUND 2 - THE SHOCK**\n"
        "1. Geopolitical escalations lift crude energy benchmarks.\n"
        "2. Central bank signals high interest rates will linger indefinitely.\n"
        "3. Material price inflation delays large infrastructure initiatives.\n"
        "4. Fuel and logistics overhead threaten airline balance sheets.\n"
        "5. Preventative medical screenings see industry-wide surges.\n"
        "6. Automotive assembly halts across key assembly corridors.\n\n"
        "🚨 **MARKET EXPANSION**: 10 New Equities Added: TSM, AVGO, ORCL, NFLX, LMT, GE, COP, MCD, DIS, LIN!"
    ),
    3: (
        "**ROUND 3 - THE INFRASTRUCTURE RACE**\n"
        "1. Multi-gigawatt data center developments break ground globally.\n"
        "2. Governments launch multi-billion domestic wafer foundry subsidies.\n"
        "3. Digital ad expenditure establishes all-time quarterly records.\n"
        "4. Public infrastructure acceleration bills inject urgent capital.\n"
        "5. Clean utility policies mandate aggressive renewable deployment.\n"
        "6. Hospital systems log unprecedented therapeutic and screening volumes."
    ),
    4: (
        "**ROUND 4 - THE RATE RESET**\n"
        "1. Shock macro prints overturn consensus interest rate expectations.\n"
        "2. Household retail spending demonstrates resilience against rates.\n"
        "3. Tough antitrust compliance imposed on mega-cap platforms.\n"
        "4. Industrial raw-material demand cools across major ports.\n"
        "5. Drug pricing caps introduce regulatory margin friction.\n"
        "6. Global borderless e-commerce transitions deeper onto card networks."
    ),
    5: (
        "**ROUND 5 - THE FINAL MOVE**\n"
        "1. Hyperscale enterprise AI compute allocations triple.\n"
        "2. High-performance computing foundries run at 100% capacity.\n"
        "3. Multi-national defence budgets elevated across alliances.\n"
        "4. Crude inventory builds send energy commodities tumbling.\n"
        "5. Home streaming engagement touches post-pandemic heights.\n"
        "6. Physical construction begins on global transport corridors."
    )
}

# ----------------- DATABASE MANAGEMENT -----------------
DB_FILE = "sim.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS teams (
            user_id INTEGER PRIMARY KEY,
            team_name TEXT UNIQUE,
            cash REAL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS holdings (
            user_id INTEGER,
            ticker TEXT,
            quantity INTEGER,
            PRIMARY KEY(user_id, ticker)
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS stocks (
            ticker TEXT PRIMARY KEY,
            current_price REAL,
            float_available INTEGER,
            is_active INTEGER
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS game_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            current_round INTEGER,
            trading_open INTEGER
        )
    """)
    conn.commit()
    conn.close()

def reset_market_to_r0():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM stocks")
    for ticker, price in INITIAL_STOCKS.items():
        c.execute("INSERT INTO stocks VALUES (?, ?, ?, ?)", (ticker, price, MARKET_CAP_FLOAT, 1))
    for ticker, price in EXPANSION_STOCKS.items():
        c.execute("INSERT INTO stocks VALUES (?, ?, ?, ?)", (ticker, price, MARKET_CAP_FLOAT, 0))
    c.execute("INSERT OR REPLACE INTO game_state (id, current_round, trading_open) VALUES (1, -1, 0)")
    conn.commit()
    conn.close()

# ----------------- DISCORD BOT SETUP -----------------
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# ----------------- INTERACTIVE SWAP BUTTON VIEW -----------------
class SwapConfirmView(discord.ui.View):
    def __init__(self, sender: discord.Member, target: discord.Member, give_tkr: str, give_qty: int, recv_tkr: str, recv_qty: int):
        super().__init__(timeout=90)
        self.sender = sender
        self.target = target
        self.give_tkr = give_tkr
        self.give_qty = give_qty
        self.recv_tkr = recv_tkr
        self.recv_qty = recv_qty

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.target.id:
            await interaction.response.send_message("Only the proposed trade partner can accept or decline this offer.", ephemeral=True)
            return False
        return True

    @discord.ui.button(label="Accept Swap", style=discord.ButtonStyle.success)
    async def accept_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        # Check trading status
        c.execute("SELECT trading_open FROM game_state WHERE id = 1")
        row = c.fetchone()
        if not row or row[0] == 0:
            await interaction.response.send_message("❌ Trading is currently closed.", ephemeral=True)
            conn.close()
            return

        # Check sender holdings
        c.execute("SELECT quantity FROM holdings WHERE user_id = ? AND ticker = ?", (self.sender.id, self.give_tkr))
        s_hold = c.fetchone()
        s_qty = s_hold[0] if s_hold else 0

        # Check receiver holdings
        c.execute("SELECT quantity FROM holdings WHERE user_id = ? AND ticker = ?", (self.target.id, self.recv_tkr))
        t_hold = c.fetchone()
        t_qty = t_hold[0] if t_hold else 0

        if s_qty < self.give_qty:
            await interaction.response.send_message(f"❌ {self.sender.display_name} no longer holds {self.give_qty} {self.give_tkr}.", ephemeral=False)
            conn.close()
            return
        if t_qty < self.recv_qty:
            await interaction.response.send_message(f"❌ You do not have {self.recv_qty} {self.recv_tkr} to trade.", ephemeral=True)
            conn.close()
            return

        # Execute exchange
        c.execute("UPDATE holdings SET quantity = quantity - ? WHERE user_id = ? AND ticker = ?", (self.give_qty, self.sender.id, self.give_tkr))
        c.execute("INSERT INTO holdings (user_id, ticker, quantity) VALUES (?, ?, ?) ON CONFLICT(user_id, ticker) DO UPDATE SET quantity = quantity + ?", (self.target.id, self.give_tkr, self.give_qty, self.give_qty))

        c.execute("UPDATE holdings SET quantity = quantity - ? WHERE user_id = ? AND ticker = ?", (self.recv_qty, self.target.id, self.recv_tkr))
        c.execute("INSERT INTO holdings (user_id, ticker, quantity) VALUES (?, ?, ?) ON CONFLICT(user_id, ticker) DO UPDATE SET quantity = quantity + ?", (self.sender.id, self.recv_tkr, self.recv_qty, self.recv_qty))

        conn.commit()
        conn.close()

        for child in self.children:
            child.disabled = True
        await interaction.response.edit_message(content=f"✅ **Trade Completed!**\n{self.sender.mention} gave {self.give_qty} {self.give_tkr} for {self.target.mention}'s {self.recv_qty} {self.recv_tkr}.", view=self)

    @discord.ui.button(label="Decline", style=discord.ButtonStyle.danger)
    async def decline_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        for child in self.children:
            child.disabled = True
        await interaction.response.edit_message(content=f"❌ Trade offer rejected by {self.target.mention}.", view=self)

# ----------------- PLAYER COMMANDS -----------------
@bot.tree.command(name="register", description="Register your team account with $100,000 cash.")
@app_commands.describe(team_name="Your team's official name")
async def register(interaction: discord.Interaction, team_name: str):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO teams VALUES (?, ?, ?)", (interaction.user.id, team_name.strip(), STARTING_CASH))
        conn.commit()
        await interaction.response.send_message(f"✅ Team **{team_name}** successfully registered with **$100,000.00** virtual cash.")
    except sqlite3.IntegrityError:
        await interaction.response.send_message("❌ This Discord account or team name is already registered.", ephemeral=True)
    finally:
        conn.close()

@bot.tree.command(name="portfolio", description="View your cash balance, stock holdings, and total valuation.")
async def portfolio(interaction: discord.Interaction):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT team_name, cash FROM teams WHERE user_id = ?", (interaction.user.id,))
    user = c.fetchone()
    if not user:
        await interaction.response.send_message("❌ You are not registered yet. Use `/register` first.", ephemeral=True)
        conn.close()
        return

    team_name, cash = user
    c.execute("""
        SELECT h.ticker, h.quantity, s.current_price
        FROM holdings h
        JOIN stocks s ON h.ticker = s.ticker
        WHERE h.user_id = ? AND h.quantity > 0
    """, (interaction.user.id,))
    rows = c.fetchall()

    holdings_val = 0.0
    lines = []
    for tkr, qty, price in rows:
        val = qty * price
        holdings_val += val
        lines.append(f"• **{tkr}**: {qty} shares @ ${price:,.2f} =${val:,.2f}")

    total_val = cash + holdings_val
    p_l = total_val - STARTING_CASH

    embed = discord.Embed(title=f"📊 Portfolio: {team_name}", color=0x2b2d31)
    embed.add_field(name="Available Cash", value=f"${cash:,.2f}", inline=True)
    embed.add_field(name="Holdings Value", value=f"${holdings_val:,.2f}", inline=True)
    embed.add_field(name="Total Net Worth", value=f"**${total_val:,.2f}** ({'+' if p_l >= 0 else ''}${p_l:,.2f})", inline=False)
    embed.add_field(name="Current Positions", value="\n".join(lines) if lines else "*No active shares*", inline=False)

    await interaction.response.send_message(embed=embed)
    conn.close()

@bot.tree.command(name="market", description="View available stock prices and market float.")
async def market(interaction: discord.Interaction):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT ticker, current_price, float_available FROM stocks WHERE is_active = 1 ORDER BY ticker ASC")
    rows = c.fetchall()
    conn.close()

    lines = [f"`{tkr:<5}` | Price: **${price:>7.2f}** | Available Float: **{flt:>3}/100**" for tkr, price, flt in rows]
    embed = discord.Embed(title="📈 Live Market Board", description="\n".join(lines), color=0x3498db)
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="buy", description="Purchase shares from the open market.")
@app_commands.describe(ticker="Stock ticker symbol", shares="Quantity of shares to buy")
async def buy(interaction: discord.Interaction, ticker: str, shares: int):
    ticker = ticker.upper().strip()
    if shares <= 0:
        await interaction.response.send_message("❌ Quantity must be greater than zero.", ephemeral=True)
        return

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute("SELECT trading_open FROM game_state WHERE id = 1")
    state = c.fetchone()
    if not state or state[0] == 0:
        await interaction.response.send_message("❌ The trading window is currently closed.", ephemeral=True)
        conn.close()
        return

    c.execute("SELECT current_price, float_available, is_active FROM stocks WHERE ticker = ?", (ticker,))
    stk = c.fetchone()
    if not stk or stk[2] == 0:
        await interaction.response.send_message(f"❌ Ticker `{ticker}` is not tradable.", ephemeral=True)
        conn.close()
        return

    price, available, _ = stk
    if shares > available:
        await interaction.response.send_message(f"❌ Only **{available}** shares of `{ticker}` remain in the market.", ephemeral=True)
        conn.close()
        return

    total_cost = price * shares
    c.execute("SELECT cash FROM teams WHERE user_id = ?", (interaction.user.id,))
    team = c.fetchone()
    if not team:
        await interaction.response.send_message("❌ You are not registered.", ephemeral=True)
        conn.close()
        return

    cash = team[0]
    if cash < total_cost:
        await interaction.response.send_message(f"❌ Insufficient cash. Required: **${total_cost:,.2f}** \vert{} Available: **${cash:,.2f}**", ephemeral=True)
        conn.close()
        return

    # Execute Buy
    c.execute("UPDATE teams SET cash = cash - ? WHERE user_id = ?", (total_cost, interaction.user.id))
    c.execute("UPDATE stocks SET float_available = float_available - ? WHERE ticker = ?", (shares, ticker))
    c.execute("INSERT INTO holdings (user_id, ticker, quantity) VALUES (?, ?, ?) ON CONFLICT(user_id, ticker) DO UPDATE SET quantity = quantity + ?", (interaction.user.id, ticker, shares, shares))

    conn.commit()
    conn.close()
    await interaction.response.send_message(f"✅ **BUY ORDER FILLED**: {interaction.user.mention} bought **{shares} {ticker}** @ ${price:,.2f} for **${total_cost:,.2f}**.")

@bot.tree.command(name="sell", description="Sell owned shares back to the open market.")
@app_commands.describe(ticker="Stock ticker symbol", shares="Quantity of shares to sell")
async def sell(interaction: discord.Interaction, ticker: str, shares: int):
    ticker = ticker.upper().strip()
    if shares <= 0:
        await interaction.response.send_message("❌ Quantity must be greater than zero.", ephemeral=True)
        return

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute("SELECT trading_open FROM game_state WHERE id = 1")
    state = c.fetchone()
    if not state or state[0] == 0:
        await interaction.response.send_message("❌ The trading window is currently closed.", ephemeral=True)
        conn.close()
        return

    c.execute("SELECT quantity FROM holdings WHERE user_id = ? AND ticker = ?", (interaction.user.id, ticker))
    h = c.fetchone()
    owned = h[0] if h else 0
    if owned < shares:
        await interaction.response.send_message(f"❌ You only own **{owned}** shares of `{ticker}`.", ephemeral=True)
        conn.close()
        return

    c.execute("SELECT current_price FROM stocks WHERE ticker = ?", (ticker,))
    stk = c.fetchone()
    price = stk[0]
    total_proceeds = price * shares

    # Execute Sell
    c.execute("UPDATE holdings SET quantity = quantity - ? WHERE user_id = ? AND ticker = ?", (shares, interaction.user.id, ticker))
    c.execute("UPDATE stocks SET float_available = float_available + ? WHERE ticker = ?", (shares, ticker))
    c.execute("UPDATE teams SET cash = cash + ? WHERE user_id = ?", (total_proceeds, interaction.user.id))

    conn.commit()
    conn.close()
    await interaction.response.send_message(f"✅ **SELL ORDER FILLED**: {interaction.user.mention} sold **{shares} {ticker}** @ ${price:,.2f} for **${total_proceeds:,.2f}**.")

@bot.tree.command(name="swap", description="Propose a stock-for-stock swap with another team.")
@app_commands.describe(
    target="The user you are trading with",
    give_ticker="Stock ticker you give",
    give_shares="Quantity you give",
    receive_ticker="Stock ticker you receive",
    receive_shares="Quantity you receive"
)
async def swap(interaction: discord.Interaction, target: discord.Member, give_ticker: str, give_shares: int, receive_ticker: str, receive_shares: int):
    give_ticker = give_ticker.upper().strip()
    receive_ticker = receive_ticker.upper().strip()

    if target.id == interaction.user.id:
        await interaction.response.send_message("❌ You cannot swap stocks with yourself.", ephemeral=True)
        return
    if give_shares <= 0 or receive_shares <= 0:
        await interaction.response.send_message("❌ Share quantities must be greater than zero.", ephemeral=True)
        return

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute("SELECT trading_open FROM game_state WHERE id = 1")
    state = c.fetchone()
    if not state or state[0] == 0:
        await interaction.response.send_message("❌ The trading window is currently closed.", ephemeral=True)
        conn.close()
        return

    c.execute("SELECT quantity FROM holdings WHERE user_id = ? AND ticker = ?", (interaction.user.id, give_ticker))
    s_hold = c.fetchone()
    if not s_hold or s_hold[0] < give_shares:
        await interaction.response.send_message(f"❌ You do not own {give_shares} shares of `{give_ticker}`.", ephemeral=True)
        conn.close()
        return

    c.execute("SELECT quantity FROM holdings WHERE user_id = ? AND ticker = ?", (target.id, receive_ticker))
    t_hold = c.fetchone()
    if not t_hold or t_hold[0] < receive_shares:
        await interaction.response.send_message(f"❌ {target.display_name} does not hold {receive_shares} shares of `{receive_ticker}`.", ephemeral=True)
        conn.close()
        return

    conn.close()

    embed = discord.Embed(title="🤝 Proposed Stock Swap", color=0xf1c40f)
    embed.description = (
        f"{interaction.user.mention} offers: **{give_shares} {give_ticker}**\n"
        f"In exchange for {target.mention}'s: **{receive_shares} {receive_ticker}**\n\n"
        f"{target.mention}, click below to confirm or decline."
    )
    view = SwapConfirmView(interaction.user, target, give_ticker, give_shares, receive_ticker, receive_shares)
    await interaction.response.send_message(embed=embed, view=view)

# ----------------- ADMIN COMMANDS -----------------
admin_group = app_commands.Group(name="admin", description="Organizer controls", default_permissions=discord.Permissions(administrator=True))

@admin_group.command(name="reset_game", description="Reset all market stocks and portfolios back to Round 0.")
async def reset_game(interaction: discord.Interaction):
    reset_market_to_r0()
    await interaction.response.send_message("🚨 **Game Reset Complete**. Stock float is 100 per stock, round set to R0.")

@admin_group.command(name="start_round", description="Advance to a round (0 to 5), release news, and unlock trading.")
@app_commands.describe(round_number="Round number from 0 to 5")
async def start_round(interaction: discord.Interaction, round_number: int):
    if round_number not in ROUND_PRICES:
        await interaction.response.send_message("❌ Round must be an integer between 0 and 5.", ephemeral=True)
        return

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("UPDATE game_state SET current_round = ?, trading_open = 1 WHERE id = 1", (round_number,))
    
    # If Round 2 or later, activate the 10 expansion stocks
    if round_number >= 2:
        c.execute("UPDATE stocks SET is_active = 1 WHERE ticker IN ({})".format(','.join('?'*len(EXPANSION_STOCKS))), list(EXPANSION_STOCKS.keys()))

    conn.commit()
    conn.close()

    news_text = NEWS_FLASHES.get(round_number, "No news flash available.")
    news_channel = discord.utils.get(interaction.guild.text_channels, name="news-flash")
    if news_channel:
        await news_channel.send(f"📢 @everyone\n\n{news_text}")

    await interaction.response.send_message(f"🟢 **Round {round_number} Opened**. Trading is now ACTIVE for 10 minutes.")

@admin_group.command(name="close_trading", description="Lock trading immediately.")
async def close_trading(interaction: discord.Interaction):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("UPDATE game_state SET trading_open = 0 WHERE id = 1")
    conn.commit()
    conn.close()
    await interaction.response.send_message("🔴 **Trading Window Closed**. No further buys, sells, or swaps can be executed.")

@admin_group.command(name="apply_round_prices", description="Update market prices based on master sheet.")
async def apply_round_prices(interaction: discord.Interaction):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT current_round FROM game_state WHERE id = 1")
    r = c.fetchone()[0]

    if r not in ROUND_PRICES:
        await interaction.response.send_message("❌ Invalid or inactive round.", ephemeral=True)
        conn.close()
        return

    price_map = ROUND_PRICES[r]
    for ticker, new_price in price_map.items():
        c.execute("UPDATE stocks SET current_price = ? WHERE ticker = ?", (new_price, ticker))

    conn.commit()
    conn.close()

    market_channel = discord.utils.get(interaction.guild.text_channels, name="market-board")
    if market_channel:
        await market_channel.send(f"📊 **Prices have updated for Round {r}!** Check `/market` for latest values.")

    await interaction.response.send_message(f"✅ Market prices updated to Round {r} levels.")

@admin_group.command(name="liquidate", description="Liquidate all team shares at current prices and compute final scores.")
async def liquidate(interaction: discord.Interaction):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("UPDATE game_state SET trading_open = 0 WHERE id = 1")

    # Get all holdings
    c.execute("""
        SELECT h.user_id, h.quantity, s.current_price
        FROM holdings h
        JOIN stocks s ON h.ticker = s.ticker
        WHERE h.quantity > 0
    """)
    rows = c.fetchall()

    for uid, qty, price in rows:
        proceeds = qty * price
        c.execute("UPDATE teams SET cash = cash + ? WHERE user_id = ?", (proceeds, uid))

    c.execute("DELETE FROM holdings")
    conn.commit()

    # Generate final leaderboard
    c.execute("SELECT team_name, cash FROM teams ORDER BY cash DESC")
    standings = c.fetchall()
    conn.close()

    lines = []
    for idx, (team, final_cash) in enumerate(standings, 1):
        profit = final_cash - STARTING_CASH
        lines.append(f"**#{idx} {team}**: ${final_cash:,.2f} ({'+' if profit >= 0 else ''}${profit:,.2f})")

    embed = discord.Embed(title="🏆 FINAL LIQUIDATION & RESULTS", description="\n".join(lines), color=0x2ecc71)
    await interaction.response.send_message(embed=embed)

bot.tree.add_command(admin_group)

# ----------------- BOT LIFECYCLE -----------------
@bot.event
async def on_ready():
    init_db()
    if GUILD_ID:
        guild = discord.Object(id=GUILD_ID)
        bot.tree.copy_global_to(guild=guild)
        await bot.tree.sync(guild=guild)
    else:
        await bot.tree.sync()
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")

if __name__ == "__main__":
    bot.run(TOKEN)