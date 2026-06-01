import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
        '/ws': {
          target: process.env.VITE_WS_URL || 'ws://localhost:8000',
          ws: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') ||
                id.includes('node_modules/react-dom') ||
                id.includes('node_modules/react-router-dom')) {
              return 'react-vendor';
            }

            if (id.includes('node_modules/recharts')) {
              return 'chart-vendor';
            }

            if (id.includes('node_modules/lucide-react')) {
              return 'icon-vendor';
            }
          },
        },
      },
    },
    define: {
      'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    },
  }
})