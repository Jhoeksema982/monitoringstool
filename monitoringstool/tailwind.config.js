/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          650: '#008080',
          750: '#004d4d',
        },
      },
    },
  },
  plugins: [],
}
