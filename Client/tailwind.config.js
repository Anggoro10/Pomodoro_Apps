/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./App.{js,jsx,ts,tsx}",
      "./src/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
      extend: {
        colors: {
          kairo: {
            bg: '#FBF9F5',
            card: '#F3EFEA',
            dark: '#2C4E3F',
            mint: '#D8E8DD',
            gray: '#8E948F',
            accent: '#E07A5F',
          }
        }
      },
    },
    plugins: [],
  }