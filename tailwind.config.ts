import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFFBE6',
          100: '#FFF3B8',
          200: '#FFEB8A',
          300: '#FFE45C',
          400: '#FFDC36',
          500: '#FFD500',
          600: '#D1AE00',
          700: '#A38800',
          800: '#756200',
          900: '#473C00',
          950: '#1A1500',
        },
        success: {
          DEFAULT: '#00FF6A',
          bg: '#E6FFF0',
          text: '#007A33',
        },
        cream: '#FCFBF8',
        border: '#EBEBEB',
        text: {
          main: '#001224',
          desc: '#4B5563',
        },
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)'],
      },
      boxShadow: {
        none: 'none',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        full: '999px',
      },
    },
  },
  plugins: [],
};
export default config;
