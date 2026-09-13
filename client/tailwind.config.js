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
          950: '#090A0D',
          900: '#12151A',
          850: '#171B22',
          800: '#1E232C',
          700: '#282F3B',
        },
        offwhite: {
          DEFAULT: '#F4F5F7',
          muted: '#9DA3AF',
          subtle: '#6B7280',
        },
        accent: {
          DEFAULT: '#7069E6',
          hover: '#5F57DB',
          light: '#9B94F7',
          muted: 'rgba(112, 105, 230, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
