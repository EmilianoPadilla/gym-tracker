/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#0F1626",
        panel: "#1A2445",
        panelraised: "#212C58",
        hairline: "#2C3968",
        chalk: "#EDE7DD",
        chalkdim: "#9AA3C2",
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

