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
