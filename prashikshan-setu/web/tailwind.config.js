/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0B1F3A", soft: "#132B4D", mute: "#5B6B7C" },
        saffron: { DEFAULT: "#E87722", soft: "#F3A15C" },
        leaf: { DEFAULT: "#1B7A4E", soft: "#3D9B6E" },
        paper: { DEFAULT: "#F7F4EF", card: "#FFFFFF" },
        line: "#E4E0D8",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        lift: "0 12px 40px rgba(11, 31, 58, 0.08)",
      },
    },
  },
  plugins: [],
};
