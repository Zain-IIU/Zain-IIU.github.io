import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// zain.github.io is a GitHub *user* site, so it is served from the domain root.
// If you ever move this to a project repo (e.g. github.com/you/portfolio),
// change base to '/portfolio/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
