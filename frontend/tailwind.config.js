/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        uta: '#005151',
        utm: '#3AD6C5',
        wfm: '#b7950b',
        p1: '#DC2626',
        p2: '#EA580C',
        p3: '#F59E0B',
        p4: '#84CC16',
        s1: '#991B1B',
        s2: '#C2410C',
        s3: '#CA8A04',
        s4: '#65A30D'
      }
    },
  },
  plugins: [],
}
