/**
 * SyncManager.js — Firebase Firestore 기반 프로젝트 동기화 v2.76
 *
 * 주요 기능:
 *   - save()       : editList + options + Timeline을 Firestore에 저장
 *   - load()       : 프로젝트 전체 복원 (Timeline 포함)
 *   - clone()      : 프로젝트 복제
 *   - rename()     : 이름 변경
 *   - listProjects(): 목록 조회 (썸네일 URL 포함)
 *   - delete()     : 삭제
 *   - localSave/localLoad/localList: 오프라인 localStorage 폴백
 *
 * Timeline 스키마 (씬 단위):
 *   {
 *     sceneId: string,          // 고유 ID
 *     fileName: string,         // 원본 파일명
 *     filePath: string,         // (로컬 경로 — 개인정보 주의)
 *     start: number,            // 씬 내 시작 시각(초)
 *     duration: number,         // 씬 재생 시간(초)
 *     timelineStart: number,    // 타임라인 내 시작 포지션(초)
 *     timelineEnd: number,      // 타임라인 내 끝 포지션(초)
 *     speed: number,            // 재생 속도 (1.0 = 기본)
 *     volume: number,           // 볼륨 (0~1)
 *     theme: string,            // LUT 테마
 *     subtitle: object|null,    // 자막 설정
 *     transition: object|null,  // 전환 효과
 *     thumbnailUrl: string|null,// 썸네일 URL (Firebase Storage)
 *   }
 */

// ── Firebase import ──────────────────────────────────────────────────────────
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// ── 상수 ────────────────────────────────────────────────────────────────────
const COLLECTION = 'projects';
const MAX_PROJECTS = 50;
const SCHEMA_VERSION = 2; // 스키마 버전 (마이그레이션 대비)

// ── Timeline 정규화 헬퍼 ────────────────────────────────────────────────────
/**
 * editList 클립 배열 → Timeline 항목 배열로 변환
 * @param {Array} editList
 * @returns {Array<TimelineItem>}
 */
function buildTimeline(editList = []) {
  let cursor = 0;
  return editList.map((clip, idx) => {
    const dur = Math.max(0.1, clip.duration ?? 3);
    const tStart = cursor;
    cursor += dur;
    return {
      sceneId: clip.sceneId ?? `scene_${idx}_${Date.now()}`,
      fileName: clip.fileName ?? clip.path?.split(/[\\/]/).pop() ?? `clip_${idx}`,
      // filePath는 개인 경로 정보 — 선택적으로 저장
      filePath: clip.path ?? null,
      start: clip.start ?? 0,
      duration: dur,
      timelineStart: tStart,
      timelineEnd: cursor,
      speed: clip.speed ?? clip.speedRamp ?? 1.0,
      volume: clip.volume ?? 1.0,
      theme: clip.theme ?? null,
      subtitle: clip.subtitle ?? null,
      transition: clip.transition ?? null,
      thumbnailUrl: clip.thumbnailUrl ?? null,
      _order: idx,
    };
  });
}

/**
 * Timeline 항목 배열 → editList 클립 배열로 복원
 * @param {Array} timeline
 * @returns {Array}
 */
function restoreEditList(timeline = []) {
  return [...timeline]
    .sort((a, b) => (a._order ?? 0) - (b._order ?? 0))
    .map((t) => ({
      sceneId: t.sceneId,
      path: t.filePath,
      fileName: t.fileName,
      start: t.start,
      duration: t.duration,
      speed: t.speed,
      speedRamp: t.speed,
      volume: t.volume,
      theme: t.theme,
      subtitle: t.subtitle,
      transition: t.transition,
      thumbnailUrl: t.thumbnailUrl,
    }));
}

// ── SyncManager 클래스 ──────────────────────────────────────────────────────
export class SyncManager {
  /** @param {import('firebase/app').FirebaseApp} firebaseApp  @param {string} userId */
  constructor(firebaseApp, userId) {
    if (!firebaseApp) throw new Error('SyncManager: firebaseApp 필요');
    if (!userId) throw new Error('SyncManager: userId 필요');
    this._db = getFirestore(firebaseApp);
    this._uid = userId;
  }

  _col() {
    return collection(this._db, 'users', this._uid, COLLECTION);
  }

  _docRef(projectId) {
    return doc(this._db, 'users', this._uid, COLLECTION, projectId);
  }
  _docRef(projectId) {
    return doc(this._db, 'users', this._uid, COLLECTION, projectId);
  }

