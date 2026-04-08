/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        surface: '#13131A',
        border: '#1E1E2E',
        pink: '#FF2D78',
        cyan: '#00FFF0',
        purple: '#9945FF',
        amber: '#FFB800',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-pink': '0 0 12px #FF2D78, 0 0 30px #FF2D7840',
        'glow-cyan': '0 0 12px #00FFF0, 0 0 30px #00FFF040',
        'glow-purple': '0 0 12px #9945FF, 0 0 30px #9945FF40',
        'glow-amber': '0 0 8px #FFB800, 0 0 20px #FFB80040',
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-fast': 'ping 0.6s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}
