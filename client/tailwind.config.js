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
          950: '#0B0D0F',
          900: '#111418',
          800: '#1A1E24',
          700: '#252B33',
        },
        offwhite: '#F3F4F6',
        accent: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
          muted: 'rgba(99, 102, 241, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