  /**
   * 프로젝트 저장 — editList + Timeline + options 완전 백업
   * @param {string} projectId
   * @param {Array}  editList
   * @param {Object} options
   * @param {string} [title]
   * @param {string} [thumbnailUrl]  대표 썸네일 URL (Firebase Storage)
   */
  async save(projectId, editList = [], options = {}, title = '', thumbnailUrl = null) {
    if (!projectId) throw new Error('save: projectId 필요');
    const timeline = buildTimeline(editList);
    const totalDuration = timeline.reduce((s, t) => s + t.duration, 0);

    const payload = {
      schemaVersion: SCHEMA_VERSION,
      projectId,
      title: title || projectId,
      // editList는 하위 호환성 유지
      editList,
      // Timeline: 씬 단위 완전 백업 (파일명·시간대·효과 포함)
      timeline,
      totalDuration,
      sceneCount: timeline.length,
      options,
      thumbnailUrl,
      updatedAt: serverTimestamp(),
      uid: this._uid,
    };
    await setDoc(this._docRef(projectId), payload, { merge: true });
    return projectId;
  }

  /**
   * 프로젝트 불러오기 — Timeline에서 editList 복원 포함
   * @param {string} projectId
   */
  async load(projectId) {
    const snap = await getDoc(this._docRef(projectId));
    if (!snap.exists()) return null;
    const data = snap.data();

    // v2 스키마: timeline에서 editList 복원
    let editList = data.editList ?? [];
    if (data.timeline?.length) {
      editList = restoreEditList(data.timeline);
    }

    return {
      projectId: data.projectId,
      title: data.title,
      editList,
      timeline: data.timeline ?? [],
      totalDuration: data.totalDuration ?? 0,
      sceneCount: data.sceneCount ?? editList.length,
      options: data.options ?? {},
      thumbnailUrl: data.thumbnailUrl ?? null,
      updatedAt: data.updatedAt?.toDate() ?? null,
      schemaVersion: data.schemaVersion ?? 1,
    };
  }

  /**
   * 프로젝트 목록 (updatedAt 내림차순) — 썸네일 URL 포함
   */
  async listProjects() {
    const q = query(this._col(), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.slice(0, MAX_PROJECTS).map((d) => {
      const data = d.data();
      return {
        projectId: data.projectId,
        title: data.title,
        thumbnailUrl: data.thumbnailUrl ?? null,
        sceneCount: data.sceneCount ?? 0,
        totalDuration: data.totalDuration ?? 0,
        updatedAt: data.updatedAt?.toDate() ?? null,
      };
    });
  }

  /**
   * 프로젝트 삭제
   */
  async delete(projectId) {
    await deleteDoc(this._docRef(projectId));
  }

  /**
   * 프로젝트 복제 (#v2.76)
   * @param {string} srcId   원본 projectId
   * @param {string} newId   복제본 projectId
   * @param {string} [newTitle]
   */
  async clone(srcId, newId, newTitle = '') {
    const src = await this.load(srcId);
    if (!src) throw new Error(`clone: 원본 프로젝트 없음 (${srcId})`);
    await this.save(
      newId,
      src.editList,
      src.options,
      newTitle || `${src.title} (복사본)`,
      src.thumbnailUrl,
    );
    return newId;
  }

  /**
   * 프로젝트 이름 변경 (#v2.76)
   * @param {string} projectId
   * @param {string} newTitle
   */
  async rename(projectId, newTitle) {
    if (!newTitle?.trim()) throw new Error('rename: 새 이름 필요');
    await updateDoc(this._docRef(projectId), {
      title: newTitle.trim(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * 로컬 localStorage에 임시 저장 (오프라인 대비) — Timeline 포함
   */
  static localSave(projectId, editList, options = {}) {
    try {
      const timeline = buildTimeline(editList);
      const key = `moovlog_local_${projectId}`;
      localStorage.setItem(
        key,
        JSON.stringify({ projectId, editList, timeline, options, savedAt: Date.now() }),
      );
    } catch (_) {
      // quota exceeded 무시
    }
  }

  /** 로컬 localStorage에서 불러오기 */
  static localLoad(projectId) {
    try {
      const raw = localStorage.getItem(`moovlog_local_${projectId}`);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // timeline이 있으면 복원
      if (data.timeline?.length && !data.editList?.length) {
        data.editList = restoreEditList(data.timeline);
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  /**
   * 로컬 저장 항목 전체 목록
   * @returns {Array<{ projectId, savedAt }>}
   */
  static localList() {
    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith('moovlog_local_')) continue;
      try {
        const d = JSON.parse(localStorage.getItem(k));
        result.push({ projectId: d.projectId, savedAt: d.savedAt });
      } catch (_) {
        // 파싱 실패 무시
      }
    }
    return result.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
  }
}

export default SyncManager;
