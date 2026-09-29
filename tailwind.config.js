/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030303",
        foreground: "#fafafa",
        accent: {
          DEFAULT: "#FF5F1F",
          hover: "#FF773D",
          glow: "rgba(255, 95, 31, 0.25)",
        },
        bull: {
          DEFAULT: "#10B981",
          glow: "rgba(16, 185, 129, 0.25)",
          dark: "#064E3B",
        },
        bear: {
          DEFAULT: "#F43F5E",
          glow: "rgba(244, 63, 94, 0.25)",
          dark: "#881337",
        },
      },
      fontFamily: {
        sarpanch: ["var(--font-sarpanch)", "sans-serif"],
        orbitron: ["var(--font-orbitron)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ticker-slide": "ticker 25s linear infinite",
        "glow-slow": "glow 3s ease-in-out infinite alternate",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(255,95,31,0.2)" },
          "100%": { boxShadow: "0 0 35px rgba(255,95,31,0.5)" },
        },
      },
    },
  },
  plugins: [],
};
