import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        card: "var(--card)",
        border: "var(--border)",
        accent: "var(--accent)",
        success: "var(--success)",
        danger: "var(--danger)",
        warning: "var(--warning)"
      },
      boxShadow: {
        ambient: "0 30px 100px rgba(16, 32, 51, 0.14)"
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Segoe UI"', "sans-serif"],
        display: ['"Clash Display"', '"Space Grotesk"', "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
