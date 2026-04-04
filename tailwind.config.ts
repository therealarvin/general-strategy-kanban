import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#f8f7f4',
        ink: '#1a1a1a',
        brass: '#b8a07a',
        'brass-light': '#d4c4a8',
        muted: '#777777',
        faint: '#aaaaaa',
        dark: '#111111',
        'dark-card': '#1e1e1e',
        'dark-border': '#2a2a2a',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
} satisfies Config;
