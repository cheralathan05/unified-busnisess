import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        card: "rgb(var(--card))",
        border: "rgb(var(--border))",
        primary: "rgb(var(--primary))",
        secondary: "rgb(var(--secondary))",
        muted: "rgb(var(--muted))",
        accent: "rgb(var(--accent))",
      },
    },
  },

  plugins: [],
}

export default config