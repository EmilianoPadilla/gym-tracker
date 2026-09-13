/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#1D1A17",
        panel: "#26221E",
        panelraised: "#2F2A25",
        hairline: "#3A3630",
        chalk: "#EDE7DD",
        chalkdim: "#A69F92",
        brass: "#1a369c",
        brasslight: "#7586c3",
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        body: ["Work Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
}

