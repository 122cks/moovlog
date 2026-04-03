// src/engine/gemini-script.js
// generateScript 분리 — gemini.js Rollup 빌드 스택 오버플로우 방지
import { toB64, extractVideoFramesB64, apiPost, getApiUrl, safeExtractText } from './gemini.js';
import { useVideoStore, TEMPLATE_HINTS, HOOK_HINTS, VIRAL_TRENDS } from '../store/videoStore.js';
import { getPersonaPrompt } from './PersonaManager.js';

export async function generateScript(restaurantName, analysis, userPrompt = '', researchData = '', restaurantType = '', requiredKeywords = '') {
  const { files, selectedTemplate, selectedHook } = useVideoStore.getState();
  const pi    = analysis.per_image || [];
  const order = analysis.recommended_order?.length ? analysis.recommended_order : files.map((_, i) => i);
  const exteriorIdx = analysis.per_image?.find(p => p.is_exterior === true)?.idx;
  const exteriorInfo = exteriorIdx !== undefined
    ? `\n• [★ 외관 강제 배치] ${exteriorIdx}번 미디어가 가게 외관으로 분석되었습니다. 마지막 씬의 media_idx는 반드시 ${exteriorIdx}로 설정하세요.`
    : '';
  // 영상 파일 media_idx 목록 (완전 인덱스 기준)
  const videoIdxs = files.map((f, i) => f.type === 'video' ? i : -1).filter(i => i >= 0);
  const videoRule = videoIdxs.length
    ? `\n[\uD83C\uDFAC \ub3d9\uc601\uc0c1 \ud30c\uc77c \ubc30\uce58 \uc6b0\uc120\uc21c\uc704 \uaddc\uce59 \u2014 \uc808\ub300 \uc900\uc218]\n\u2022 \uc5c5\ub85c\ub4dc\ub41c \ub3d9\uc601\uc0c1(\uc601\uc0c1) \ud30c\uc77c media_idx \ubaa9\ub85d: [${videoIdxs.join(', ')}]\n\u2022 \uc704 media_idx\ub4e4\uc740 \ud6c5(\uc4241)\uacfc \ud074\ub77c\uc774\ub9e5\uc2a4 \uc528\uc5d0 \ubc18\ub4dc\uc2dc 1\uc21c\uc704\ub85c \ubc30\uce58\ud558\uc138\uc694.\n\u2022 \ub3d9\uc601\uc0c1 \ud30c\uc77c\uc774 \uc788\ub294\ub370 \uc804\uccb4 \uc528\uc744 \uc815\uc9c0 \uc774\ubbf8\uc9c0\ub9cc\uc73c\ub85c \ucc44\uc6b0\ub294 \uac83\uc740 \uc808\ub300 \uae08\uc9c0\ub429\ub2c8\ub2e4.\n\u2022 \ub3d9\uc601\uc0c1\uc744 \ucd5c\ub300\ud55c \uad50\ucc28 \ubc30\uce58\ud558\uc138\uc694 (\uc0c1\ub098 2\uac1c \uc4241\ub9c8\ub2e4 \ub3d9\uc601\uc0c1 1\uac1c \uc774\uc0c1 \ub303\uc2b9).`
    : '';
  const imgSummary = pi.map(p => {
    const mediaLabel = files[p.idx]?.type === 'video' ? '\uD83C\uDFAC\uc601\uc0c1' : '\uD83D\uDDBC\uFE0F\uc774\ubbf8\uc9c0';
    return `${mediaLabel}${p.idx}(${p.type}/\uac10\uc131${p.emotional_score}\uc810${p.is_exterior ? '/\uD83C\uDFEA\uc678\uad00' : ''}): \ud6a8\uacfc=${p.best_effect}, ${p.suggested_duration}s, focus="${p.focus}", narration_hint="${p.narration_hint || p.focus || ''}"` ;
  }).join('\n');

  const isTrend = VIRAL_TRENDS[selectedTemplate];
  // 블록 수 목표: 트렌드는 정확한 씬 수, 일반은 5-7개로 제한 (파일 수와 무관)
  const sceneCountTarget = isTrend
    ? isTrend.durations.length
    : Math.max(5, Math.min(Math.ceil(files.length / 2.5), 7));
  const totalTarget = isTrend
    ? isTrend.durations.reduce((a, v) => a + v, 0)
    : Math.max(sceneCountTarget * 4, 22);  // 블록당 약 4s 기준, 최소 22s

  // generateScript는 visionAnalysis 추천 순서 상위 10개 파일만 참조 (payload 최적화)
  const topFileIdxs = (analysis.recommended_order?.length
    ? analysis.recommended_order.slice(0, 10)
    : Array.from({ length: Math.min(files.length, 10) }, (_, i) => i)
  ).filter(i => i < files.length);

  const _imgPartsArr = await Promise.all(
    topFileIdxs.map(async (i) => {
      const m = files[i];
      const textPart = { text: `\n--- [원본 미디어 번호 media_idx: ${i}] ---` };
      if (m.type === 'image') {
        try {
          const b64 = await toB64(m.file);
          return [textPart, { inline_data: { mime_type: m.file.type || 'image/jpeg', data: b64 } }];
        } catch (_) { return [textPart]; }
      } else {
        try {
          const frames = await extractVideoFramesB64(m.file, 2);
          return [textPart, ...frames.map(fr => ({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } }))];
        } catch (_) { return [textPart]; }
      }
    })
  );
  const imgParts = _imgPartsArr.flat();

  const trendInstruction = isTrend ? `
[🚨 바이럴 트렌드 템플릿 강제 규칙 🚨]
"${isTrend.name}" 포맷 — 정확히 ${sceneCountTarget}개 블록으로 구성.
각 블록의 total_duration 목표: ${(totalTarget / sceneCountTarget).toFixed(1)}초 내외 (3.0~5.5초 범위 내).
이 템플릿의 에너지감을 살리되, 블록의 total_duration은 반드시 3.0초 이상이어야 합니다.
video_cuts 개별 컷은 0.5~2.5초로 다양하게 조합하여 이 템플릿만의 리듬감을 구현하세요.
` : '';

  const restaurantTypeHint = restaurantType
    ? '[업체 유형: ' + restaurantType + '] — 이 업체 유형의 2026 트렌드·분위기·고객층에 최적화된 나레이션과 자막 스타일을 적용하세요.\n'
    : '';

  // ─── 블록 구조 (고깃집 전용 vs 일반) ─────────────────────
  const ctaBlock = `마지막 블록 CTA(total_duration 3.0~4.5s): 식당(${restaurantName})에 대한 임팩트 있는 한 줄 요약 + 시청자에게 "구독, 좋아요, 댓글"을 자연스럽게 유도하는 아웃트로 나레이션 필수 포함. caption에 식당 이름 또는 핵심 카피, caption2에 "구독 & 좋아요 꾹!" 또는 "무브먼트 구독하기" 형태의 CTA 문구를 반드시 넣을 것. subtitle_style은 반드시 "cta"로 지정.${exteriorInfo}`;
  const blockStructureText = restaurantType === 'grill'
    ? `[★ 🥩 고깃집/BBQ 전용 방문 서사 — 아래 씬 순서를 반드시 준수하세요. 총 ${totalTarget}초 목표 ★]
블록1 상차림/식전주스 훅(total_duration 3.0~4.5s): 테이블 전체 풀샷 — 식전주스·기본찬이 한눈에 보이는 임팩트 첫 컷. retention_strategy: "opening_question", energy_level 4~5.
블록2 밑반찬(total_duration 2.5~3.5s): 정갈한 밑반찬 클로즈업 또는 풀샷. energy_level 2~3.
블록3 찌개·계란찜 등 보조 요리(total_duration 3.0~4.0s): 찌개·계란찜·된장국 등 서브 요리. retention_strategy: "midpoint_reveal", energy_level 3.
블록4 고기 빛깔(total_duration 3.0~4.5s): 생원육 클로즈업 — 두께·마블링·색감 강조. energy_level 3~4.
블록5 🔥 고기 굽기 클라이맥스(total_duration 4.0~5.5s): 굽는 장면·지글지글·익어가는 역동 컷. energy_level 5, retention_strategy: "climax".
블록6 마무리 볶음밥/냉면(total_duration 2.5~3.5s / ⚠️ 해당 미디어 없으면 이 블록 전체 생략): 마무리 메뉴 클로즈업. energy_level 2~3.
${ctaBlock}`
    : `[★ 총 ${totalTarget}초, ${sceneCountTarget}개 블록으로 구성 — 파일 ${files.length}개 업로드됐어도 블록은 반드시 ${sceneCountTarget}개 이내, 한 블록에 미디어 여러 개 교차 편집 ★]
블록1 발견/훅(total_duration 3.0~4.5s): 강렬한 첫 비주얼 + 궁금증 유발 자막
블록2 설정/기대(total_duration 3.5~4.5s): 이 곳이 특별한 이유, 분위기·비하인드
블록3 클라이맥스 전(total_duration 3.5~4.5s): 대표 메뉴 등장, 텍스처·디테일
블록4 감정 피크(total_duration 3.5~5.0s): 맛·경험 최고조 → 가장 인상적인 컷
${ctaBlock}`;

  const prompt = `당신은 담백하고 신뢰감 있는 2030 맛집 크리에이터 "무브먼트(MOOVLOG)"입니다. 친한 지인에게 좋은 맛집을 추천하듯, 과장 없이 현실감 있는 구어체로 나레이션을 작성하세요.
2026 릴스/쇼츠: 첫 컷 임팩트, 정보 밀도, 존댓말 나레이션, 자막 임팩트.
${trendInstruction}${getPersonaPrompt(analysis.detected_theme, analysis.mood)}
${restaurantTypeHint}

[사용자 특별 요청 사항 (★이 지시사항을 최우선으로 반영할 것★)]
${userPrompt ? userPrompt : '특별한 요청 없음. 평소체림 최고의 감성으로 작성하세요.'}
[음식점 정보]
이름: ${restaurantName} / 분위기: ${analysis.mood || '감성적인'}
메뉴: ${(analysis.menu || []).join(', ') || restaurantName}
비주얼 훅: ${analysis.visual_hook || ''}${researchData ? `\n\n[🔍 실시간 Gemini 검색 조사 — 이 식당의 실제 정보]\n${researchData}\n★ 위 조사 내용에서 이 집만의 시그니처 메뉴·맛의 비결·특별한 배경을 나레이션에 자연스럽게 녹여내세요. (단, 확인된 정보만 사용하고 없는 정보는 생략)` : ''}

[선택된 전략]
템플릿: ${TEMPLATE_HINTS[selectedTemplate] || TEMPLATE_HINTS.story}
훅: ${HOOK_HINTS[selectedHook] || HOOK_HINTS.question}

[테마 자동 인식 — researchData와 비주얼을 보고 아래 테마 중 하나를 반드시 선택, JSON에 theme/vibe_color 포함]
☕ 카페/디저트 → theme:"cafe"        vibe_color:"#F5C6D0"  (감성·부드러운 톤. 키워드: 채광, 비주얼, 인생샷)
🥩 고깃집/BBQ  → theme:"grill"       vibe_color:"#FF6B35"  (에너지·타격감 있는 톤. 키워드: 육즙, 숯불향)
🥘 한식/밥집   → theme:"hansik"      vibe_color:"#C8E6C9"  (진정성·담백한 톤. 키워드: 손맛, 든든함)
🍷 고급/양식   → theme:"premium"     vibe_color:"#E8D5B7"  (우아·전문적인 톤. 키워드: 분위기, 기념일)
🍺 술집/포차   → theme:"pub"         vibe_color:"#CE93D8"  (신나·텐션 높은 톤. 키워드: 안주, 분위기)
🦞 해산물/일식 → theme:"seafood"     vibe_color:"#80DEEA"  (깔끔·명쾌한 톤. 키워드: 신선도, 입안이 바다)
🥡 중식/가성비 → theme:"chinese"     vibe_color:"#FFF176"  (빠르고 활기찬 톤. 키워드: 양 실화, 가성비)
테마 키워드를 caption1·caption2·naration에 자연스럽게 섞어주세요.
테마별 권장 effect: cafe=zoom-out, grill=zoom-in, pub=pan-right, chinese=tilt-down 

[🥩 고깃집/BBQ 전용 메뉴 우선순위 규칙 — 반드시 준수]
• 볶음밥·냉면·된장찌개·공기밥 등 마무리 메뉴는 「사이드/엔딩 메뉴」입니다. 이 메뉴들을 클라이맥스·히어로 씬의 주인공으로 배치하면 절대 안 됩니다.
• 고깃집 영상의 메인(hero/climax) 씬 주제는 반드시 「구이」(고기·삼겹살·갈비·목살·소고기·곱창 등)이어야 합니다.
• 볶음밥 등 마무리 메뉴는 마지막 CTA 씬 바로 직전 씬 1개에만 짧게(2.0~2.5초) 등장시키거나 완전히 생략하세요.
[🔥 고깃집 구이 표현 정확성 규칙 — 반드시 준수]
• "직접 구워드립니다", "테이블에서 구워드립니다", "구워드릴게요" 등 직원이 고기를 구워주는 표현은 영상/사진에서 직원이 실제로 구워주는 장면이 보일 때만 사용하세요.
• 직원이 구워주는 장면이 없거나 불확실하면 "직접 구워서", "셀프 구이", "집게 들고 뒤집는 재미" 등 고객이 스스로 굽는다는 자연스러운 표현을 사용하세요.

[🎖️ 시각 상태와 나레이션 일치 규칙 — 반드시 준수 (cooking_state 연동)]
• 비주얼 컷 분석에서 cooking_state="cooked"(다 구워진 상태)로 표시된 이미지와 연결된 씬에서는 "선홍빛", "생고기", "구워지기 전", "원육" 등 생고기 상태를 연상시키는 단어를 나레이션/캡션에 절대 사용하지 마세요.
• cooking_state="raw"(생고기)로 표시된 이미지에는 "구워진", "익힌", "육즙이 터지는" 등 이미 익힌 상태를 알리는 단어를 사용하지 마세요.
• cooking_state가 null이거나 "cooking"(굽는 중)이면 화면에 보이는 실제 상태를 그대로 묘사하세요.
• 예시: cooking_state="cooked" 이미지 → "노릇하게 구워진 구이 단면" O, "선홍빛 원육이 놓입니다" ❌
[비주얼 컷 분석 — narration_hint를 나레이션 작성 기반으로 활용]${videoRule}
${imgSummary || '분석 없음'}
권장 컷 순서: [${order.join(',')}]

${blockStructureText}

[🔁 리텐션 루프 전략 — 시청자를 끝까지 붙잡는 4단계 구조]
• 씬1 (opening_question): 첫 프레임에 답을 알고 싶은 질문을 던져라. 예: "이 줄이 진짜 맞아?" / "가격이 얼마길래?"
• 씬 중간 (midpoint_reveal): 기대를 부풀려라. 결정적인 정보는 살짝 숨기고 "곧 공개" 긴장감 유지.
• 클라이맥스 씬 (climax): 가장 시각적으로 임팩트 있는 컷. 여기서 에너지 레벨 최고조(energy_level 4~5).
• 마지막 씬 (cta_answer): 씬1 질문의 답을 CTA와 함께 공개. "맞아요, 그 집 맞습니다. 저장하고 꼭 가보세요."

[⚡ 씬별 필수 필드]
• energy_level: 1~5 (씬 에너지 강도. 1=차분한 도입, 3=보통, 5=클라이맥스 피크)
• retention_strategy: "opening_question"|"build"|"midpoint_reveal"|"climax"|"cta_answer" (씬 리텐션 역할)
• platform_y_offset: 520 (Reels 기준 자막 Y오프셋 픽셀. 변경 불필요 시 520 고정)

[⏱ Duration 규칙 — 반드시 준수]
★ 블록의 total_duration (= video_cuts 합산, 나레이션 재생 시간 전체): 반드시 3.0초 이상 5.5초 이하.
  - 블록 narration 40자 미만 → total_duration 3.0~4.0초
  - 블록 narration 40~60자 → total_duration 4.0~5.0초
  - 블록 narration 60자 초과 → total_duration 4.5~5.5초
★ video_cuts 개별 컷 duration: 비트매칭을 위해 0.5~2.5초로 자유롭게 조합 가능. (단, 모든 컷 합계가 total_duration과 일치해야 함)
• 컷 최소 0.5초: 그 미만은 화면 로딩 전 전환되어 깜빡임 발생.
• 컷 duration 가이드: 훅 클로즈업=0.7~1.0초, 정보 전달=1.0~2.0초, 클라이맥스 안정=2.0~3.0초.
• 비디오 소스 컷: duration = 클립 길이의 0.5~2배 (예: 3초 클립 → 1.5~6초 duration).
• 이미지 소스 컷: Ken Burns 효과 적용 — 0.7~3.0초 권고.

[🤖 AI 텍스트 '인간화' (Humanize AI) 5대 원칙]
가장 중요한 규칙입니다. AI가 작성한 티가 나는 완벽하고 기계적인 문장을 절대 금지합니다.

1. 금지어(AI 단골 멘트): "환상적인", "다채로운", "입안 가득 퍼지는", "조화를 이루는", "오감을 사로잡는", "선사합니다" ➡️ 100% 사용 금지.
2. 불완전함의 미학: 문장을 너무 매끄럽게 다듬지 마세요. 진짜 사람이 즉흥적으로 말하듯 살짝 문법이 어긋나거나 투박한 '입말(구어체)'을 쓰세요.
3. 감탄사와 추임새 적절히 활용: "와..", "아니 근데", "이거 보실래요", "사실은" 같은 현실적인 추임새를 문장 앞이나 중간에 자연스럽게 섞으세요. (단, "솔직히", "진짜" 반복 금지)
4. 시청자와의 티키타카: 혼잣말만 하지 말고, "다들 아시죠?", "궁금하지 않으세요?"처럼 시청자에게 말을 거는 화법을 넣으세요.
5. 지역 밀착형 현실 멘트: 평범한 리뷰가 아니라, 동네 맛집을 꿰뚫고 있는 사람처럼 "여기 점심시간엔 무조건 웨이팅입니다", "근처 직장인들 성지죠" 같은 현실적인 묘사를 추가하세요.

[❌ AI 느낌 대본 예시]
"이곳의 시그니처 메뉴인 삼겹살은 육즙이 가득하고 부드러워 입안 가득 환상적인 맛을 선사합니다."
[✅ 인간화(Humanized) 대본 예시]
"아니 고기 두께 보이세요? 솔직히 굽기 전엔 퍽퍽할 줄 알았는데, 한 입 씹자마자 육즙이 진짜 팡 터지더라고요."

[나레이션 스타일 — 담백하고 진정성 있는 현실 톤]
• '실화', '미쳤다', '대박', '기절', '폼 미쳤다' 같은 억지스러운 숏폼 과장어 절대 금지
• 호들갑 떨지 말고, 차분하지만 몰입감 있는 "진짜 맛잘알"의 현실적인 구어체를 사용하세요
• "~요" 어미로 끝내되, 과하게 친한 척하지 말고 세련된 리뷰어의 톤앤매너를 유지하세요
• 1~2문장, 각 씬 duration × 4.5글자 이하
• 단순 상황 설명("~하고 있습니다") 절대 금지. 오감(시각, 청각, 미각, 촉각)을 자극하는 디테일한 표현을 1개 이상 섞어주세요.
  (예: "혀끝에 닿자마자 녹아내리는 육향", "은은하게 배어있는 숯불향", "아삭하게 씹히는 단면")
• 화면에 실제 보이는 것을 구체적으로 설명 (narration_hint 참고)

[🚨 트렌드 인지 및 '뒷북' 화법 절대 금지 (Trend Awareness)]
• 이미 대대적으로 유행한 아이템(예: 두바이 초콜릿, 두바이 쿠키, 요아정, 마라탕, 탕후루 등)을 마치 '세상에 처음 나온 신기한 음식'처럼 소개하는 뒷북 멘트를 절대 금지합니다.
• ❌ 금지 예시: "겉모습만 보고 평범한 쿠키라고 생각하면 오산!", "이름부터 특이한", "처음 보실 텐데요", "이게 도대체 뭘까요?"
• 시청자들은 이미 최신 트렌드를 다 알고 있다고 가정하세요. 시청자의 높은 정보력을 존중하는 세련된 화법을 구사하세요.
• ✅ 올바른 화법: "다들 아시는 그 맛", "유행 끝물인 줄 알았는데 막상 먹어보니", "도대체 얼마나 맛있길래 아직도 난리인지 직접 검증해봤습니다" 처럼 이미 트렌드를 알고 탑승하는 포지션을 취하세요.

[🎯 2026 최신 숏폼 트렌드 가이드 — 자막 & 나레이션 필수 지침]
1. 트렌디한 훅(Hook) 구조: 결론을 선제시하세요.
   • ❌ 올드한 훅: "안녕하세요! 오늘은 광화문에 있는 파틱에 왔습니다." (절대 금지)
   • ✅ 트렌디 훅: "나만 알고 싶은 광화문 데이트 종착지", "N년차 빵순이가 정착한 곳" 등 POV와 타겟을 명확히
2. 나레이션 트렌드: TV 방송국 리포터 톤, 인위적인 하이텐션 절대 금지. 친한 지인에게 카톡으로 추천하듯 무심하고 담백하게 팩트만 전달하세요.
   • ✅ 예시: "여긴 진짜 무조건입니다", "비주얼부터 압도적이더라고요"
3. 자막 트렌드(정보 비대칭): 나레이션을 그대로 자막에 쓰지 마세요. 자막=짧고 굵은 카피, 나레이션=자막의 부연 설명.
   • ❌ 나쁜 예: (자막) 치즈가 듬뿍 늘어나네요 / (음성) 치즈가 듬뿍 늘어나네요
   • ✅ 좋은 예: (자막) 미친 치즈 폭포 🧀 / (음성) 젓가락으로 집어 올리기 버거울 정도로 치즈가 쏟아집니다

[🥁 2026 숏폼 나레이션 리듬 최적화]
• 절대 문장을 길게 쓰지 마세요. 3~4어절 단위로 짧게 툭툭 끊어 치세요.
• 접속사(그리고, 그래서, 하지만, 그런데) 100% 삭제하세요.
• 모든 문장을 "~요"나 "~다"로 똑같이 끝내지 마세요. 평서문, 의문문, 명사형 종결을 교차로 사용하여 성우가 숨 가쁘고 리드미컬하게 읽을 수 있게 대본을 짜세요.
• ❌ 금지: "이곳의 고기는 정말 부드럽고 육즙이 가득해서 맛있습니다."
• ✅ 추천: "육즙 보이시죠? 입에 넣자마자 사라집니다. 진짜 미쳤어요."

[📸 비주얼 구성 원칙 — 전체 샷 확보]
• 모든 장면을 클로즈업으로만 구성하지 마세요.
• 첫 번째 씬과 식당 소개 씬에서는 음식의 전체 크기와 테이블 세팅이 한눈에 보이는 풀샷 또는 미디엄샷을 우선 배치하세요.
• 나레이션에서 "자태 좀 보세요"라고 할 때는 반드시 음식이 잘리지 않은 전체 사진을 매칭하세요.

[🎬 인간 크리에이터급 컷편집 템플릿 — 비트매칭 필수 적용]
모든 블록을 기계적으로 3초씩 배분하는 촌스러운 편집을 절대 금지합니다.
아래 비트매칭 구조로\`blocks\` 출력 JSON(하단 참조)을 구성하고, 각 블록의 \`video_cuts\` 안에서 0.5~1.5초 짧은 컷과 1.5~2.5초 긴 컷을 반드시 섞어 리듬감을 만드세요.
단, 모든 video_cuts의 duration 합 = 해당 블록의 total_duration과 일치해야 합니다.

■ 비트매칭 리듬 규칙:
- 블록 시작 훅 컷: 0.7~1.2초 (나레이션 없음 — 자막 + 임팩트 비주얼만)
- 교차 편집 컷: 0.5~1.0초짜리 클로즈업 1~2개
- 클라이맥스 안정 컷: 1.5~2.5초 (풀샷 또는 인테리어 — 나레이션 본격 시작)
- CTA 블록: 총 3.0~4.5초 (single cut 또는 2 cuts)

[🎥 카메라 앵글 및 화각(Shot Size) 배치 규칙]
- 블록마다 화각을 교차 편집(Cross-cutting)하여 시청자 시각 피로를 줄이세요.
- 첫 번째 블록 훅 컷: 강렬한 '클로즈업(Close-up)' 위주
- 두 번째~세 번째 블록: 상차림 전체가 보이는 '테이블 풀샷(Full-shot)' 또는 '매장 인테리어'
- 🚨 풀샷 배정 컷의 나레이션에서는 "육즙이 흐르네요" 같은 근접 묘사 절대 금지. 대신 "상다리가 부러질 듯한 스케일", "분위기 미치지 않았나요?" 등 공간 전체를 아우르는 대본 작성.

[🚨 절대 금지 — 유치함·클리셰 원천 차단 (위반 시 즉시 재생성 대상)]
• 가격 정보를 훅/자막/나레이션에 전면 배치 절대 금지: "소주 3천원", "1인 만원", "가격 실화" 등 구체적 금액 언급 금지. 가격은 언제든 변동되므로 영상에 수치를 넣으면 오정보 위험. 맛·경험·분위기·가성비 감성으로 대체.
• 억지 줄임말·신조어 창조 금지: '두쫀쿠' 등 원본에 없는 줄임말 임의 생성 금지. 상호명·메뉴명은 있는 그대로 사용.
• 시청자 무시·가르치려는 톤 금지: "처음 보시는 거일 거예요", "이거 모르면 간첩", "저만 믿고 따라오세요" 절대 금지.
• 오글거리는 삼류 수식어 완전 금지: "이름도 특이한", "마법의 맛", "입안에서 춤을 추는", "환상적인", "신세계" 절대 금지.
• 만화적 의성어로 시작 금지: "짜잔~", "두둥!", "등장~" 등 유치한 오프닝 금지.
• 기계적 감탄사 금지: "어머어머", "우와아", "음~" 등 영혼 없는 감탄사 나열 금지.
• 사물 존칭 절대 금지: "고기 두께가 좋으십니다", "커피 나오셨습니다" 형태 금지.
• 자신감 없는 어미 금지: "~인 것 같아요", "~보이네요" 대신 능동태로 확신하여 말하세요.
• 철 지난 유행어 완전 차단: '찢었다', '폼 미쳤다', 'JMT', '갓성비', '레전드', '밥도둑', '꿀맛', '비주얼 깡패', '마약 ○○', '폭풍 흡입', '순삭', '맛집 인정', '소름 돋는', '겉바속촉', '둘이 먹다 하나 죽어도 모를' 절대 금지.
• "텐션 높음"의 올바른 해석: 크게 소리치는 것이 아님. 트렌디한 2030 직장인이 세련되게 고급 정보 공유하는 '담백하지만 확신에 찬 톤' 이 진짜 텐션.
• '솔직히', '진짜' 연속 반복 및 문장 시작 남발 절대 금지, '여러분~' 집합 호명 금지, "오늘은 어디를 가볼까요?" 식 도입 절대 금지.
• '여기 안 가면 손해', '인생 맛집 실화', '가지 않으면 후회' 류 과장형 손실 유발 캐치프레이즈 절대 금지.
• 클라이맥스 씬에서는 나레이션을 비우거나 한 단어로만 두어 현장음이 돋보이게 하세요.

[🎥 Show, Don't Tell — 침샘 자극 오감 묘사법]
• "맛있다", "좋다", "최고다", "환상적이다" 같은 1차원적 감정·평가 형용사 사용 엄격 금지.
• 재료의 텍스처·조리방식·온도감·색감·향기를 구체적 오감(시각·청각·촉각) 단어로 묘사하세요.
• ❌ 금지: "스테이크가 진짜 부드럽고 맛있어요." → ✅ 권장: "칼을 댈 필요도 없이 결대로 찢어집니다. 은은한 버터 향이 확 퍼지네요."
• "달달해요" → "기분 좋은 은은한 단맛" / "매워요" → "혀를 기분 좋게 때리는 맵기" / "부드러워요" → "몇 번 씹을 필요도 없이 넘어가는"
• "겉바속촉" 단어 금지 → "포크가 들어갈 땐 바삭, 씹을 땐 육즙이 팡 터집니다"처럼 직접 묘사.

[🎭 자막·나레이션 역할 분리 — 정보의 교차]
• 화면 자막(caption1)과 귀로 듣는 나레이션(narration)을 절대 똑같은 문장으로 쓰지 마세요.
• 자막(caption1)은 시선을 끄는 훅(Hook) 카피라이팅, 나레이션은 그 자막의 배경·맥락을 풀어주는 스토리텔링.
• ❌ 금지: (자막) "광화문 골목 숨은 맛집" / (나레이션) "광화문 골목 숨은 맛집입니다."
• ✅ 권장: (자막) "간판도 없는 이곳" / (나레이션) "지도 앱을 켜고도 하마터면 그냥 지나칠 뻔했습니다."
• 로컬 키워드 자연 배치: "광화문 회식", "을지로 데이트" 등 검색 알고리즘 키워드를 자막에 녹이세요.

[🎵 문장 호흡·리듬 제어 — TTS 최적화]
• 한 문장은 15자 이내 원칙. 쉼표(,)가 2개 이상 들어갈 긴 문장 금지.
• 접속사('그리고', '그래서', '그런데') 과감히 생략.
• 명사형 종결 믹스: 모든 문장을 "~요"로 끝내지 말고 "완벽한 굽기.", "그야말로 예술."처럼 끊어 리듬감 부여.
• 강조 단어 앞 쉼표 전략: "이건, 무조건 시키세요." 형태로 TTS 한 박자 쉬게 유도.
• "데이트 코스로 딱이에요" 금지 → "애프터 성공률 200% 보장하는 무드"처럼 타겟팅된 카피.

[자막 다이어트 규칙 — ★절대 준수★]
• 메인 자막(caption1): 공백 포함 12자 이내. (예: "여긴 진짜 나만 알래", "육즙 파티🤤", "웨이팅 가치 있는 이유")
• 서브 자막(caption2): 키워드 위주 8자 이내. (예: "당장 저장각", "무조건 오픈런", "숯불향 실화")
• 마침표(.) 생략, 임팩트 이모지(🔥 ✨ 🤤 💖) 적극 활용
• 설명조 긴 문장 절대 금지 — 친구 카톡처럼 짧고 강렬하게 끊기
• 할 말이 많으면 장면을 쪼개서 자막을 나눠 배치
• subtitle_style: hook(첫 씬) | hero(클라이맥스) | cta(마지막) | minimal(여운/감성) | elegant(에세이)

[★ SNS 태그 규칙 — 반드시 준수]
naver_clip_tags : #협찬 으로 시작, 이어서 지역·음식·분위기 태그 공백 나열, 총 300자 이내
youtube_shorts_tags : 핵심 태그 5~8개, 공백 포함 100자 이내. ⚠️ 무브먼트·무브먼트픽 등 브랜드 자체 태그 절대 제외. 음식점 이름·지역·메뉴 중심 태그만 사용.
instagram_caption : 감성 소개 2~3줄\n\n#태그1 #태그2 #태그3 #태그4 #태그5 (5개 딱 맞기)
tiktok_tags : #태그 딱 5개만 공백 구분. 무브먼트 브랜드 태그 제외.
${requiredKeywords.trim() ? `
[📌 필수 포함 키워드 — 아래 키워드를 naver_clip_tags와 hashtags_30에 반드시 포함할 것]
${requiredKeywords.trim()}
` : ''}

[컷 매칭 규칙 — ★매우 중요★]
• 각 이미지를 제공할 때 앞에 "--- [원본 미디어 번호 media_idx: N] ---" 이라고 라벨을 뺙여두었습니다.
• 스크립트 씨(scene)을 구성할 때, 화면에 나가는 컷이 어떤 원본 파일인지 파악하여 라벨에 적힌 정확한 N값을 "media_idx" 필드에 적어주세요.
• 반드시 권장 컷 순서 [${order.join(',')}] 의 흐름을 따라 장면을 전개하세요.
${exteriorIdx !== undefined ? `• ⚠️ 가게 외관/간판 사진(media_idx: ${exteriorIdx})은 반드시 마지막 CTA 블록에만 배치. 고기 굽는 씬·밥상 차림 씬 중간에 외관이 끼어들면 영상 흐름이 끊기는 심각한 편집 오류입니다. 절대 금지.` : ''}
• 🎯 씬-미디어 내용 일치 원칙: 씬의 narration/caption에서 특정 음식(예: 볶음밥)을 설명할 때는 반드시 그 음식이 직접 촬영된 media_idx만 사용하세요. 볶음밥 설명 씬에 고기·김치·다른 반찬 사진을 배치하는 것은 절대 금지입니다. 해당 메뉴가 찍힌 미디어가 없으면 그 씬 자체를 삭제하거나 실제 촬영된 다른 메뉴로 내용을 교체하세요.
• 🥗 밑반찬 씬 ≠ 식전 음료/주스 씬: 밑반찬(반찬, 기본찬, 겉절이 등)을 설명하는 씬에는 반찬 사진만 배치. 식전주스·음료 사진은 밑반찬 씬에 배치하지 마세요. 카테고리가 다른 음식/음료는 별도 씬으로 독립 구성하거나 생략하세요.

[카메라 워크 지시사항]
각 씨의 'effect' 필드에는 아래 6가지 중 미디어의 특성에 맞는 것을 하나 반드시 선택하세요:
1. zoom-in: 음식 디테일 강조 시
2. zoom-out: 전체 분위기 공개 시
3. pan-right/pan-left: 넓은 공간이나 정갈하게 놓인 음식을 훑을 때
4. tilt-up/tilt-down: 층이 쉬인 디저트나 건물 외관을 보여줄 때
★ 정적인 컷은 절대 금지! 모든 씨에 역동적인 움직임을 부여하세요. ★

[모범 나레이션 예시 (이 현실적인 톤과 길이를 똑같이 따라하세요)]
- 씬1: "요즘 이 동네에서 가장 예약하기 힘들다는 곳, 드디어 다녀왔습니다."
- 씬2: "두툼한 고기 두께 보이시나요? 숯불향이 은은하게 코를 스치는데, 굽기 전부터 기대가 되더라고요."
- 씬3: "씹을 것도 없이 부드럽게 넘어가요. 고기 본연의 진한 육향이 입안에 오래 남습니다."
- 씬4: "정갈한 밑반찬 하나하나에 정성이 듬뿍 담겨 있어서, 부모님 모시고 오기에도 참 좋은 곳이에요."
- 마지막 씬(CTA): "웨이팅이 아깝지 않은 찐맛집이었습니다! 무브먼트 구독하고 숨은 맛집 정보 계속 받아가세요. 좋아요와 댓글도 큰 힘이 됩니다!"

[릴스 최적화 자가 검증 — 최종 JSON 출력 전 스스로 채점 후 audit_report에 담기]
• Hook(후킹): 첫 씬 caption1이 2초 안에 시청자를 멈추게 하는가? (0~100점)
• Readability(가독성): 모든 caption1이 12자 이내, caption2가 8자 이내인가? (0~100점)
• Pacing(박자): 모든 블록의 total_duration이 3.0~5.5초 범위이고, video_cuts 개별 컷의 합이 total_duration과 일치하는가? (0~100점)
3항목 평균 점수를 "score" 필드에, 릴스에서 터지는 이유 한 줄을 "reason" 필드에 담아서 JSON에 포함하세요.
기준 미달 항목은 즉시 수정 후 출력하세요.

[📣 마케팅 에셋 생성 — JSON에 marketing 필드 반드시 포함]
• hook_title: 클릭을 유도하는 릴스 제목. "무브먼트픽 🔥 직접 다녀온 리얼 후기", "내돈내산 솔직 후기 — 이 집 혼자 알고 싶었어" 처럼 무브먼트 퍼스널 브랜딩 + 강렬한 훅 문구를 결합할 것. ⚠️ "여기 안 가면 손해", "인생 맛집 실화" 등 과장 캐치프레이즈 절대 금지.
• caption: 인스타그램 본문 캡션. "이 집만큼은 혼자 알고 싶었는데 😅" 처럼 무브먼트 1인칭 페르소나(내돈내산 찐 추천)를 첫 문장에 넣고, 감성 2~3문장 + 방문자 액션 유도 (저장, 좋아요, 댓글). 줄바꿈은 \n 사용. ⚠️ "진짜", "솔직히" 반복 남발 금지.
• hashtags_30: 지역 태그 5개 + 음식 카테고리 태그 10개 + 분위기/감성 태그 5개 + 2026 트렌딩 태그 10개. 공백으로 구분, 정확히 30개.
• receipt_review: 네이버 영수증 리뷰용 10~20자 극잘형 한 줄 평 (예: "사장님 친절하고 고기 질 짱. 재방문 200%"). 실제 식당에 갔다 온 사람이 쏴 마음으로 남기는 리얼 훅구체.

[🎯 3종 훅 빅리에이션 — JSON에 hook_variations 배열 반드시 포함]
다음 3가지 오프닝 스타일로 첫 번째 씬의 다른 다른 버전을 제안하세요:
• shock 형: 충격/궁금증 유발 ("...?!", "이거 맞는데?")
• info 형: 정보전달형 ("인천 3대 타이틀?", "여기를 모르면 간첩")
• pov 형: 1인칭 공감 ("퇴근하고 여기 어때?", "어제 다녀왔는데")
로 {타입}: {caption1}, {caption2}, {narration} 옵션 3개가 있는 배열로 출력.

[🎬 오디오/비디오 트랙 분리 구조 (★필수 적용★)]
기존의 '1화면 = 1자막/음성' 구조를 절대 금지합니다. 아래 \`blocks\` 구조로 출력하세요.
- narration: 자연스럽게 이어지는 한 문장 (2~4초 길이 호흡)
- caption: 블록 전체 시간 동안 유지되는 짧고 굵은 자막
- total_duration: narration 길이 + 여유 0.5초 이상 (3.0~5.5초 고정 범위, 최소 3.0s 준수)
- video_cuts: narration이 재생되는 동안 화면에서 빠르게 교차할 짧은 컷들 (0.5~2.5초)
※ video_cuts 각 항목에 media_idx를 반드시 지정하세요. 시스템이 타이밍 자동 보정합니다.

JSON만 반환:
{"audit_report":{"score":93,"reason":""},"title":"","theme":"grill","vibe_color":"#FF6B35","hashtags":"","naver_clip_tags":"","youtube_shorts_tags":"","instagram_caption":"","tiktok_tags":"","marketing":{"hook_title":"","caption":"","hashtags_30":"","receipt_review":""},"hook_variations":[{"type":"shock","caption1":"","caption2":"","narration":""},{"type":"info","caption1":"","caption2":"","narration":""},{"type":"pov","caption1":"","caption2":"","narration":""}],"blocks":[
  {"narration":"다들 아시는 그 맛이겠거니 했는데, 한 입 먹고 바로 생각 바뀌었습니다.","caption":"🚨 유행 끝물인 줄 알았는데","caption2":"당장 저장각","subtitle_style":"hook","energy_level":4,"retention_strategy":"opening_question","effect":"zoom-in","total_duration":4.0,"video_cuts":[{"duration":0.8,"media_idx":2,"visual_focus":"훅 — 음식을 자르거나 뒤집는 역동적인 첫 컷"},{"duration":0.7,"media_idx":3,"visual_focus":"단면 클로즈업"},{"duration":2.5,"media_idx":0,"visual_focus":"전체 상차림 풀샷"}]}
]}`;

  const makeReq = async url => {
    const body = {
      system_instruction: {
        parts: [{ text: "당신은 감각적이고 진정성 있는 로컬 맛집 리뷰어 '무브먼트(moovlog)'입니다. '대박', '실화', '미쳤다', '기절' 같은 작위적이고 뻔한 유튜브식 과장어를 절대 사용하지 마세요. 대신 시청자가 텍스트만 읽어도 침이 고이도록, 음식의 디테일과 식당의 분위기를 담백하고 현실감 있는 일상어로 세련되게 묘사해야 합니다." }],
      },
      contents: [{ parts: [...imgParts, { text: prompt }] }],
      generationConfig: { temperature: 0.92, responseMimeType: 'application/json' },
    };
    const data = await apiPost(url, body);
    const raw = safeExtractText(data);
    const _s = raw.indexOf('{'), _e = raw.lastIndexOf('}');
    const obj = JSON.parse(_s >= 0 && _e > _s ? raw.slice(_s, _e + 1) : raw.replace(/```json|```/g, '').trim());
    // blocks 형식(1 Audio : N Video) 또는 레거시 scenes 형식 모두 수용
    const hasBlocks = Array.isArray(obj.blocks) && obj.blocks.length > 0;
    const hasScenes = Array.isArray(obj.scenes) && obj.scenes.length > 0;
    if (!hasBlocks && !hasScenes) throw new Error('스크립트 오류');
    // blocks 형식: total_duration 클램핑(3.0~5.5s), video_cuts 개별 컷 0.5s 이상 보장
    if (hasBlocks) {
      obj.blocks = obj.blocks.map(block => {
        const cuts = Array.isArray(block.video_cuts)
          ? block.video_cuts.map(cut => ({
              ...cut,
              duration: Math.max(0.5, Math.min(3.0, Number(cut.duration) || 1.0)),
            }))
          : block.video_cuts;
        const rawCutTotal = Array.isArray(cuts)
          ? cuts.reduce((s, c) => s + (c.duration || 1.0), 0)
          : 0;
        const clampedTotal = Math.max(3.0, Math.min(5.5, Number(block.total_duration) || 4.0));
        // video_cuts 합이 total_duration보다 짧으면 마지막 컷 연장
        let finalCuts = cuts;
        if (Array.isArray(cuts) && cuts.length > 0 && rawCutTotal < clampedTotal - 0.05) {
          finalCuts = [...cuts];
          finalCuts[finalCuts.length - 1] = {
            ...finalCuts[finalCuts.length - 1],
            duration: Math.round((finalCuts[finalCuts.length - 1].duration + (clampedTotal - rawCutTotal)) * 100) / 100,
          };
        }
        return { ...block, total_duration: clampedTotal, video_cuts: finalCuts };
      });
    }
    // scenes 형식일 때만 duration 클램핑 (blocks.video_cuts 짧은 duration 보존)
    if (hasScenes) {
      obj.scenes = obj.scenes.map(sc => ({
        ...sc,
        duration: Math.max(2.0, Math.min(4.5, Number(sc.duration) || 3.0)),
      }));
    }
    // hook_variations 없으면 기본값 카피 (blocks / scenes 모두 대응)
    const s0 = obj.blocks?.[0] || obj.scenes?.[0];
    if (!obj.hook_variations?.length && s0) {
      const s0cap1 = s0.caption1 || s0.caption || '';
      const s0cap2 = s0.caption2 || '';
      const s0nar  = s0.narration || '';
      obj.hook_variations = [
        { type: 'shock',  caption1: s0cap1, caption2: s0cap2, narration: s0nar },
        { type: 'info',   caption1: s0cap1, caption2: '이 집 간다 ✅', narration: s0nar },
        { type: 'pov',    caption1: '오늘 여기 어때?', caption2: s0cap2, narration: s0nar },
      ];
    }
    return obj;
  };
  const preferPro = String(import.meta.env.VITE_GEMINI_PREFER_PRO || '0') === '1';
  const primaryModel = preferPro ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const fallbackModel = preferPro ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

  try {
    return await makeReq(getApiUrl(primaryModel));
  } catch (e) {
    console.warn(`[Script] ${primaryModel} 실패 → ${fallbackModel} 폴백:`, e.message);
    return makeReq(getApiUrl(fallbackModel));
  }
}
