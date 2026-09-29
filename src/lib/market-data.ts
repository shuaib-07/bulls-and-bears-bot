export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  startingPrice: number;
  entryRound: number; // 0 for initial 20, 2 for expansion 10
  prices: {
    start: number;
    r0: number;
    r1: number;
    r2: number;
    r3: number;
    r4: number;
    r5: number;
  };
}

export interface NewsStory {
  id: number;
  headline: string;
  sector: string;
  clueSummary: string;
}

export interface RoundInfo {
  round: number;
  title: string;
  subtitle: string;
  durationMinutes: number;
  newsStories: NewsStory[];
  marketChanges: Record<string, number>; // ticker -> percent change e.g. +10, -15
}

export const STOCKS_DATA: Stock[] = [
  // --- Initial 20 Stocks (Active from Round 0) ---
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    startingPrice: 225.0,
    entryRound: 0,
    prices: { start: 225.0, r0: 236.25, r1: 259.88, r2: 218.3, r3: 244.5, r4: 207.82, r5: 249.38 },
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    sector: "Technology",
    startingPrice: 500.0,
    entryRound: 0,
    prices: { start: 500.0, r0: 520.0, r1: 592.8, r2: 515.74, r3: 603.42, r4: 494.8, r5: 583.86 },
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Semiconductors",
    startingPrice: 180.0,
    entryRound: 0,
    prices: { start: 180.0, r0: 196.2, r1: 243.29, r2: 184.9, r3: 240.37, r4: 168.26, r5: 218.74 },
  },
  {
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    sector: "E-Commerce / Cloud",
    startingPrice: 230.0,
    entryRound: 0,
    prices: { start: 230.0, r0: 239.2, r1: 260.73, r2: 232.05, r3: 264.54, r4: 222.21, r5: 259.99 },
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Technology / Ads",
    startingPrice: 250.0,
    entryRound: 0,
    prices: { start: 250.0, r0: 240.0, r1: 276.0, r2: 220.8, r3: 269.38, r4: 210.12, r5: 262.65 },
  },
  {
    ticker: "META",
    name: "Meta Platforms",
    sector: "Social / AI",
    startingPrice: 600.0,
    entryRound: 0,
    prices: { start: 600.0, r0: 642.0, r1: 757.56, r2: 568.17, r3: 710.21, r4: 539.76, r5: 658.51 },
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc.",
    sector: "Automotive / Clean Energy",
    startingPrice: 400.0,
    entryRound: 0,
    prices: { start: 400.0, r0: 376.0, r1: 323.36, r2: 381.56, r3: 312.88, r4: 391.1, r5: 293.33 },
  },
  {
    ticker: "JPM",
    name: "JPMorgan Chase & Co.",
    sector: "Financials / Banking",
    startingPrice: 300.0,
    entryRound: 0,
    prices: { start: 300.0, r0: 312.0, r1: 287.04, r2: 350.19, r3: 308.17, r4: 400.62, r5: 320.5 },
  },
  {
    ticker: "GS",
    name: "Goldman Sachs Group",
    sector: "Investment Banking",
    startingPrice: 700.0,
    entryRound: 0,
    prices: { start: 700.0, r0: 721.0, r1: 648.9, r2: 811.12, r3: 689.45, r4: 882.5, r5: 688.35 },
  },
  {
    ticker: "XOM",
    name: "ExxonMobil Corp.",
    sector: "Energy / Oil",
    startingPrice: 120.0,
    entryRound: 0,
    prices: { start: 120.0, r0: 128.4, r1: 112.99, r2: 144.63, r3: 121.49, r4: 136.07, r5: 111.58 },
  },
  {
    ticker: "CVX",
    name: "Chevron Corporation",
    sector: "Energy / Oil",
    startingPrice: 160.0,
    entryRound: 0,
    prices: { start: 160.0, r0: 169.6, r1: 152.64, r2: 189.27, r3: 162.77, r4: 185.56, r5: 148.45 },
  },
  {
    ticker: "CAT",
    name: "Caterpillar Inc.",
    sector: "Industrials / Heavy Machinery",
    startingPrice: 450.0,
    entryRound: 0,
    prices: { start: 450.0, r0: 472.5, r1: 529.2, r2: 465.7, r3: 558.84, r4: 447.07, r5: 572.25 },
  },
  {
    ticker: "BA",
    name: "Boeing Company",
    sector: "Aerospace / Defense",
    startingPrice: 200.0,
    entryRound: 0,
    prices: { start: 200.0, r0: 186.0, r1: 204.6, r2: 173.91, r3: 215.65, r4: 161.74, r5: 210.26 },
  },
  {
    ticker: "WMT",
    name: "Walmart Inc.",
    sector: "Retail / Consumer Staples",
    startingPrice: 105.0,
    entryRound: 0,
    prices: { start: 105.0, r0: 109.2, r1: 115.75, r2: 109.96, r3: 117.66, r4: 127.07, r5: 120.72 },
  },
  {
    ticker: "KO",
    name: "Coca-Cola Company",
    sector: "Consumer Beverages",
    startingPrice: 80.0,
    entryRound: 0,
    prices: { start: 80.0, r0: 82.4, r1: 85.7, r2: 80.56, r3: 84.59, r4: 89.67, r5: 86.08 },
  },
  {
    ticker: "NKE",
    name: "Nike Inc.",
    sector: "Apparel / Consumer Discretionary",
    startingPrice: 75.0,
    entryRound: 0,
    prices: { start: 75.0, r0: 72.0, r1: 77.76, r2: 69.21, r3: 76.82, r4: 65.3, r5: 75.09 },
  },
  {
    ticker: "UNH",
    name: "UnitedHealth Group",
    sector: "Healthcare",
    startingPrice: 300.0,
    entryRound: 0,
    prices: { start: 300.0, r0: 318.0, r1: 298.92, r2: 358.7, r3: 394.57, r4: 347.22, r5: 416.66 },
  },
  {
    ticker: "PFE",
    name: "Pfizer Inc.",
    sector: "Pharmaceuticals",
    startingPrice: 30.0,
    entryRound: 0,
    prices: { start: 30.0, r0: 28.2, r1: 25.94, r2: 31.65, r3: 35.76, r4: 30.75, r5: 38.44 },
  },
  {
    ticker: "V",
    name: "Visa Inc.",
    sector: "Financial / Payments",
    startingPrice: 350.0,
    entryRound: 0,
    prices: { start: 350.0, r0: 367.5, r1: 393.23, r2: 448.28, r3: 502.07, r4: 602.48, r5: 530.18 },
  },
  {
    ticker: "AMD",
    name: "Advanced Micro Devices",
    sector: "Semiconductors",
    startingPrice: 170.0,
    entryRound: 0,
    prices: { start: 170.0, r0: 187.0, r1: 235.62, r2: 172.0, r3: 223.6, r4: 160.99, r5: 209.29 },
  },

  // --- Round 2 Market Expansion (+10 New Stocks) ---
  {
    ticker: "TSM",
    name: "TSMC",
    sector: "Semiconductor Foundry",
    startingPrice: 200.0,
    entryRound: 2,
    prices: { start: 200.0, r0: 200.0, r1: 200.0, r2: 200.0, r3: 254.0, r4: 190.5, r5: 247.65 },
  },
  {
    ticker: "AVGO",
    name: "Broadcom Inc.",
    sector: "Semiconductors",
    startingPrice: 300.0,
    entryRound: 2,
    prices: { start: 300.0, r0: 300.0, r1: 300.0, r2: 300.0, r3: 372.0, r4: 290.16, r5: 368.5 },
  },
  {
    ticker: "ORCL",
    name: "Oracle Corporation",
    sector: "Enterprise Cloud & DB",
    startingPrice: 250.0,
    entryRound: 2,
    prices: { start: 250.0, r0: 250.0, r1: 250.0, r2: 250.0, r3: 290.0, r4: 246.5, r5: 295.8 },
  },
  {
    ticker: "NFLX",
    name: "Netflix Inc.",
    sector: "Streaming / Media",
    startingPrice: 1100.0,
    entryRound: 2,
    prices: { start: 1100.0, r0: 1100.0, r1: 1100.0, r2: 1100.0, r3: 1243.0, r4: 1019.26, r5: 1243.5 },
  },
  {
    ticker: "LMT",
    name: "Lockheed Martin",
    sector: "Defense & Aerospace",
    startingPrice: 550.0,
    entryRound: 2,
    prices: { start: 550.0, r0: 550.0, r1: 550.0, r2: 550.0, r3: 649.0, r4: 791.78, r5: 989.72 },
  },
  {
    ticker: "GE",
    name: "GE Aerospace",
    sector: "Aerospace Propulsion",
    startingPrice: 300.0,
    entryRound: 2,
    prices: { start: 300.0, r0: 300.0, r1: 300.0, r2: 300.0, r3: 366.0, r4: 307.44, r5: 381.23 },
  },
  {
    ticker: "COP",
    name: "ConocoPhillips",
    sector: "Energy / Exploration",
    startingPrice: 100.0,
    entryRound: 2,
    prices: { start: 100.0, r0: 100.0, r1: 100.0, r2: 100.0, r3: 85.0, r4: 100.3, r5: 80.24 },
  },
  {
    ticker: "MCD",
    name: "McDonald's Corp.",
    sector: "Consumer Food Service",
    startingPrice: 330.0,
    entryRound: 2,
    prices: { start: 330.0, r0: 330.0, r1: 330.0, r2: 330.0, r3: 353.1, r4: 384.88, r5: 423.37 },
  },
  {
    ticker: "DIS",
    name: "Walt Disney Company",
    sector: "Entertainment / Parks",
    startingPrice: 120.0,
    entryRound: 2,
    prices: { start: 120.0, r0: 120.0, r1: 120.0, r2: 120.0, r3: 136.8, r4: 109.44, r5: 131.33 },
  },
  {
    ticker: "LIN",
    name: "Linde plc",
    sector: "Industrial Gases / Materials",
    startingPrice: 500.0,
    entryRound: 2,
    prices: { start: 500.0, r0: 500.0, r1: 500.0, r2: 500.0, r3: 600.0, r4: 522.0, r5: 657.72 },
  },
];

