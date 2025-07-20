/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'un-blue': '#009edb',
        'un-dark-blue': '#0077be',
        'un-light-blue': '#4db8e8',
        'un-gray': '#f5f5f5',
        'un-dark-gray': '#333333'
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      }
    },
  },
  plugins: [],
} 