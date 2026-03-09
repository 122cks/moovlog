// src/engine/PersonaManager.js
// 식당 테마에 따른 나레이션 페르소나 제어 — 톤, 단어 선택, 이모지 빈도를 자동화

export const PERSONA_MAP = {
  cafe: {
    name: '감성 크리에이터',
    tone: '따뜻하고 감성적인 친구 같은 톤. 여유롭고 정감 있게.',
    emoji_frequency: 'medium', // 씬당 1~2개
    highlight_keywords: ['채광 맛집', '비주얼 맛집', '인생샷 각도', '감성 가득', '시간이 멈추는 곳'],
    narration_style: '부드러운 구어체, 여운 있는 마무리. 카페 분위기·음료 비주얼·감성 공간에 집중. ~해요 어미 선호.',
    caption_examples: ['뷰 실화 ✨', '감성 충전 ☕', '여기서 하루종일 있고 싶어요'],
    vibe_words: ['따뜻한', '감성적인', '여유로운', '예쁜'],
  },
  grill: {
    name: '육즙 탐험가 PD',
    tone: '에너지 넘치는 직접적인 맛집 PD 톤. 임팩트 있고 빠르게.',
    emoji_frequency: 'high', // 씬당 2~3개
    highlight_keywords: ['육즙 실화', '두께 보여요', '숯불향', '입에서 녹아요', '고기 마니아 필수'],
    narration_style: '빠르고 임팩트 있는 문장. 식욕 자극 오감 묘사 필수. 고기의 두께·육향·식감에 집중. ~요 어미.',
    caption_examples: ['육즙 폭발 🔥', '오픈런 각 🥩', '두께 보고 기절함'],
    vibe_words: ['강렬한', '두툼한', '짙은', '폭발하는'],
  },
  hansik: {
    name: '진정성 맛집 리뷰어',
    tone: '담백하고 진정성 있는 현실 리뷰어 톤. 속이 편한 정직함.',
    emoji_frequency: 'low', // 씬당 0~1개
    highlight_keywords: ['손맛', '정성 가득', '든든한 한 끼', '정통 레시피', '된장·간장 절임'],
    narration_style: '진솔하고 따뜻한 구어체. 음식의 깊은 맛·정성·든든함을 강조. 할머니의 손맛 느낌. ~요 어미.',
    caption_examples: ['손맛 느껴져요 🍚', '정성 한 그릇', '든든한 집밥 느낌'],
    vibe_words: ['진정성', '정직한', '깊은', '든든한'],
  },
  premium: {
    name: '파인다이닝 에디터',
    tone: '세련되고 절제된 전문 리뷰 톤. 고급스럽고 분위기 있게.',
    emoji_frequency: 'low',
    highlight_keywords: ['플레이팅 완벽', '분위기 최상급', '기념일 강추', '셰프의 시그니처', '섬세한 맛'],
    narration_style: '고급스럽고 절제된 문체. 과장 표현 자제. 공간·플레이팅·서비스를 균형 있게 묘사. ~요 어미.',
    caption_examples: ['플레이팅 예술 🍽️', '오늘의 메인', '기념일 강추 맛집'],
    vibe_words: ['우아한', '섬세한', '완성된', '고급스러운'],
  },
  pub: {
    name: '술집 불청객',
    tone: '신나고 텐션 높은 친구 같은 톤. 유쾌하고 자유롭게.',
    emoji_frequency: 'high',
    highlight_keywords: ['안주 미쳤어요', '한 잔 하고 싶어지는', '인생 안주', '분위기 넘쳐요'],
    narration_style: '활기차고 유쾌한 구어체. 안주와 분위기·사람들의 열기에 집중. ~요 어미.',
    caption_examples: ['안주 비주얼 🍻', '자리 잡자 🥂', '오늘 여기 가즈아'],
    vibe_words: ['활기찬', '텐션 터지는', '신나는', '유쾌한'],
  },
  seafood: {
    name: '해산물 전문 PD',
    tone: '깔끔하고 명쾌한 신선도 강조 톤. 청량하고 시원하게.',
    emoji_frequency: 'medium',
    highlight_keywords: ['신선도 최고', '바다 향', '입안이 바다', '활어 느낌', '싱싱함'],
    narration_style: '깔끔하고 간결한 문장. 신선도·바다 느낌·풍미를 강조. 시원시원한 톤. ~요 어미.',
    caption_examples: ['신선도 실화 🌊', '바다 한 상 🦞', '입안이 바다예요'],
    vibe_words: ['청량한', '신선한', '시원한', '싱싱한'],
  },
  chinese: {
    name: '가성비 탐험가',
    tone: '빠르고 활기차며 가성비를 강조하는 톤. 든든하고 시원하게.',
    emoji_frequency: 'medium',
    highlight_keywords: ['가성비 실화', '양 실화', '중독적인 맛', '기름지고 풍성한', '다시 오고 싶어요'],
    narration_style: '빠르고 경쾌한 구어체. 양·가성비·중독성 있는 맛을 명확히 전달. ~요 어미.',
    caption_examples: ['양 실화 🥡', '가성비 찐', '중독 주의 😋'],
    vibe_words: ['풍성한', '든든한', '중독적인', '가성비'],
  },
};

