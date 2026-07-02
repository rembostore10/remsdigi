/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1E40AF',
          purple: '#6D28D9',
          dark: '#0F172A'
        }
      }
    },
  },
  plugins: [],
}
