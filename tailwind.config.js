import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mystic: {
          dark: '#080808',
          ink: '#0D1117',
          charcoal: '#141414',
          surface: '#1C1C22',
          gold: '#C5A059',
          shine: '#E8C97A',
          amber: '#FFD700',
          red: '#8B0000',
          crimson: '#7A1B1B',
          paper: '#F2E8C9',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', 'serif'],
        calligraphy: ['"Ma Shan Zheng"', 'cursive'],
        sans: ['"Inter"', 'sans-serif'],
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        smoke: 'smoke 3s ease-in-out infinite alternate',
        toss: 'toss 0.8s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.7s ease-out forwards',
        marquee: 'marquee 30s linear infinite',
        'ken-burns': 'kenBurns 18s ease-in-out infinite alternate',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        smoke: {
          '0%': { opacity: 0.3, transform: 'translateY(0) scale(1)' },
          '100%': { opacity: 0.7, transform: 'translateY(-20px) scale(1.1)' },
        },
        toss: {
          '0%': { transform: 'translateY(0) rotateX(0) rotateZ(0) scale(1)' },
          '25%': { transform: 'translateY(-100px) rotateX(180deg) rotateZ(45deg) scale(1.1)' },
          '50%': { transform: 'translateY(-120px) rotateX(360deg) rotateZ(90deg) scale(1.1)' },
          '75%': { transform: 'translateY(-50px) rotateX(540deg) rotateZ(135deg) scale(1.05)' },
          '100%': { transform: 'translateY(0) rotateX(720deg) rotateZ(180deg) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        kenBurns: {
          '0%': { transform: 'scale(1.0) translate(0%, 0%)' },
          '100%': { transform: 'scale(1.08) translate(-2%, -1%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [typography],
};
