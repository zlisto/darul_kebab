import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // relative paths so it works on GitHub Pages and locally
  plugins: [react()],
  server: { port: 5174, strictPort: true }, // Yale is 5173; the metaverse browser will be 5175
})
