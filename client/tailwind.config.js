/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0B0E17',
          900: '#131726',
          850: '#181E30',
          800: '#20273D',
          750: '#262F4A',
          700: '#2C3654',
        },
        offwhite: {
          DEFAULT: '#F5F7FA',
          muted: '#9BA3B8',
          subtle: '#6B7694',
        },
        accent: {
          DEFAULT: '#5D5FEF',
          hover: '#4E50E6',
          light: '#8284F8',
          dark: '#4849D6',
          muted: 'rgba(93, 95, 239, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
