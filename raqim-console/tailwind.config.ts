import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "outline": "#8b90a0",
        "secondary-container": "#00a572",
        "secondary": "#4edea3",
        "on-primary-container": "#ffffff",
        "surface-container-lowest": "#0e0e0e",
        "on-primary": "#002e6b",
        "tertiary-fixed": "#ffddb8",
        "inverse-primary": "#0059c5",
        "primary": "#aec6ff",
        "primary-container": "#0070f3",
        "on-primary-fixed-variant": "#004397",
        "tertiary-container": "#a66900",
        "on-background": "#e5e2e1",
        "on-secondary-fixed-variant": "#005236",
        "surface-variant": "#353534",
        "inverse-on-surface": "#313030",
        "tertiary": "#ffb95f",
        "surface-container-low": "#1c1b1b",
        "secondary-fixed-dim": "#4edea3",
        "on-error": "#690005",
        "surface-container": "#201f1f",
        "on-primary-fixed": "#001a43",
        "on-secondary-container": "#00311f",
        "secondary-fixed": "#6ffbbe",
        "primary-fixed": "#d8e2ff",
        "surface-bright": "#3a3939",
        "on-tertiary": "#472a00",
        "tertiary-fixed-dim": "#ffb95f",
        "primary-fixed-dim": "#aec6ff",
        "surface-dim": "#131313",
        "on-surface": "#e5e2e1",
        "error": "#ffb4ab",
        "inverse-surface": "#e5e2e1",
        "background": "#131313",
        "on-tertiary-container": "#ffffff",
        "surface": "#131313",
        "surface-container-high": "#2a2a2a",
        "on-tertiary-fixed-variant": "#653e00",
        "on-error-container": "#ffdad6",
        "on-tertiary-fixed": "#2a1700",
        "surface-tint": "#aec6ff",
        "surface-container-highest": "#353534",
        "on-surface-variant": "#c1c6d7",
        "outline-variant": "#414754",
        "on-secondary": "#003824",
        "error-container": "#93000a",
        "on-secondary-fixed": "#002113"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        "headline": ["Space Grotesk", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
        "mono-tech": ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: [],
} satisfies Config;
