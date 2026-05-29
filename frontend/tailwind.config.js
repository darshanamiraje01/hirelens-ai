export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink:    { DEFAULT: "#0A0A0F", 50: "#f0f0f5", 100: "#d4d4e8" },
        brand:  { DEFAULT: "#6C63FF", light: "#9B95FF", dark: "#4A43CC" },
        acid:   { DEFAULT: "#C8FF00", dark: "#9AC400" },
        glass:  "rgba(255,255,255,0.06)",
      },
      animation: {
        "fade-up":   "fadeUp 0.5s ease forwards",
        "fade-in":   "fadeIn 0.4s ease forwards",
        "pulse-slow":"pulse 3s ease-in-out infinite",
        "slide-in":  "slideIn 0.3s ease forwards",
      },
      keyframes: {
        fadeUp:  { "0%": { opacity: 0, transform: "translateY(20px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        fadeIn:  { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideIn: { "0%": { transform: "translateX(-10px)", opacity: 0 }, "100%": { transform: "translateX(0)", opacity: 1 } },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(108,99,255,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.07) 1px,transparent 1px)",
        "brand-gradient": "linear-gradient(135deg,#6C63FF 0%,#9B95FF 100%)",
        "acid-gradient":  "linear-gradient(135deg,#C8FF00 0%,#9AC400 100%)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
};
