/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16A34A',
          hover: '#15803D',
          light: '#DCFCE7',
          subtle: '#F0FDF4',
        },
        brand: {
          green: '#16A34A',
          darkGreen: '#15803D',
          lightGreen: '#DCFCE7',
          bgLight: '#F0FDF4',
          textDark: '#17211B',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
