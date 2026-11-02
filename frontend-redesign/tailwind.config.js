/** Look: sage and cream surfaces, charcoal outlines, mustard / teal / slate map tints, orange accent. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#F3EDDF', // page background (cream)
        cream: '#FFFCF3', // card and input paper
        sage: '#C7D5CA', // hero and section bands
        ink: '#1D1D1F', // text and outlines (charcoal)
        orange: { DEFAULT: '#E5432D', dark: '#B8321F' }, // the accent: main actions and pins
        gold: '#E8B54A', // mustard
        teal: { DEFAULT: '#4FA391', dark: '#2F7F70' },
        slate: '#8FA3B0',
        danger: '#B3261E',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'], // headings and buttons
        wide: ['"Krona One"', 'system-ui', 'sans-serif'], // spaced section titles
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '0.6rem' },
      boxShadow: {
        stamp: '0 5px 0 rgba(29,29,31,0.22)',
        'stamp-hover': '0 7px 0 rgba(29,29,31,0.22)',
        'stamp-press': '0 1px 0 rgba(29,29,31,0.22)',
        'stamp-sm': '0 3px 0 rgba(29,29,31,0.22)',
      },
    },
  },
  plugins: [],
};
