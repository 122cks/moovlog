import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// GitHub Actions에서 VITE_GEMINI_KEY 등의 환경변수로 API 키 주입
// .env.local (로컬 개발) 또는 Actions secrets → VITE_ 접두사로 노출
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    target: 'es2022',          // WebCodecs, OffscreenCanvas 지원
    outDir: '../shorts-creator', // 빌드 결과를 기존 경로에 출력
    emptyOutDir: false,         // 기존 정적 파일(bgm/, icons) 보존
    rollupOptions: {
      output: {
        // 청크 분리: vendor / render / api / app
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand', 'zod'],
          muxer: ['webm-muxer'],
        },
      },
    },
  },
  // 개발 서버: CORS 없이 Gemini API 직접 호출 가능하도록 프록시 제거 (VITE_GEMINI_KEY 사용)
  server: {
    port: 5173,
    open: true,
    // FastAPI 백엔드 프록시 (uv run uvicorn main:app --port 8000)
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  // Vitest 설정
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
