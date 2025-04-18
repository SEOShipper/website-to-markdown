/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Original colors
        "original-dark-moss": "#1f5f10",
        "original-picton": "#48aae1",
        "original-oxford": "#0a223b",
        "original-emerald": "#55ca84",
        "original-mint": "#f1fcf2",

        // Modernized colors
        "modern-dark-moss": "#2a6b1a",
        "modern-picton": "#3ba3e0",
        "modern-oxford": "#0e2c4a",
        "modern-emerald": "#4ac890",
        "modern-mint": "#eefcf8",
      }
    },
  },
  plugins: [],
};
