/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: '#090D16',
        surface: '#111827',
        borderSubtle: '#1F2937',
      },
      boxShadow: {
        glass: '0 8px 32px -8px rgba(0, 0, 0, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.04)',
        glowEmerald: '0 0 24px -6px rgba(16, 185, 129, 0.35)',
        glowCyan: '0 0 24px -6px rgba(6, 182, 212, 0.35)',
      },
    },
  },
  plugins: [],
};
