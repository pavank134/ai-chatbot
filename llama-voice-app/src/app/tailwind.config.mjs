/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gemini: {
          bg: "#0e0e10",
          surface: "#1e1e20",
          accent: "#4b90ff",
          border: "#2e2e32",
        },
      },
    },
  },
  plugins: [],
};