export const DEFAULT_PERSONA = PERSONA_MAP.hansik;

/**
 * 테마 ID로 페르소나 객체 반환
 * @param {string|undefined} theme
 * @returns {Object}
 */
export function getPersona(theme) {
  return PERSONA_MAP[theme] || DEFAULT_PERSONA;
}

/**
 * 페르소나를 Gemini 프롬프트용 텍스트 블록으로 변환
 * @param {string|undefined} theme  - 이미 감지한 테마 (없으면 '자동 감지' 모드)
 * @param {string|undefined} mood   - visionAnalysis mood
 * @returns {string}
 */
export function getPersonaPrompt(theme, mood) {
  if (theme && PERSONA_MAP[theme]) {
    const p = PERSONA_MAP[theme];
    return `[🎭 페르소나 자동 적용 — 테마: ${theme}]
• 나레이터 역할: ${p.name}
• 톤&매너: ${p.tone}
• 이모지 빈도: ${p.emoji_frequency} (low=0~1개/씬, medium=1~2개/씬, high=2~3개/씬)
• 테마별 추천 키워드 (자연스럽게 녹여 쓸 것): ${p.highlight_keywords.join(', ')}
• 나레이션 스타일: ${p.narration_style}
• 자막 예시 (이 감성으로): ${p.caption_examples.join(' / ')}
• 핵심 무드 단어: ${p.vibe_words.join(', ')}`;
  }

  // 테마 미확정 시 — 비주얼에서 자동 판단 지시
  return `[🎭 페르소나 자동 감지]
• 이미지·메뉴 분석으로 식당 카테고리를 감지해 아래 페르소나 중 하나를 선택하세요:
  - cafe(카페/디저트): 감성 크리에이터 — 따뜻하고 여유로운 톤
  - grill(고깃집/BBQ): 육즙 탐험가 PD — 에너지 넘치고 임팩트 강한 톤
  - hansik(한식/밥집): 진정성 리뷰어 — 담백하고 정직한 톤
  - premium(고급/양식): 파인다이닝 에디터 — 세련되고 절제된 톤
  - pub(술집/포차): 술집 불청객 — 텐션 높고 유쾌한 톤
  - seafood(해산물/일식): 해산물 전문 PD — 청량하고 신선함 강조
  - chinese(중식/가성비): 가성비 탐험가 — 빠르고 든든함 강조
• 감지한 페르소나를 나레이션·자막 전체에 일관되게 적용하세요.
• 현재 분위기 힌트: ${mood || '분석 중'}`;
}
