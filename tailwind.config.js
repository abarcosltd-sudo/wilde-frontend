/**
 * Colours are CSS variables holding bare `R G B` triplets rather than hex, so a
 * single `.dark` class on `<html>` re-points every existing `bg-wilde-black` or
 * `text-wilde-muted` in the app without any of those call sites changing. The
 * `<alpha-value>` placeholder keeps Tailwind's `/50` opacity modifiers working.
 */
const token = name => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Driven by the clock, not the OS setting — see `useAutoTheme`.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wilde: {
          black:  token('wilde-black'),
          cream:  token('wilde-cream'),
          muted:  token('wilde-muted'),
          border: token('wilde-border'),
          accent: token('wilde-accent'),
          /** Text and icons sitting on a `bg-wilde-black` fill, which inverts in dark. */
          'on-ink': token('wilde-on-ink'),
          /** The page behind everything. */
          surface: token('wilde-surface'),
          /** Cards, sheets and bars that sit above the page. */
          panel:   token('wilde-panel'),
          /** Quiet fills: placeholder blocks, pressed states, thumbnails. */
          subtle:  token('wilde-subtle'),
          /** A step stronger than `subtle`, for skeletons and empty media. */
          sunken:  token('wilde-sunken'),
        },
        /** Carnation. The only saturated colour in the chrome. */
        brand: {
          DEFAULT: token('brand'),
          /** The tint behind brand-coloured text and quiet success states. */
          soft:    token('brand-soft'),
          /** Anything the user must be able to see: focus, drag, active state. */
          strong:  token('brand-strong'),
          /** Text and icons sitting on a `bg-brand` fill. */
          on:      token('brand-on'),
        },
        /** One hue per creative format, as a foreground and a tint. */
        fmt: {
          book:        token('fmt-book'),
          'book-bg':   token('fmt-book-bg'),
          artwork:     token('fmt-artwork'),
          'artwork-bg':token('fmt-artwork-bg'),
          poem:        token('fmt-poem'),
          'poem-bg':   token('fmt-poem-bg'),
          stage:       token('fmt-stage'),
          'stage-bg':  token('fmt-stage-bg'),
        },
      },
      fontFamily: {
        // Geist is the interface; Newsreader is the work itself (titles,
        // reading and writing surfaces), so content reads as content.
        sans: ['Geist', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        // Tailwind's `font-serif` is what the editors already use for prose.
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      boxShadow: {
        // Light mode leans on shadow for depth. Dark mode can't — a shadow on a
        // near-black page is invisible — so there it swaps to a lighter panel
        // and a visible border instead, via `dark:` variants at the call sites.
        card:  '0 1px 2px rgb(17 17 17 / 0.04), 0 2px 8px rgb(17 17 17 / 0.06)',
        lift:  '0 2px 4px rgb(17 17 17 / 0.06), 0 8px 24px rgb(17 17 17 / 0.10)',
        sheet: '0 -2px 24px rgb(17 17 17 / 0.12)',
        press: 'inset 0 1px 2px rgb(17 17 17 / 0.10)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Breathes on a ring overlay rather than the drop target itself: scaling
        // the target would move its own edges under a stationary pointer and
        // fire spurious dragenter/dragleave pairs.
        'drop-pulse': {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(1.02)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-in': 'fade-in 220ms ease-out both',
        // Held back long enough that an upload finishing in a blink never
        // flashes a progress bar on screen.
        'fade-in-delayed': 'fade-in 200ms ease-out 300ms both',
        'drop-pulse': 'drop-pulse 1.5s ease-in-out infinite',
      },
      transitionDuration: {
        // One number for every colour/elevation change in the app, so a card,
        // a button and a nav item never settle at visibly different speeds.
        DEFAULT: '180ms',
      },
    },
  },
  plugins: [],
};
