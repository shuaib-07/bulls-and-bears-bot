import type { Metadata } from "next";
import { Orbitron, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SoundEffects } from "@/src/components/ui/sound";
import { Toaster } from "sonner";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["500", "600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bulls & Bears — The Ultimate Trading Simulation",
  description: "Real-time multiplayer market simulation by Ramaiah University of Applied Sciences. Read the news. Make your move. Outsmart the market.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} dark antialiased selection:bg-[#FF5F1F]/30 selection:text-white`}
    >
      <body className="bg-[#030303] text-[#fafafa] min-h-screen relative font-sans">
        <Toaster theme="dark" richColors closeButton position="top-right" />
        <SoundEffects />
        <div className="fixed inset-0 bg-noise pointer-events-none z-50"></div>
        {children}
      </body>
    </html>
  );
}
