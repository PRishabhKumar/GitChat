export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        white: 'var(--color-neo-white)',
        black: 'var(--color-neo-black)',
        'neo-black':  'var(--color-neo-black)',
        'neo-cream':  'var(--color-neo-cream)',
        'neo-white':  'var(--color-neo-white)',
        'neo-yellow': 'var(--color-neo-yellow)',
        'neo-green':  'var(--color-neo-green)',
        'neo-pink':   'var(--color-neo-pink)',
        'neo-blue':   'var(--color-neo-blue)',
        'neo-orange': 'var(--color-neo-orange)',
        'neo-gray':   'var(--color-neo-gray)',
      },
      boxShadow: {
        'neo-sm':    '2px 2px 0px var(--color-neo-black)',
        'neo':       '4px 4px 0px var(--color-neo-black)',
        'neo-lg':    '6px 6px 0px var(--color-neo-black)',
        'neo-blue':  '4px 4px 0px var(--color-neo-blue)',
        'neo-green': '4px 4px 0px var(--color-neo-green)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
