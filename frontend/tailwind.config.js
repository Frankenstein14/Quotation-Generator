/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          maroon: '#6B1E2E',
          'maroon-dark': '#4A1420',
          'maroon-light': '#842438',
          gold: '#C9A227',
          'gold-light': '#D8C27A',
          'gold-dark': '#A68218',
          offwhite: '#FAF9F6',
          text: '#222222',
          muted: '#666666'
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
