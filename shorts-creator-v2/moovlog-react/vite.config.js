import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/moovlog/shorts-creator/',   // GitHub Pages 경로 — 기존과 동일
  publicDir: 'public',
  // FFmpeg WASM: Vite dev server가 사전 번들링하지 않도록 exclude
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  // FFmpeg WASM이 요구하는 SharedArrayBuffer를 위한 COOP/COEP 헤더 (dev server)
  server: {
    headers: {
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  build: {
    target: 'es2022',                 // WebCodecs, AudioWorklet 지원
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':   ['react', 'react-dom'],
          'vendor-muxers':  ['mp4-muxer', 'webm-muxer'],
          'vendor-firebase':['firebase/app', 'firebase/storage', 'firebase/firestore'],
        },
      },
    },
  },
});
