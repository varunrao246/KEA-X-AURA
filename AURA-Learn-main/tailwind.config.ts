import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        subtle: token("subtle"),
        line: token("line"),
        ink: token("ink"),
        muted: token("muted"),
        faint: token("faint"),
        brand: { DEFAULT: token("brand"), soft: token("brand-soft"), on: token("brand-on") },
        accent: { DEFAULT: token("accent"), soft: token("accent-soft") },
        success: { DEFAULT: token("success"), soft: token("success-soft") },
        warn: { DEFAULT: token("warn"), soft: token("warn-soft") },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft") },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        pop: "var(--shadow-pop)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        pop: { "0%": { opacity: "0", transform: "scale(.96)" }, "100%": { opacity: "1", transform: "none" } },
        "sheet-up": { "0%": { transform: "translateY(24px)", opacity: "0" }, "100%": { transform: "none", opacity: "1" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "aura-pulse": {
          "0%,100%": { transform: "scale(1)", opacity: ".55" },
          "50%": { transform: "scale(1.06)", opacity: ".9" },
        },
      },
      animation: {
        "fade-up": "fade-up .45s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .25s ease-out both",
        pop: "pop .2s cubic-bezier(.2,.7,.2,1) both",
        "sheet-up": "sheet-up .28s cubic-bezier(.2,.7,.2,1) both",
        shimmer: "shimmer 1.6s infinite",
        "aura-pulse": "aura-pulse 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
