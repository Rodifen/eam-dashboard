/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': {
          900: '#0a1628',
          800: '#0f2847',
          700: '#132f5a',
          600: '#1a3a6e',
          500: '#1e4d8f',
          400: '#2563eb',
          300: '#3b82f6',
          200: '#60a5fa',
          100: '#93c5fd',
        },
        'tech': {
          glow: 'rgba(59, 130, 246, 0.3)',
          card: 'rgba(13, 42, 80, 0.6)',
          border: 'rgba(59, 130, 246, 0.2)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
