import type { Config } from "tailwindcss";

/**
 * Team theme — blue & green (inspired by mundoverdepcs.org).
 * Tweak these values to rebrand the whole site in one place.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Green (primary)
          green: "#1F9E55",
          "green-dark": "#157A41",
          "green-light": "#E8F6EE",
          // Blue (secondary)
          blue: "#0A6EBD",
          "blue-dark": "#075492",
          "blue-light": "#E6F1FA",
          ink: "#0F172A",
          muted: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
