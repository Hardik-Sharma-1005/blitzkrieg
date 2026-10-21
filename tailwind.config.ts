import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        navy: { DEFAULT: "hsl(var(--navy))", light: "hsl(var(--navy-light))" },
        gold: "hsl(var(--gold))",
        coral: "hsl(var(--coral))",
        mint: "hsl(var(--mint))",
        sky: "hsl(var(--sky))",
        lilac: "hsl(var(--lilac))",
        "super-dream": "hsl(var(--super-dream))",
        dream: "hsl(var(--dream))",
        standard: "hsl(var(--standard))",
        regular: "hsl(var(--regular))",
        expert: "hsl(var(--expert))",
        advanced: "hsl(var(--advanced))",
        pro: "hsl(var(--pro))",
        beginner: "hsl(var(--beginner))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(221 83% 53% / 0.18)" },
          "50%": { boxShadow: "0 0 0 6px hsl(221 83% 53% / 0)" },
        },
      },
      animation: { glow: "glow 2s ease-in-out infinite", "ambient-drift": "ambient-drift 18s ease-in-out infinite" },
    },
  },
  plugins: [],
} satisfies Config;
