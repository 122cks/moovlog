import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SharedArrayBuffer 활성화를 위한 COOP/COEP 헤더
// credentialless: Firebase Storage · CDN 리소스의 cross-origin 임베딩 허용 (require-corp보다 관대)
const COI_HEADERS = {
  'Cross-Origin-Opener-Policy':   'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
};

export default defineConfig({
  plugins: [react()],
  base: '/moovlog/shorts-creator/',
  publicDir: 'public',
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  server: {
    headers: COI_HEADERS,
  },
  preview: {
    headers: COI_HEADERS,
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: false,
    reportCompressedSize: false,
    emptyOutDir: false,
    rollupOptions: {
      treeshake: false,
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'vendor-firebase';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
