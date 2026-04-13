import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/splitwise': {
        target: 'https://secure.splitwise.com/api/v3.0',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/splitwise/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add authorization header from request
            const authHeader = req.headers.authorization;
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
          });
        }
      }
    }
  }
})
