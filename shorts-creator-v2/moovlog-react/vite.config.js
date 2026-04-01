import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/moovlog/shorts-creator/',   // GitHub Pages 寃쎈줈 ??湲곗〈怨??숈씪
  publicDir: 'public',
  // FFmpeg WASM: Vite dev server媛 ?ъ쟾 踰덈뱾留곹븯吏 ?딅룄濡?exclude
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  // FFmpeg WASM???붽뎄?섎뒗 SharedArrayBuffer瑜??꾪븳 COOP/COEP ?ㅻ뜑 (dev server)
  server: {
    headers: {
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  build: {
    target: 'esnext',                 // WebCodecs, AudioWorklet 吏??    outDir: 'dist',
    minify: false,                    // ?꾩떆: ??⑸웾 ?뚯씪 Rollup OOM ?고쉶
      reportCompressedSize: false,
      emptyOutDir: false,
      rollupOptions: {
      treeshake: false,
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "vendor-react";
          if (id.includes("node_modules/firebase")) return "vendor-firebase";
          if (id.includes("node_modules")) return "vendor";
          if (id.includes("gemini-script")) return "engine-script";
          if (id.includes("gemini")) return "engine-gemini";
          if (id.includes("/engine/")) return "engine-core";
        },
      },
    },
    },
    worker: {
      format: 'es',
    },
});
