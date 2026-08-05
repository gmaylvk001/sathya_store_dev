/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brandRed: "#d72828",
        brandRedDark: "#b82020",
        brandYellow: "#fbe002",
        brandYellowDark: "#e0c800",
        customBlue: "#d72828",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
