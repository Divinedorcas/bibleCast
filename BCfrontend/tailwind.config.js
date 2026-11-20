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
          dark: '#05080C',
          surface: '#0A0F1D',
          panel: '#10172A',
          card: '#162036',
          border: '#1F2E4D',
          borderLight: '#2D3F66',
          gold: '#E5C76B',
          goldHover: '#D4B555',
          accent: '#2563EB',
          accentHover: '#1D4ED8',
          success: '#16A34A',
          danger: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Merriweather', 'serif'],
      }
    },
  },
  plugins: [],
}

