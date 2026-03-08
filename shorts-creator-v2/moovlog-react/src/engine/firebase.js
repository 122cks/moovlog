// src/engine/firebase.js
// Firebase Storage / Firestore 래퍼

import { initializeApp } from 'firebase/app';
import {
  getStorage, ref, uploadBytes, getDownloadURL,
} from 'firebase/storage';
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, getDocs, doc, updateDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain:        'moovlog-be7a6.firebaseapp.com',
  projectId:         'moovlog-be7a6',
  storageBucket:     'moovlog-be7a6.appspot.com',
  messagingSenderId: '173534090692',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let storage = null, db = null, sessionDocId = null;

export function initFirebase() {
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
    console.log('[Firebase] API 키 없음 — 로컬 모드');
    return false;
  }
  try {
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    db      = getFirestore(app);
    console.log('[Firebase] 초기화 완료 — moovlog-be7a6');
    return true;
  } catch (e) {
    console.warn('[Firebase] 초기화 실패:', e.message);
    return false;
  }
}

async function fbUpload(blob, storagePath) {
  if (!storage) return null;
  try {
    const storRef = ref(storage, storagePath);
    const snap    = await uploadBytes(storRef, blob);
    const url     = await getDownloadURL(snap.ref);
    console.log('[Firebase ✓]', storagePath);
    return url;
  } catch (e) {
    console.warn('[Firebase] 업로드 실패:', e.message);
    return null;
  }
}

export async function firebaseUploadOriginals(files, restaurantName) {
  if (!storage) return;
  const session = `${Date.now()}_${(restaurantName || 'noname').replace(/\s+/g, '_')}`;
  files.forEach((m, i) => {
    fbUpload(m.file, `originals/${session}/${i}_${m.file.name}`);
  });
}

export async function firebaseSaveSession(script, restaurantName) {
  if (!db) return;
  sessionDocId = null;
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      restaurant: restaurantName || '',
      template:   'auto',
      sceneCount: script.scenes.length,
      title:      script.title || '',
      version:    'v2.0-react',
      videoUrl:   null,
      ext:        null,
      createdAt:  serverTimestamp(),
    });
    sessionDocId = docRef.id;
    console.log('[Firebase] 세션 저장:', sessionDocId);
  } catch (e) {
    console.warn('[Firebase] 세션 저장 실패:', e.message);
  }
}

export async function firebaseUploadVideo(blob, ext, restaurantName) {
  if (!storage || !db) return;
  const session = `${Date.now()}_${(restaurantName || 'noname').replace(/\s+/g, '_')}`;
  const url = await fbUpload(blob, `generated/${session}/video.${ext}`);
  if (!url) return;
  try {
    await addDoc(collection(db, 'generations'), {
      restaurant: restaurantName || '',
      videoUrl: url, ext,
      version: 'v2.0-react',
      createdAt: serverTimestamp(),
    });
    if (sessionDocId) {
      await updateDoc(doc(db, 'sessions', sessionDocId), { videoUrl: url, ext });
    }
  } catch (e) {
    console.warn('[Firebase] Firestore 기록 실패:', e.message);
  }
}

export async function firebaseLoadRecentSession() {
  if (!db) return null;
  try {
    const q    = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'), limit(5));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    let latest = null;
    snap.forEach(d => { if (!latest && d.data().videoUrl) latest = { id: d.id, ...d.data() }; });
    return latest;
  } catch (e) {
    console.warn('[Firebase] 최근 세션 로드 실패:', e.message);
    return null;
  }
}
