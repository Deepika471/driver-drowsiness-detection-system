/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void: '#020408',
        panel: '#080f18',
        border: '#0d2035',
        accent: '#00d4ff',
        'accent-dim': '#0099bb',
        warn: '#ff6b35',
        danger: '#ff2d55',
        safe: '#00ff88',
        'safe-dim': '#00cc6a',
        muted: '#2a4a6b',
        text: '#c8e6f5',
        'text-dim': '#6a9abf',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0,212,255,0.7), 0 0 80px rgba(0,212,255,0.2)' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
        'radial-glow': 'radial-gradient(ellipse at center, rgba(0,212,255,0.08) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
    },
  },
  plugins: [],
}
