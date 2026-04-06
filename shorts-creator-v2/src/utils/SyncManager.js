/**
 * SyncManager.js — Firebase Firestore 기반 프로젝트 동기화 (#Firebase Sync)
 *
 * 사용법 (렌더러/웹):
 *   import SyncManager from './SyncManager';
 *   const sm = new SyncManager(firebaseApp, userId);
 *   await sm.save('project_01', editList, options);
 *   const data = await sm.load('project_01');
 *   const list = await sm.listProjects();
 *   await sm.delete('project_01');
 */

// ── Firebase import ──────────────────────────────────────────────────────────
// firebaseApp은 외부에서 주입받음 (firebase/app으로 초기화된 인스턴스)
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// ── 상수 ────────────────────────────────────────────────────────────────────
const COLLECTION = 'projects'; // Firestore 컬렉션 이름
const MAX_PROJECTS = 50;       // 사용자당 최대 보관 프로젝트 수

// ── SyncManager 클래스 ──────────────────────────────────────────────────────
export class SyncManager {
  /**
   * @param {import('firebase/app').FirebaseApp} firebaseApp
   * @param {string} userId  Firebase Auth uid
   */
  constructor(firebaseApp, userId) {
    if (!firebaseApp) throw new Error('SyncManager: firebaseApp 필요');
    if (!userId) throw new Error('SyncManager: userId 필요');
    this._db = getFirestore(firebaseApp);
    this._uid = userId;
  }

  /** 사용자별 프로젝트 컬렉션 참조 */
  _col() {
    return collection(this._db, 'users', this._uid, COLLECTION);
  }

  /** 특정 프로젝트 문서 참조 */
  _docRef(projectId) {
    return doc(this._db, 'users', this._uid, COLLECTION, projectId);
  }

  /**
   * 프로젝트 저장 (신규 or 덮어쓰기)
   * @param {string} projectId
   * @param {Array}  editList   클립 배열
   * @param {Object} options    렌더링 옵션
   * @param {string} [title]    프로젝트 이름 (기본: projectId)
   */
  async save(projectId, editList, options = {}, title = '') {
    if (!projectId) throw new Error('save: projectId 필요');
    const payload = {
      projectId,
      title: title || projectId,
      editList,
      options,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(), // setDoc(merge) 이라 첫 번째만 적용됨
      uid: this._uid,
    };
    await setDoc(this._docRef(projectId), payload, { merge: true });
    return projectId;
  }

  /**
   * 프로젝트 불러오기
   * @param {string} projectId
   * @returns {{ projectId, title, editList, options, updatedAt } | null}
   */
  async load(projectId) {
    const snap = await getDoc(this._docRef(projectId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      projectId: data.projectId,
      title: data.title,
      editList: data.editList ?? [],
      options: data.options ?? {},
      updatedAt: data.updatedAt?.toDate() ?? null,
    };
  }

  /**
   * 사용자의 프로젝트 목록 (updatedAt 내림차순)
   * @returns {Array<{ projectId, title, updatedAt }>}
   */
  async listProjects() {
    const q = query(this._col(), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.slice(0, MAX_PROJECTS).map((d) => ({
      projectId: d.data().projectId,
      title: d.data().title,
      updatedAt: d.data().updatedAt?.toDate() ?? null,
    }));
  }

  /**
   * 프로젝트 삭제
   * @param {string} projectId
   */
  async delete(projectId) {
    await deleteDoc(this._docRef(projectId));
  }

  /**
   * 로컬 localStorage에 임시 저장 (오프라인 대비)
   * @param {string} projectId
   * @param {Array}  editList
   * @param {Object} options
   */
  static localSave(projectId, editList, options = {}) {
    try {
      const key = `moovlog_local_${projectId}`;
      localStorage.setItem(
        key,
        JSON.stringify({ projectId, editList, options, savedAt: Date.now() }),
      );
    } catch (_) {
      // quota exceeded 등 무시
    }
  }

  /**
   * 로컬 localStorage에서 불러오기
   * @param {string} projectId
   * @returns {{ projectId, editList, options, savedAt } | null}
   */
  static localLoad(projectId) {
    try {
      const raw = localStorage.getItem(`moovlog_local_${projectId}`);
      return raw ? JSON.parse(raw) : null;
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
