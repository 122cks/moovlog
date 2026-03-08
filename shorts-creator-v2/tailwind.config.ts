import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 무브먼트 브랜드 컬러
        brand: {
          pink:    '#FF2D55',
          yellow:  '#D2FF00',
          gold:    '#C8A96E',
          dark:    '#0f0f0f',
          surface: '#1a1a1a',
          card:    '#242424',
        },
      },
      fontFamily: {
        sans: ["'Noto Sans KR'", 'sans-serif'],
        display: ["'Black Han Sans'", "'Noto Sans KR'", 'sans-serif'],
      },
      // 9:16 shorts 비율 유틸
      aspectRatio: { 'shorts': '9 / 16' },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-up':  'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft':'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
