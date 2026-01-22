import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remove-importmap',
      transformIndexHtml: {
        order: 'pre',
        handler(html, { bundle }) {
          // The 'bundle' object is only present during a production build ('vite build').
          // We remove the importmap script tag to ensure Vite's bundled assets are used 
          // in production, avoiding resolution conflicts with external URLs.
          if (bundle) {
            return html.replace(/<script type="importmap">[\s\S]*?<\/script>/i, '');
          }
          return html;
        },
      },
    },
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});