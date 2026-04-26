import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#050608",
        surface: "#0a0d13",
        panel: "#11151c",
        header: "#080a0f",
        neon: {
          cyan: "#66fcf1",
          amber: "#ffc107",
        },
        muted: {
          cyan: "#45a29e",
          DEFAULT: "#5e6c80",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      backgroundImage: {
        'glow-cyan': 'radial-gradient(circle, rgba(102, 252, 241, 0.15) 0%, rgba(0,0,0,0) 70%)',
      }
    },
  },
  plugins: [],
} satisfies Config;
