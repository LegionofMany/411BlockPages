/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        darkbg: {
          DEFAULT: '#0a1020', // main background
          light: '#1a223a',   // card/section background
          accent: '#223366',  // accent background
        },
        darktext: {
          DEFAULT: '#f8fafc', // main text
          secondary: '#cbd5e1', // secondary text
          accent: '#60a5fa', // accent text
        },
        accent: {
          blue: '#2563eb',
          indigo: '#6366f1',
          cyan: '#22d3ee',
          yellow: '#fde047',
        },
      },
      boxShadow: {
        'card': '0 4px 24px 0 rgba(30,41,59,0.25)',
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '1.5rem',
      },
      animation: {
        scroll: 'scroll 40s linear infinite',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
};
