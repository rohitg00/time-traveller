import path from 'path';
import { defineConfig, loadEnv } from 'vite';
// @ts-ignore - Vite handles this correctly at runtime
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env from project root (parent of frontend/)
    const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
    
    return {
      root: '.',
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/teleport': 'http://localhost:3000',
          '/history': 'http://localhost:3000',
          '/parse-command': 'http://localhost:3000',
        },
      },
      plugins: [react()],
      define: {
        'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
        'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL || 'ws://localhost:3000'),
        'import.meta.env.VITE_GOOGLE_API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY || env.GOOGLE_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
