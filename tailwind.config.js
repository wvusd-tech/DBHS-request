/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dbhs: {
          purple: '#6f31a0',
          darkPurple: '#4a1e6d',
          gold: '#ffd760',
          lightGold: '#fff4d1',
          bg: '#fbf9fd'
        }
      }
    },
  },
  plugins: [],
}
