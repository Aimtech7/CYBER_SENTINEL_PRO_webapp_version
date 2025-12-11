import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        info: '#9bd1ff',
        warning: '#e0a800',
        danger: '#ff4d4d'
      }
    }
  },
  plugins: []
}

export default config
