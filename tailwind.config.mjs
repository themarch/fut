/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6', // blue-500
          dark: '#1d4ed8', // blue-700
        },
        secondary: {
          DEFAULT: '#10b981', // emerald-500
          dark: '#047857', // emerald-700
        }
      },
    },
  },
  darkMode: 'class', // Active le mode sombre basé sur les classes
  plugins: [],
}; 