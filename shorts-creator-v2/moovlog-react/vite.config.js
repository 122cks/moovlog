import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/moovlog/shorts-creator/',   // GitHub Pages 경로 — 기존과 동일
  publicDir: 'public',
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
