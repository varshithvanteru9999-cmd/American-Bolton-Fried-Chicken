import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Split big vendor libraries into separate chunks so they download in
        // parallel and cache independently (smaller initial parse on mobile).
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (id.includes('sweetalert2')) return 'sweetalert';
          if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react-vendor';
          return 'vendor';
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Adds our Web Push handlers to the generated service worker.
        importScripts: ['push-sw.js'],
      },
      manifest: {
        name: "American Fried Chicken Ltd",
        short_name: 'AFC Bolton',
        description: 'Order proper fried chicken online from American Fried Chicken Ltd, Bolton',
        id: '/',
        theme_color: '#F8F6F1',
        background_color: '#F8F6F1',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
