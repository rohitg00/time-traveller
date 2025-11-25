import path from 'path';
import { defineConfig, loadEnv } from 'vite';
// @ts-ignore - Vite handles this correctly at runtime
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '..', '');
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
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GOOGLE_API_KEY': JSON.stringify(env.GOOGLE_API_KEY),
        'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
