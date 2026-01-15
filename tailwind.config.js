/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Immersive dark canvas - not pitch black, slightly warm
        'reader-bg': '#0E0E10',
        'reader-bg-subtle': '#141417',
        // Softer text colors for comfortable reading
        'reader-text': '#c8c8cc',
        'reader-text-dim': '#707078',
        'reader-text-muted': '#48484f',
        // Muted accent for focus letter
        'reader-orp': '#b85c5c',
        // Subtle guide elements
        'reader-guide': '#2a2a2f',
        'reader-highlight': 'rgba(184, 92, 92, 0.15)',
      },
      fontFamily: {
        'reader': ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        'mono': ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
