/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'angel-green': '#22c55e',
        'angel-light': '#84cc16',
        'angel-yellow': '#f59e0b',
        'angel-red': '#ef4444',
      },
      backgroundColor: {
        'dark-navy': '#0f172a',
      }
    },
  },
  plugins: [],
}
