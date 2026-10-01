import type { Metadata } from "next";
import TradingTerminal from "@/src/components/trading-terminal";

export const metadata: Metadata = {
  title: "Practice Terminal | Bulls & Bears",
  description: "Learn the trading terminal with fictional companies, news, and browser-only practice trades.",
};

export default function DemoPage() {
  return <TradingTerminal demo />;
}
