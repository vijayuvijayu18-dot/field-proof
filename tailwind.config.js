/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        console: {
          bg: '#0a0d14',
          surface: '#111726',
          panel: '#161f33',
          border: '#23304a',
          borderSubtle: '#1b253b',
          muted: '#62728f',
          text: '#e2e8f0',
          accent: '#0284c7',
          accentLight: '#38bdf8',
          accentGlow: 'rgba(56, 189, 248, 0.12)',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