export const ROUNDS_DATA: RoundInfo[] = [
  {
    round: 0,
    title: "Round 0: The Opening Bell",
    subtitle: "Onboarding & Market Initiation",
    durationMinutes: 10,
    newsStories: [
      { id: 1, headline: "Major tech firms announce massive expansion in cloud computing infrastructure.", sector: "Technology", clueSummary: "Hyperscalers ramping up capex." },
      { id: 2, headline: "Global consumer confidence beats expectations across North America & Europe.", sector: "Consumer", clueSummary: "Discretionary retail tailwinds." },
      { id: 3, headline: "Disruption reported along vital international maritime fuel transit corridor.", sector: "Energy", clueSummary: "Crude supply tension." },
      { id: 4, headline: "Airlines revise long-term fleet procurement strategies citing cost shifts.", sector: "Aerospace", clueSummary: "Aircraft delivery schedule delays." },
      { id: 5, headline: "Cross-border digital settlement volumes break quarterly records.", sector: "Fintech", clueSummary: "Payment network transaction growth." },
      { id: 6, headline: "Surge in enterprise requests for specialized outpatient medical services.", sector: "Healthcare", clueSummary: "Healthcare utilization uptrend." },
    ],
    marketChanges: {
      AAPL: 5, MSFT: 4, NVDA: 9, AMZN: 4, GOOGL: -4, META: 7, TSLA: -6, JPM: 4, GS: 3, XOM: 7,
      CVX: 6, CAT: 5, BA: -7, WMT: 4, KO: 3, NKE: -4, UNH: 6, PFE: -6, V: 5, AMD: 10
    },
  },
  {
    round: 1,
    title: "Round 1: The Tech Surge",
    subtitle: "AI Infrastructure & Component Crunch",
    durationMinutes: 10,
    newsStories: [
      { id: 1, headline: "Severe shortage of high-bandwidth memory forces long-term supply lockups.", sector: "Semiconductors", clueSummary: "Chip designer margins surge." },
      { id: 2, headline: "Cloud conglomerates unveil $80B in new datacenters across Asia & US.", sector: "Cloud", clueSummary: "Massive hardware orders." },
      { id: 3, headline: "Digital ad spend jumps sharply following high-converting AI targeting rollouts.", sector: "Digital Media", clueSummary: "Social and search monetization." },
      { id: 4, headline: "Legislators debate rolling back federal EV consumer purchase subsidies.", sector: "Automotive", clueSummary: "Electric vehicle margin pressure." },
      { id: 5, headline: "E-commerce retailers report strongest single-quarter margins in three years.", sector: "Retail", clueSummary: "Direct consumer commerce strength." },
      { id: 6, headline: "Youth consumer demand pivots heavily toward premium athletic apparel.", sector: "Consumer", clueSummary: "Footwear and sporting goods rebound." },
    ],
    marketChanges: {
      AAPL: 10, MSFT: 14, NVDA: 24, AMZN: 9, GOOGL: 15, META: 18, TSLA: -14, JPM: -8, GS: -10, XOM: -12,
      CVX: -10, CAT: 12, BA: 10, WMT: 6, KO: 4, NKE: 8, UNH: -6, PFE: -8, V: 7, AMD: 26
    },
  },
  {
    round: 2,
    title: "Round 2: The Shock",
    subtitle: "Geopolitical Friction & 10-Stock Market Expansion",
    durationMinutes: 10,
    newsStories: [
      { id: 1, headline: "Escalating regional friction drives crude benchmark sharply higher.", sector: "Energy", clueSummary: "Oil producers gain pricing power." },
      { id: 2, headline: "Central banks signal rates will remain elevated to combat persistent inflation.", sector: "Financials", clueSummary: "Net interest margins expand for banks." },
      { id: 3, headline: "Commercial construction projects halted amid soaring financing costs.", sector: "Industrials", clueSummary: "Heavy equipment demand pauses." },
      { id: 4, headline: "Airlines issue profit warning as jet fuel spikes eating operating margins.", sector: "Airlines", clueSummary: "Transportation headwinds." },
      { id: 5, headline: "Preventative healthcare mandates stimulate long-term clinical trials.", sector: "Healthcare", clueSummary: "Pharma and health insurers rally." },
      { id: 6, headline: "Supply chain bottleneck hits critical sub-assembly automotive components.", sector: "Automotive", clueSummary: "Auto delivery constraints." },
    ],
    marketChanges: {
      AAPL: -16, MSFT: -13, NVDA: -24, AMZN: -11, GOOGL: -20, META: -25, TSLA: 18, JPM: 22, GS: 25, XOM: 28,
      CVX: 24, CAT: -12, BA: -15, WMT: -5, KO: -6, NKE: -11, UNH: 20, PFE: 22, V: 14, AMD: -27
    },
  },
  {
    round: 3,
    title: "Round 3: The Infrastructure Race",
    subtitle: "Silicon Sovereignty & Mega Buildouts",
    durationMinutes: 10,
    newsStories: [
      { id: 1, headline: "Global governments approve multi-billion domestic semiconductor subsidies.", sector: "Semiconductors", clueSummary: "Foundries and equipment makers surge." },
      { id: 2, headline: "Next-gen datacenter power grid contracts awarded to industrial heavyweights.", sector: "Industrials", clueSummary: "Heavy machinery and materials lift." },
      { id: 3, headline: "Global digital marketing budgets reach all-time high amidst omnichannel push.", sector: "Digital Media", clueSummary: "Ad platform revenue acceleration." },
      { id: 4, headline: "Fast-tracked defense modernizations signed across Allied defense ministries.", sector: "Defense", clueSummary: "Defense contractors lock multi-year backlog." },
      { id: 5, headline: "New renewable grid initiatives drive demand for specialized industrial gases.", sector: "Materials", clueSummary: "Industrial gas suppliers gain volume." },
      { id: 6, headline: "Extended therapeutics demand boosts healthcare contract organizations.", sector: "Healthcare", clueSummary: "Pharma pipelines accelerate." },
    ],
    marketChanges: {
      AAPL: 12, MSFT: 17, NVDA: 30, AMZN: 14, GOOGL: 22, META: 25, TSLA: -18, JPM: -12, GS: -15, XOM: -16,
      CVX: -14, CAT: 20, BA: 24, WMT: 7, KO: 5, NKE: 11, UNH: 10, PFE: 13, V: 12, AMD: 30,
      TSM: 27, AVGO: 24, ORCL: 16, NFLX: 13, LMT: 18, GE: 22, COP: -15, MCD: 7, DIS: 14, LIN: 20
    },
  },
  {
    round: 4,
    title: "Round 4: The Rate Reset",
    subtitle: "Macro Volatility & Regulatory Scrutiny",
    durationMinutes: 10,
    newsStories: [
      { id: 1, headline: "Surprise macro data reshapes central bank policy expectations for tighter liquidity.", sector: "Financials", clueSummary: "High multiple tech faces valuation pressure." },
      { id: 2, headline: "Consumer resilience proves sticky in non-discretionary grocery & fast-food.", sector: "Staples", clueSummary: "Discount retail & fast-food outperform." },
      { id: 3, headline: "Antitrust regulators launch broad inquiry into dominant cloud ecosystems.", sector: "Tech", clueSummary: "Big tech compliance overhead." },
      { id: 4, headline: "Global commodity demand softens unexpectedly on factory output contraction.", sector: "Industrials", clueSummary: "Industrial cyclicals pull back." },
      { id: 5, headline: "Legislative draft proposes strict price ceilings on blockbuster drugs.", sector: "Healthcare", clueSummary: "Biopharma revenue caps." },
      { id: 6, headline: "Global cross-border digital payments exceed all forecast milestones.", sector: "Payments", clueSummary: "Payment volume keeps accelerating." },
    ],
    marketChanges: {
      AAPL: -15, MSFT: -18, NVDA: -30, AMZN: -16, GOOGL: -22, META: -24, TSLA: 25, JPM: 30, GS: 28, XOM: 12,
      CVX: 14, CAT: -20, BA: -25, WMT: 8, KO: 6, NKE: -15, UNH: -12, PFE: -14, V: 20, AMD: -28,
      TSM: -25, AVGO: -22, ORCL: -15, NFLX: -18, LMT: 22, GE: -16, COP: 18, MCD: 9, DIS: -20, LIN: -13
    },
  },
  {
    round: 5,
    title: "Round 5: The Final Move",
    subtitle: "The Ultimate AI Supercycle & Grand Finale",
    durationMinutes: 10,
    newsStories: [
      { id: 1, headline: "Enterprise AI adoption explodes as corporate IT budgets double software commitments.", sector: "Technology", clueSummary: "Final explosive surge for tech leaders." },
      { id: 2, headline: "Semiconductor foundries announce sold-out capacity through next two years.", sector: "Chips", clueSummary: "Peak hardware euphoria." },
      { id: 3, headline: "Multi-nation defense alliances announce historic long-term procurement pact.", sector: "Defense", clueSummary: "Aerospace and defense break records." },
      { id: 4, headline: "Massive unexpected crude production surge depresses global energy benchmarks.", sector: "Energy", clueSummary: "Oil exploration margins sink." },
      { id: 5, headline: "Streaming entertainment platforms report record subscriber retention and ARPU.", sector: "Media", clueSummary: "Streaming media rallies." },
      { id: 6, headline: "Major industrial material deliveries commence for national transit corridors.", sector: "Materials", clueSummary: "Heavy equipment & materials boom." },
    ],
    marketChanges: {
      AAPL: 20, MSFT: 18, NVDA: 30, AMZN: 17, GOOGL: 25, META: 22, TSLA: -25, JPM: -20, GS: -22, XOM: -18,
      CVX: -20, CAT: 28, BA: 30, WMT: -5, KO: -4, NKE: 15, UNH: 20, PFE: 25, V: -12, AMD: 30,
      TSM: 30, AVGO: 27, ORCL: 20, NFLX: 22, LMT: 25, GE: 24, COP: -20, MCD: 10, DIS: 20, LIN: 26
    },
  },
];

export const EVENT_DETAILS = {
  name: "Bulls & Bears — The Ultimate Trading Simulation",
  institution: "Ramaiah University of Applied Sciences",
  accreditation: "A+ NAAC Accredited",
  department: "BSc Data Science",
  date: "1st October 2026",
  time: "10:30 AM – 12:30 PM",
  venue: "2nd Floor, SLH 15",
  teamSize: "Max 2 participants per team",
  startingCash: 100000,
  registrationFee: "Free",
  stockFloat: 100,
  contacts: [
    { name: "Soha Noorain", phone: "+91 84311 25266" },
    { name: "Muhammed Shuaib", phone: "+91 88842 22366" },
  ],
};
