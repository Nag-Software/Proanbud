import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1A4314',
          foreground: '#FFFFFF',
        },
        accent: '#A2E4B8',
        background: '#F8F9FA',
        foreground: '#1C1C1E',
        card: '#FFFFFF',
        text: '#1C1C1E',
        'muted-text': '#6D6D72',
        border: '#E5E5E7',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
};

export default config;