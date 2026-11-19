import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0A0B",
          900: "#0E0E10",
          800: "#15151A",
          700: "#1A1A22",
          600: "#1E1E24",
          500: "#25252F",
          400: "#2A2A32",
        },
        // WCAG AA: zinc-500/600 carry secondary and muted text on the ink backgrounds. The stock shades
        // (#71717a ≈ 4.1:1 and #52525b ≈ 2.6:1 on ink-950) fail 4.5:1, so both are lightened while keeping
        // the 400 > 500 > 600 hierarchy (#8A8A94 ≥ 4.8:1 up to ink-600, #80808A ≥ 4.4:1 up to ink-700).
        zinc: { 500: "#8A8A94", 600: "#80808A" },
        lime: { DEFAULT: "#A3FF12" },
        violet: { DEFAULT: "#8B5CF6" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { "fade-in": "fade-in .25s ease-out" },
    },
  },
  plugins: [],
};

export default config;
