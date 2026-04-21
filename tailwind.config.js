/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ghana: {
          cream: '#F8F4EC',
          paper: '#FFFDF8',
          ink: '#1A1A1A',
          muted: '#637068',
          light: '#E8E3D8',
          green: '#006B3F',
          gold: '#FCD116',
          red: '#CE1126',
          dark: '#081A10',
          dark2: '#0D2818',
        },
        border: '#E8E3D8',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 8px 32px rgba(8, 26, 16, 0.08)',
        panel: '0 16px 48px rgba(8, 26, 16, 0.14)',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}