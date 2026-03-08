/* ============================================================
   components/UploadPhase.tsx — 파일 업로드 + 만들기 버튼
   ============================================================ */
import { useCallback, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { TemplatePicker } from '@/components/TemplatePicker';
import { runPipeline } from '@/hooks/usePipeline';
import type { MediaItem } from '@/types/state';

export function UploadPhase() {
  const files         = useAppStore((s) => s.files);
  const addFiles      = useAppStore((s) => s.addFiles);
  const removeFile    = useAppStore((s) => s.removeFile);
  const name          = useAppStore((s) => s.restaurantName);
  const setName       = useAppStore((s) => s.setRestaurantName);
  const pushToast     = useAppStore((s) => s.pushToast);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]  = useState(false);

  const acceptFiles = useCallback((raw: File[]) => {
    const valid = raw.filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (!valid.length) { pushToast('이미지 또는 영상 파일만 올려주세요', 'err'); return; }
    if (files.length + valid.length > 10) { pushToast('최대 10개까지 가능합니다', 'err'); return; }
    const items: MediaItem[] = valid.map((f) => ({
      file: f,
      url:  URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image',
    }));
    addFiles(items);
  }, [files.length, addFiles, pushToast]);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    acceptFiles([...e.dataTransfer.files]);
  };

  const handleStart = () => {
    if (!files.length) { pushToast('이미지 또는 영상을 올려주세요', 'err'); return; }
    if (!name.trim())  { pushToast('음식점 이름을 입력해주세요', 'err'); return; }
    runPipeline();
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10">
      {/* 헤더 */}
      <header className="text-center">
        <h1 className="font-display text-3xl font-black tracking-tight">
          무브먼트 <span className="text-brand-pink">Shorts</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-400">AI 맛집 숏폼 자동 생성</p>
      </header>

      {/* 드롭 존 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition
          ${dragging ? 'border-brand-pink bg-brand-pink/5' : 'border-zinc-700 hover:border-zinc-500'}`}
      >
        <span className="text-4xl">📸</span>
        <p className="text-sm text-zinc-400">
          이미지·영상을 드래그하거나 <span className="text-brand-pink">클릭</span>하세요
        </p>
        <p className="text-xs text-zinc-600">최대 10개, 영상·이미지 혼합 가능</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => { acceptFiles([...e.target.files ?? []]); e.target.value = ''; }}
        />
      </div>

      {/* 썸네일 그리드 */}
      {files.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {files.map((item, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-zinc-800">
              {item.type === 'image' ? (
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <video src={item.url} className="h-full w-full object-cover" muted />
              )}
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-bold">{i + 1}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] leading-none text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 음식점 이름 */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        placeholder="음식점 이름 (예: 을지로 감자탕)"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-brand-pink focus:ring-1 focus:ring-brand-pink"
      />

      {/* 템플릿 선택 */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">콘텐츠 스타일</h2>
        <TemplatePicker />
      </div>

      {/* 만들기 버튼 */}
      <button
        onClick={handleStart}
        disabled={!files.length || !name.trim()}
        className="w-full rounded-2xl bg-brand-pink py-4 font-display text-lg font-black tracking-tight transition
          hover:bg-pink-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        🎬 숏폼 만들기
      </button>
    </div>
  );
}
