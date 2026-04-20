/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6FFFA',
          100: '#B5FFED',
          200: '#7FFFDD',
          300: '#4DFFD2',
          400: '#2AEDBA',
          500: '#1DD6A8',
          600: '#14A882',
          700: '#0D7D61',
        },
        accent: {
          50: '#FFF8E6',
          100: '#FFEAB3',
          200: '#FFD980',
          300: '#FFC84D',
          400: '#FFB81A',
          500: '#E5A00D',
        },
        risk: {
          high: '#FF4757',
          'high-bg': 'rgba(255, 71, 87, 0.12)',
          medium: '#FFA502',
          'medium-bg': 'rgba(255, 165, 2, 0.12)',
          low: '#7BED9F',
          'low-bg': 'rgba(123, 237, 159, 0.12)',
        },
        surface: {
          base: '#0C0C0E',
          DEFAULT: '#141417',
          elevated: '#1C1C21',
          overlay: '#252529',
        },
        border: {
          subtle: '#2A2A30',
          DEFAULT: '#3A3A42',
          strong: '#4A4A55',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'PingFang SC', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(29, 214, 168, 0.15)',
      },
    },
  },
  plugins: [],
}
