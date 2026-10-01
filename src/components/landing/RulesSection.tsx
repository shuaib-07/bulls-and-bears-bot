"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, Clock, DollarSign, Lock, ShieldCheck, Zap } from "lucide-react";

export function RulesSection() {
  const rules = [
    {
      step: "01",
      title: "Real Stocks, Fictional News",
      desc: "Trade publicly listed global market leaders across Tech, Finance, Energy, and Healthcare. Each round releases 5–6 plausible scenario developments without explicit hints. You must deduce the supply chain impact.",
      icon: Zap,
      accent: "#FF5F1F",
    },
    {
      step: "02",
      title: "100-Share Scarcity Float",
      desc: "Each stock has an initial market pool of exactly 100 shares. Once depleted, the market cannot sell you more. You must negotiate directly with rival teams holding those shares.",
      icon: Lock,
      accent: "#3b82f6",
    },
    {
      step: "03",
      title: "Share Swaps & Market Sales",
      desc: "Exchange stocks with other teams through share-for-share swaps only. Sales go back to the market at its current price and configured commission. When enabled, the market-sale lock requires two accepted swaps per team each round. No cash payments between teams or multi-party trades.",
      icon: ArrowLeftRight,
      accent: "#10B981",
    },
    {
      step: "04",
      title: "Strict 10-Minute Windows",
      desc: "Rounds operate under strict real-time countdown clocks. Once the timer hits 00:00, all buy, sell, and swap orders instantly freeze. Market prices shift based on the round's event shocks.",
      icon: Clock,
      accent: "#eab308",
    },
    {
      step: "05",
      title: "Final Liquidation & Victory",
      desc: "After the final round, all remaining portfolio shares are automatically liquidated at closing prices. The team with the highest total cash balance takes 1st place.",
      icon: DollarSign,
      accent: "#F43F5E",
    },
    {
      step: "06",
      title: "Anti-Cheat Ledger",
      desc: "Every order and swap is verified with atomic inventory locks. Short selling, overdrafts, and unconfirmed swaps are programmatically rejected.",
      icon: ShieldCheck,
      accent: "#a855f7",
    },
  ];

  return (
    <section id="rules" className="relative py-24 px-4 md:px-8">
      <div className="section-slab">
        <div className="section-inner max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#FF5F1F] mb-3">
              <span className="w-1.5 h-1.5 bg-[#FF5F1F]"></span>
              SYSTEM ARCHITECTURE // GAME RULES
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4">
              NOT A GENERIC SIMULATOR
            </h2>
            <p className="text-sm md:text-base text-[#a1a1aa] leading-relaxed">
              Bulls & Bears is a strategic war of incomplete information, float scarcity, and high-stakes negotiation designed to test real analytical acuity.
            </p>
          </motion.div>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rules.map((rule, idx) => {
              const Icon = rule.icon;
              return (
                <motion.div
                  key={rule.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="group relative p-6 md:p-8 bg-[#09090b]/80 border border-[#1e1e1e] hover:border-[#3f3f46] transition-all duration-300 rounded-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-mono tracking-widest text-[#71717a] group-hover:text-white transition-colors">
                        RULE // {rule.step}
                      </span>
                      <div
                        className="w-8 h-8 rounded-sm flex items-center justify-center border"
                        style={{
                          borderColor: `${rule.accent}40`,
                          backgroundColor: `${rule.accent}15`,
                          color: rule.accent,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-lg font-display font-bold text-white mb-3 group-hover:text-[#FF5F1F] transition-colors">
                      {rule.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
                      {rule.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#18181b] flex items-center justify-between text-[10px] font-mono uppercase text-[#52525b]">
                    <span>STATUS: ENFORCED</span>
                    <span className="text-[#10B981]">SYSTEM ACTIVE</span>
                  </div>

                  {/* Bottom Accent Highlight */}
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                    style={{ backgroundColor: rule.accent }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
