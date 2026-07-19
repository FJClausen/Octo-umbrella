import type { Config } from "tailwindcss";

/**
 * Team theme — matched to the Mundo Rainbows crest: navy ring, sky-blue
 * globe, olive-green continents, with the rainbow arc reserved as a small
 * decorative accent (see .rainbow-bar in globals.css).
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
          // Green — crest continents (accent / positive actions)
          green: "#5B8A3A",
          "green-dark": "#436B2B",
          "green-light": "#EEF5E4",
          // Blue — crest ring & globe (primary)
          blue: "#1B4D7E",
          "blue-dark": "#0F2E4D",
          "blue-light": "#E4EEF7",
          ink: "#0F172A",
          muted: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
