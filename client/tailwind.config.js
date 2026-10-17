/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070D1E',
          900: '#0B1533',
          850: '#101E42',
          800: '#172554',
          700: '#1E3A8A',
        },
        industrial: {
          DEFAULT: '#FF6500',
          hover: '#EA580C',
          light: '#FFF7ED',
          border: '#FED7AA',
        },
        accent: {
          blue: '#2563EB',
          'blue-hover': '#1D4ED8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 8px 30px rgba(15, 23, 42, 0.12)',
        dropdown: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
      }
    },
  },
  plugins: [],
};
