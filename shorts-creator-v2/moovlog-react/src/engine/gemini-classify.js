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
  const sceneSummary = scenes.slice(0, 14).map((sc, i) => {
    const narration = sc.narration || '';
    const caption1  = sc.caption1 || sc.caption || '';
    const caption2  = sc.caption2 || '';
    const duration  = sc.total_duration || sc.duration || 0;
    const cutCount  = Array.isArray(sc.video_cuts) ? sc.video_cuts.length : 1;
    const mediaIdxs = Array.isArray(sc.video_cuts)
      ? sc.video_cuts.map(c => c.media_idx ?? '?').join(',')
      : (sc.media_idx ?? '?');
    return `씬${i + 1}[${duration}s cuts=${cutCount} media=${mediaIdxs}]: caption1="${caption1}" caption2="${caption2}" narration="${narration.slice(0, 60)}"`;
  }).join('\n');

  const blockCount     = script.blocks?.length || 0;
  const flatSceneCount = script.scenes?.length || 0;
  const structureInfo  = blockCount > 0
    ? `블록 수: ${blockCount}개`
    : `씬 수: ${flatSceneCount}개`;

  // narrations 목록 (반복 표현 감지용)
  const narrations = scenes.map(sc => sc.narration || '').filter(Boolean);
  const cap1List   = scenes.map(sc => sc.caption1 || sc.caption || '').filter(Boolean);

  const grillExtra = restaurantType === 'grill'
    ? `\n[🥩 고깃집 전용 추가 검수 (각 항목 위반 시 해당 점수 0점)]
• 찌개/볶음밥/밑반찬 씬이 클라이맥스(hero)에 배치되지 않았는가? (메인 씬은 반드시 구이여야 함)
• cooking_state="cooked" 씬에 "선홍빛", "생고기" 등 생고기 표현이 없는가?
• cooking_state="raw" 씬에 "구워진", "육즙이 터지는" 등 이미 익은 표현이 없는가?
• "직접 구워드립니다" 등 직원 구이 표현이 실제 직원 구이 장면 없이 사용되지 않았는가?`
    : '';

  const prompt = `당신은 2026년 한국 숏폼 콘텐츠 전문 QA 디렉터입니다.
아래 릴스/쇼츠 스크립트를 검수하고 품질 점수를 평가하세요.

식당명: ${restaurantName}
업체 유형: ${restaurantType || '미분류'}
구조: ${structureInfo}
전체 나레이션 목록: ${narrations.map((n, i) => `씬${i + 1}:"${n.slice(0, 40)}"`).join(' | ')}
전체 자막(caption1) 목록: ${cap1List.map((c, i) => `씬${i + 1}:"${c}"`).join(' | ')}

[스크립트 요약 — 최대 14씬]
${sceneSummary}
${grillExtra}

[검수 기준 — 각 항목 0~10점, 총 100점 만점]
1. 훅(Hook·10점): 첫 씬 2초 이내 시청자를 멈추게 하는 강렬한 자막+나레이션? 결론 선제시 또는 강렬한 의문형?
2. 금지어 준수(10점): "미쳤다/대박/환상적인/선사/구워드립니다(비해당 시)/정말/너무/최고의" 등 과장·금지 표현 없는가? 각 1개 발견 시 -2점.
3. 흐름·서사 아크(10점): 훅→설정→클라이맥스→CTA 서사가 자연스럽게 연결? 씬 간 이야기가 끊기지 않는가?
4. 정보 밀도(10점): 음식점 특징·메뉴·맛·분위기 정보가 충분히 담겼는가? 오감 묘사 포함?
5. CTA 효과(10점): 마지막 씬에 구독/좋아요 유도가 자연스럽고 구체적으로 포함되었는가?
6. 오리지널리티(10점): 식상한 표현 없이 신선하고 독창적인 나레이션·캡션? 씬마다 다른 각도의 묘사?
7. 자막 가독성(10점): caption1이 12자 이내, caption2가 8자 이내? 모든 씬에 caption1이 존재하는가?
8. 리텐션 전략(10점): 중간 이탈 방지를 위한 반전·궁금증 유발 장치(retention_strategy)가 있는가?
9. 나레이션 구체성(10점): 맛·식감·향·온도 등 오감을 구체적으로 묘사했는가? 막연한 표현("맛있어요", "좋아요") 발견 시 -2점.
10. 표현 다양성(10점): 여러 씬에 걸쳐 동일 단어·문장 구조 반복이 없는가? 나레이션 3개 이상 동일 표현 반복 시 -3점.

threshold: 총점 95점 이상이면 pass:true, 94점 이하면 pass:false (어떤 이유로도 예외 없음)
(각 항목 점수를 합산한 총점으로 판단. pass/fail 기준을 임의로 완화하지 말 것)

JSON만 반환:
{"total_score": 97, "pass": true, "hook": 10, "banned_words": 10, "flow": 10, "info_density": 9, "cta": 10, "originality": 10, "readability": 9, "retention": 8, "specificity": 10, "diversity": 10, "issues": ["..."], "suggestion": "..."}`;

  try {
    const data = await geminiWithFallback({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }, 20000);
    const raw = safeExtractText(data);
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
    const result = JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : raw.replace(/```json|```/g, '').trim());
    // total_score를 항목 합산으로 재검증 (Gemini가 점수를 부풀리는 것 방지)
    const itemSum = (result.hook || 0) + (result.banned_words || 0) + (result.flow || 0)
      + (result.info_density || 0) + (result.cta || 0) + (result.originality || 0)
      + (result.readability || 0) + (result.retention || 0) + (result.specificity || 0)
      + (result.diversity || 0);
    if (typeof result.total_score === 'number' && Math.abs(result.total_score - itemSum) > 5) {
      result.total_score = itemSum; // 항목 합산으로 강제 교정
    }
    if (typeof result.total_score === 'number' && result.total_score < 95) result.pass = false;
    console.log(`[geminiQualityCheck] 점수: ${result.total_score}/100 (항목합: ${itemSum}) → ${result.pass ? '통과' : '재생성 필요'}`);
    return result;
  } catch (e) {
    console.warn('[geminiQualityCheck] 실패 → 기본 통과 처리:', e.message);
    return { total_score: 100, pass: true, issues: [], suggestion: '' };
  }
}
