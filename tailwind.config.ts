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
        "card-elevated": "rgb(var(--card-elevated))",
        border: "rgb(var(--border))",
        primary: "rgb(var(--primary))",
        "primary-foreground": "rgb(var(--primary-foreground))",
        secondary: "rgb(var(--secondary))",
        "secondary-foreground": "rgb(var(--secondary-foreground))",
        success: "rgb(var(--success))",
        "success-foreground": "rgb(var(--success-foreground))",
        warning: "rgb(var(--warning))",
        "warning-foreground": "rgb(var(--warning-foreground))",
        destructive: "rgb(var(--destructive))",
        "destructive-foreground": "rgb(var(--destructive-foreground))",
        info: "rgb(var(--info))",
        "info-foreground": "rgb(var(--info-foreground))",
        muted: "rgb(var(--muted))",
        "muted-foreground": "rgb(var(--muted-foreground))",
        accent: "rgb(var(--accent))",
        "accent-foreground": "rgb(var(--accent-foreground))",
      },
      boxShadow: {
        "elevation-1": "0 2px 4px rgba(0, 0, 0, 0.1)",
        "elevation-2": "0 4px 12px rgba(0, 0, 0, 0.15)",
        "elevation-3": "0 8px 24px rgba(0, 0, 0, 0.2)",
        "glow-primary": "0 0 20px rgba(168, 85, 247, 0.3)",
        "glow-success": "0 0 20px rgba(34, 197, 94, 0.3)",
        "inset-light": "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      },
    },
  },

  plugins: [],
}

export default config
