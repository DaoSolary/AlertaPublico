import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    cssCodeSplit: false,
    minify: 'esbuild',
    cssMinify: true,
  },
  server: {
    port: 5173,
    // Proxy desabilitado - usando API de produção diretamente
    // Para usar backend local, descomente e configure VITE_API_URL=''
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3001',
    //     changeOrigin: true,
    //   },
    // },
  },
})

