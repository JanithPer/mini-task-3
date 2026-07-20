/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          soft: '#171717',
        },
        accent: {
          DEFAULT: '#5b5bf3',
          soft: '#eef0ff',
        },
        success: {
          DEFAULT: '#16a34a',
          soft: '#dcfce7',
        },
        info: {
          DEFAULT: '#6366f1',
          soft: '#e0e7ff',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#fafafa',
          border: '#e5e7eb',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        soft: '0 1px 1px 0 rgb(0 0 0 / 0.03), 0 1px 3px 0 rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
}
