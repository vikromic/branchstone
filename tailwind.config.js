/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'stone-off': '#faf8f3',
        'stone-light': '#f5f1e8',
        'stone-warm': '#e8dcc8',
        'stone-taupe': '#9b8b7e',
        'stone-brown': '#6b5d54',
        'stone-dark': '#3d3733',
        'sage': '#a8b89f',
        'moss': '#8b9d83',
        'accent-red': '#d4726f',
      },
      fontFamily: {
        'serif': ['Georgia', 'Garamond', 'serif'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      spacing: {
        'section': '6rem',
      },
    },
  },
  plugins: [],
};

