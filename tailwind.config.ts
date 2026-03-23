import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        gold: {
          50:  '#fdf9ed',
          100: '#f9f0cc',
          200: '#f2de94',
          300: '#eac75b',
          400: '#e4b530',
          500: '#c99318',
          600: '#a67213',
          700: '#7d5213',
          800: '#674316',
          900: '#593918',
        },
        cream: {
          50:  '#fdfcf8',
          100: '#f9f6ee',
          200: '#f1ead8',
          300: '#e6d9bc',
          400: '#d5c099',
          500: '#c4a676',
        },
        obsidian: {
          900: '#0d0d0d',
          800: '#141414',
          700: '#1a1a1a',
          600: '#242424',
          500: '#2e2e2e',
          400: '#3d3d3d',
          300: '#555',
          200: '#888',
          100: '#bbb',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
