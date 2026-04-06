// src/engine/sessionPersistence.js
// 작업 세션 자동 저장 / 복원 — localStorage 기반

const KEYS = {
  DRAFT:        'moovlog_draft_v1',        // 폼 입력 상태
  DRIVE_SESSION: 'moovlog_drive_session_v1', // Drive 파일 메타데이터
  LAST_RESULT:  'moovlog_last_result_v1',  // 완료된 생성 결과
};

// ─── 폼 초안 저장 / 복원 ─────────────────────────────────────
export function saveDraft(state) {
  try {
    const payload = {
      restaurantName:  state.restaurantName  || '',
      restaurantType:  state.restaurantType  || 'auto',
      selectedTemplate: state.selectedTemplate || 'auto',
      selectedHook:    state.selectedHook    || 'question',
      aspectRatio:     state.aspectRatio     || '9:16',
      userPrompt:      state.userPrompt      || '',
      requiredKeywords: state.requiredKeywords || '',
      savedAt:         Date.now(),
    };
    localStorage.setItem(KEYS.DRAFT, JSON.stringify(payload));
  } catch (_) { /* storage quota 등 실패 시 조용히 무시 */ }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(KEYS.DRAFT);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // 7일 초과된 초안은 자동 삭제
    if (Date.now() - (data.savedAt || 0) > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEYS.DRAFT);
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

export function clearDraft() {
  try { localStorage.removeItem(KEYS.DRAFT); } catch (_) {}
}

// ─── Drive 세션 저장 / 복원 ──────────────────────────────────
// files: [{ id, name, mimeType }]
export function saveDriveSession(files) {
  try {
    const payload = {
      files: files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType })),
      savedAt: Date.now(),
    };
    localStorage.setItem(KEYS.DRIVE_SESSION, JSON.stringify(payload));
  } catch (_) {}
}

export function loadDriveSession() {
  try {
    const raw = localStorage.getItem(KEYS.DRIVE_SESSION);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // 3일 초과 시 삭제
    if (Date.now() - (data.savedAt || 0) > 3 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEYS.DRIVE_SESSION);
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

export function clearDriveSession() {
  try { localStorage.removeItem(KEYS.DRIVE_SESSION); } catch (_) {}
}

// ─── 완료된 생성 결과 저장 / 복원 ───────────────────────────
export function saveLastResult(script, restaurantName, qcScore) {
  try {
    // script는 JSON 직렬화 가능 (AudioBuffer 제외 — 이미 store에서 분리됨)
    const serializable = {
      ...script,
      // scenes에서 직렬화 불가 메모리 참조 제거
      scenes: (script.scenes || []).map(sc => ({
        ...sc,
        // focus_coords, caption1 등은 그대로 유지
      })),
    };
    const payload = {
      script: serializable,
      restaurantName: restaurantName || '',
      qcScore: qcScore || null,
      savedAt: Date.now(),
    };
    // 스크립트가 너무 크면 5MB 이상 → 저장 스킵
    const json = JSON.stringify(payload);
    if (json.length > 4 * 1024 * 1024) {
      console.warn('[SessionPersistence] 결과 용량 초과, 저장 생략');
      return;
    }
    localStorage.setItem(KEYS.LAST_RESULT, json);
    console.log('[SessionPersistence] 마지막 결과 저장 완료:', restaurantName);
  } catch (e) {
    console.warn('[SessionPersistence] 결과 저장 실패:', e.message);
  }
}

export function loadLastResult() {
  try {
    const raw = localStorage.getItem(KEYS.LAST_RESULT);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // 14일 초과 시 삭제
    if (Date.now() - (data.savedAt || 0) > 14 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEYS.LAST_RESULT);
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

export function clearLastResult() {
  try { localStorage.removeItem(KEYS.LAST_RESULT); } catch (_) {}
}
