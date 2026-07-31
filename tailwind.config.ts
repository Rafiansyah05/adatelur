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
        landing: {
          text: '#212121',
          desc: '#6C727C',
          cream: '#FFFDF5',
          border: '#E4E7EB',
          50: '#FFFDF5',
          100: '#FFF9E1',
          200: '#FFF2C2',
          300: '#FFEA9D',
          400: '#FFDE6B',
          500: '#FACC15',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
          950: '#422006',
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
