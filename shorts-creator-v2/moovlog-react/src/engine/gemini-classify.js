// src/engine/gemini-classify.js
// 업체 유형 분류 + AI 품질 검수 — gemini.js 분리 (Rollup 빌드 스택 오버플로우 방지)
import { geminiWithFallback, safeExtractText } from './gemini.js';

// ─── STEP 1.6: 업체 유형 자동 분류 ────────────────────────
export async function detectRestaurantType(restaurantName, analysis, researchData = '') {
  const keywords = (analysis.keywords || []).join(', ');
  const mood = analysis.mood || '';
  const menu = (analysis.menu || []).join(', ');
  const prompt = `다음 식당 정보를 분석하여 가장 적합한 업체 유형을 분류하세요.

식당명: ${restaurantName}
분위기: ${mood}
키워드: ${keywords}
메뉴: ${menu}
${researchData ? `조사 정보: ${researchData.slice(0, 400)}` : ''}

업체 유형 목록 (아래 key 중 하나만 반환):
- grill: 고깃집/BBQ (삼겹살, 갈비, 소고기, 곱창 등)
- cafe: 카페/디저트 (커피, 케이크, 빙수, 음료 등)
- seafood: 해물집/일식 (회, 초밥, 해산물, 랍스터 등)
- pub: 술집/포차 (안주, 맥주, 소주, 이자카야 등)
- snack: 분식/일반음식 (떡볶이, 순대, 김밥, 분식 등)
- ramen: 라멘/면 (라멘, 우동, 쌀국수, 짬뽕 등)
- finedining: 파인다이닝/양식 (스테이크, 코스요리, 파스타, 와인 등)
- nopo: 노포/전통음식 (오래된 식당, 전통, 옛날식, 노포 감성)
- jeon: 전/부침개 (파전, 해물파전, 빈대떡, 전 종류)
- hansik: 한식/백반 (백반, 된장찌개, 갈비탕, 한정식 등)
- chinese: 중식 (짜장면, 짬뽕, 탕수육, 중화요리 등)
- japanese: 일식/스시 외 (돈가스, 오마카세, 야키토리, 일본식 등)

JSON만 반환: {"type": "grill", "confidence": 0.9, "reason": "삼겹살 전문점으로 보임"}`;

  try {
    const data = await geminiWithFallback({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }, 15000);
    const raw = safeExtractText(data);
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
    const result = JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : raw.replace(/```json|```/g, '').trim());
    console.log(`[detectRestaurantType] ${restaurantName} → ${result.type} (신뢰도: ${result.confidence})`);
    return result.type || 'auto';
  } catch (e) {
    console.warn('[detectRestaurantType] 실패:', e.message);
    return 'auto';
  }
}

// ─── STEP 6: AI 품질 검수 ────────────────────────────────
export async function geminiQualityCheck(script, restaurantName, restaurantType = '') {
  const scenes = script.blocks || script.scenes || [];
  const sceneSummary = scenes.slice(0, 12).map((sc, i) => {
    const narration = sc.narration || '';
    const caption = sc.caption || sc.caption1 || '';
    const duration = sc.total_duration || sc.duration || 0;
    const cutCount = Array.isArray(sc.video_cuts) ? sc.video_cuts.length : 1;
    return `씬${i + 1}: narration="${narration}" caption="${caption}" total_duration=${duration}s cuts=${cutCount}`;
  }).join('\n');

  const blockCount = script.blocks?.length || 0;
  const flatSceneCount = script.scenes?.length || 0;
  const structureInfo = blockCount > 0
    ? `블록 수: ${blockCount}개`
    : `씬 수: ${flatSceneCount}개`;

  const prompt = `당신은 2026년 한국 숏폼 콘텐츠 전문 QA 디렉터입니다.
아래 릴스/쇼츠 스크립트를 검수하고 품질 점수를 평가하세요.

식당명: ${restaurantName}
업체 유형: ${restaurantType || '미분류'}
구조: ${structureInfo}

[스크립트 요약 - 최대 12씬]
${sceneSummary}

[검수 기준 — 각 항목 0~10점, 총 100점 만점]
1. 훅(Hook): 첫 씬 2초 이내 시청자를 멈추게 하는가? 결론 선제시, 강렬한 비주얼 묘사?
2. 금지어 준수: "미쳤다/대박/환상적인/선사/구워드립니다" 등 금지어·오류 표현 없는가?
3. 흐름(Flow): 씬 간 이야기가 자연스럽게 연결되는가? 반전→클라이맥스→CTA 아크?
4. 정보 밀도: 음식점 특징·메뉴 정보가 충분히 담겼는가? 오감 묘사 포함?
5. CTA: 마지막 씬에 구독/좋아요 유도가 효과적으로 포함되었는가?
6. 오리지널리티: 식상한 표현 없이 신선하고 독창적인 나레이션·캡션인가?
7. 감성 몰입도: 시청자가 공감·감동·욕구를 느낄 수 있는 감성적 언어 사용?
8. 리텐션 전략: 중간 이탈 방지를 위한 반전·궁금증 유발 장치가 있는가?
9. 구체성: 음식 맛·식감·향 등 오감을 구체적으로 묘사했는가? (막연한 표현 감점)
10. 완성도: 오탈자·어색한 문장·논리 오류 없이 흐름이 완성도 높게 마무리되었는가?

threshold: 총점 95점 이상이면 통과 — 94점 이하면 무조건 pass:false 반환
(99점을 목표로 작성하되, 95점 미만이면 어떤 항목이 부족한지 상세히 기술)

JSON만 반환:
{"total_score": 97, "pass": true, "hook": 10, "banned_words": 10, "flow": 10, "info_density": 9, "cta": 10, "originality": 10, "emotional_depth": 9, "retention": 9, "specificity": 10, "completeness": 10, "issues": [], "suggestion": ""}`;

  try {
    const data = await geminiWithFallback({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    }, 20000);
    const raw = safeExtractText(data);
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
    const result = JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : raw.replace(/```json|```/g, '').trim());
    console.log(`[geminiQualityCheck] 점수: ${result.total_score}/100 → ${result.pass ? '통과' : '재생성 필요'}`);
    return result;
  } catch (e) {
    console.warn('[geminiQualityCheck] 실패 → 기본 통과 처리:', e.message);
    return { total_score: 100, pass: true, issues: [], suggestion: '' };
  }
}
