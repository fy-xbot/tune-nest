/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{ts,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ec4141',
        'primary-dark': '#c03030',
      },
    },
  },
  plugins: [],
}
