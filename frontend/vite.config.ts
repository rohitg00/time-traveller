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
      // Image optimization and build performance
      build: {
        // Enable chunk splitting for better caching
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-icons': ['lucide-react'],
            },
            // Use hashed asset names for cache busting
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name?.split('.') || [];
              const ext = info[info.length - 1];
              // Put images in a separate folder
              if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
                return `assets/images/[name]-[hash][extname]`;
              }
              return `assets/[name]-[hash][extname]`;
            },
          },
        },
        // Increase chunk size warning limit since images are large
        chunkSizeWarningLimit: 1000,
        // Enable minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
          },
        },
      },
      // Optimize dependency pre-bundling
      optimizeDeps: {
        include: ['react', 'react-dom', 'lucide-react'],
      },
      define: {
        'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
        'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL || 'ws://localhost:3000'),
        'import.meta.env.VITE_GOOGLE_API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY || env.GOOGLE_API_KEY || ''),
        // Supabase - try VITE_ prefixed first, then fall back to non-prefixed
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
