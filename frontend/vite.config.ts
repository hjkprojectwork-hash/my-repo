import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': resolve(dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // QR scanner — ~500KB, only needed by canteen staff
          // Students never download this on initial load
          if (id.includes('html5-qrcode')) return 'vendor-qr-scanner';
          // QR code generator
          if (id.includes('qrcode.react')) return 'vendor-qr-code';
          // Supabase client — large, changes rarely
          if (id.includes('@supabase')) return 'vendor-supabase';
          // React ecosystem
          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
        },
      },
    },
  },
});


