import { describe, it, expect } from 'vitest';
import { parseVisionAnalysis } from '@/schemas/visionSchema';
import { parseGeneratedScript } from '@/schemas/scriptSchema';

// ── Vision 스키마 검증 ────────────────────────────────────────────
describe('parseVisionAnalysis', () => {
  it('정상 JSON을 파싱한다', () => {
    const input = JSON.stringify({
      keywords: ['맛집', '서울', '한식', '데이트', '가성비'],
      mood: '따뜻한 저녁빛',
      menu: ['김치찌개', '된장찌개'],
      visual_hook: '국물 한 스푼에 겨울이 녹는다',
      recommended_order: [0, 1, 2],
      recommended_template: 'aesthetic',
      recommended_hook: 'question',
      per_image: [
        {
          idx: 0,
          type: 'hero',
          best_effect: 'zoom-in',
          emotional_score: 9,
          suggested_duration: 3.5,
          focus: '김치찌개 클로즈업',
          focus_coords: { x: 0.5, y: 0.4 },
        },
      ],
    });
    const result = parseVisionAnalysis(input);
    expect(result.mood).toBe('따뜻한 저녁빛');
    expect(result.per_image).toHaveLength(1);
    expect(result.per_image[0].type).toBe('hero');
  });

  it('markdown 코드펜스를 제거하고 파싱한다', () => {
    const input =
      '```json\n{"keywords":["k1","k2","k3","k4","k5"],"mood":"m","menu":[],"visual_hook":"h","recommended_order":[0],"recommended_template":"viral","recommended_hook":"shock","per_image":[]}\n```';
    const result = parseVisionAnalysis(input);
    expect(result.recommended_template).toBe('viral');
  });

  it('규격 위반 시 오류를 던진다', () => {
    expect(() => parseVisionAnalysis('{"mood": "ok"}')).toThrow();
  });
});

// ── Script 스키마 검증 ────────────────────────────────────────────
describe('parseGeneratedScript', () => {
  const validScript = {
    hook: '이거 진짜 미쳤다',
    summary: '서울 최고 맛집 탐방',
    tags: ['#맛집', '#서울맛집'],
    youtube_title: '[맛집] 서울 숨은 맛집',
    youtube_desc: '서울 최고의 맛집을 소개합니다',
    instagram_caption: '서울 맛집 발굴 🍜',
    scenes: [
      {
        media_idx: 0,
        caption1: '육즙 터짐',
        caption2: '저장 필수',
        narration: '이 한 입에 모든 게 담겼습니다',
        duration: 3.0,
        effect: 'zoom-in',
        subtitle_position: 0.82,
        transition: 'fade',
      },
    ],
  };

  it('정상 스크립트를 파싱한다', () => {
    const result = parseGeneratedScript(JSON.stringify(validScript));
    expect(result.scenes).toHaveLength(1);
    expect(result.scenes[0].caption1).toBe('육즙 터짐');
  });

  it('duration이 1.0 미만이면 오류를 던진다', () => {
    const bad = { ...validScript, scenes: [{ ...validScript.scenes[0], duration: 0.1 }] };
    expect(() => parseGeneratedScript(JSON.stringify(bad))).toThrow();
  });
});
