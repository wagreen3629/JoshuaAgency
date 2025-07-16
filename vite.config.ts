import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    sourcemap: true
  },
  server: {
    sourcemap: 'inline'
  },
  ssr: {
    noExternal: ['src/lib/supabaseAdmin.ts']
  }
});
