import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          "50": "#fefdfb",
          "100": "#f7efdd",
          "200": "#eddcbb",
          "300": "#e2c28f",
          "400": "#d5a362",
          "500": "#cc8a43",
          "600": "#be7538",
          "700": "#9e5c30",
          "800": "#7f4b2d",
          "900": "#673e27",
          "950": "#371f13",
        },
        neutral: {
          "50": "#f5f6f6",
          "100": "#e5e7e8",
          "200": "#cdd0d4",
          "300": "#aaafb6",
          "400": "#808790",
          "500": "#656c75",
          "600": "#565a64",
          "700": "#4a4d54",
          "800": "#414349",
          "900": "#393b40",
          "950": "#1d1e21",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        serif: ["var(--font-serif)"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
