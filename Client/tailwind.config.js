/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: '#3FC1C9',
        charcoal: '#2B2B2B',
        'soft-pink': '#F6C6C6',
        gold: '#D4AF37',
      },
      fontFamily: {
        logo: ['CustomScript', 'cursive'],
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
  ],
}