// src/engine/firebase.js  v2.73
// Firebase Storage / Firestore ?섑띁
// 異붽? 援ы쁽: #21-30 (EDL ?숆린?? 湲곌린媛??꾨줈?앺듃 怨듭쑀, 異⑸룎 ?닿껐, Auth)

import { initializeApp } from 'firebase/app';
import {
  getStorage, ref, uploadBytes, getDownloadURL,
} from 'firebase/storage';
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, getDocs, doc, updateDoc, where,
  deleteDoc, onSnapshot, setDoc, getDoc,
} from 'firebase/firestore';
import {
  getAuth, signInAnonymously, onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain:        'moovlog-be7a6.firebaseapp.com',
  projectId:         'moovlog-be7a6',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'moovlog-be7a6.firebasestorage.app',
  messagingSenderId: '173534090692',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let storage = null, db = null, auth = null, sessionDocId = null;
let _currentUserId = null;

function normalizeRestaurantName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function initFirebase() {
  // #3 API 키 형식 Pre-check (Firebase Web API Key = 'AIza' + 35자)
  const rawKey = firebaseConfig.apiKey;
  if (!rawKey || !firebaseConfig.appId) {
    console.log('[Firebase] API 키 없음 → Firebase 비활성 모드');
    return false;
  }
  if (!/^AIza[0-9A-Za-z\-_]{35}$/.test(rawKey)) {
    const badMsg =
      `Firebase API 키 형식이 올바르지 않습니다.\n` +
      `현재 값: "${rawKey.slice(0, 12)}..."\n\n` +
      `Firebase 콘솔 → 프로젝트 설정 → 웹 API 키를 복사해서 .env.local의\n` +
      `VITE_FIREBASE_API_KEY 값을 교체하세요.`;
    console.error('[Firebase] API 키 형식 오류 — 비활성 모드 실행');
    window.dispatchEvent(new CustomEvent('firebase-auth-error', { detail: { code: 'invalid-api-key', message: badMsg } }));
    return false;
  }
  try {
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    db      = getFirestore(app);
    auth    = getAuth(app);
    // #28 익명 Auth 자동 로그인 상태 감지
    onAuthStateChanged(auth, user => {
      _currentUserId = user?.uid || null;
    });
    // #1 인증 실패 시 에러 코드별 친절한 안내 이벤트
    signInAnonymously(auth).catch(err => {
      const code = err?.code || '';
      let userMsg = '';
      if (code === 'auth/operation-not-allowed') {
        userMsg =
          `Firebase 콘솔에서 '익명 로그인(Anonymous)' 기능을 활성화해야 합니다.\n\n` +
          `Firebase 콘솔 → Build → Authentication\n→ Sign-in method → Anonymous → 사용 설정`;
      } else if (/auth\/api-key|auth\/invalid-api-key/.test(code)) {
        userMsg =
          `Firebase API 키가 유효하지 않습니다.\n` +
          `.env.local의 VITE_FIREBASE_API_KEY 값을 확인하세요.`;
      } else if (err?.message?.includes('400')) {
        userMsg =
          `Firebase 인증 400 오류:\n` +
          `1. Firebase 콘솔 → Authentication → Sign-in method에서\n   '익명 로그인'을 활성화하세요.\n` +
          `2. Google Cloud → API 제한사항에 Identity Toolkit API가 포함됐는지 확인하세요.\n\n` +
          `오류 코드: ${code || 'unknown'}`;
      }
      if (userMsg) {
        window.dispatchEvent(new CustomEvent('firebase-auth-error', { detail: { code, message: userMsg } }));
      }
      console.warn('[Firebase] 인증 실패:', code, err?.message);
    });
    console.log('[Firebase] 초기화 완료 → moovlog-be7a6');
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
    console.log('[Firebase ??', storagePath);
    return url;
  } catch (e) {
    console.warn('[Firebase] ?낅줈???ㅽ뙣:', e.message);
    return null;
  }
}

export async function firebaseUploadOriginals(files, restaurantName, pipelineSessionId) {
  if (!storage) return;
  const session = pipelineSessionId || `${Date.now()}_${(restaurantName || 'noname').replace(/\s+/g, '_')}`;
  await Promise.all(
    files.map((m, i) =>
      fbUpload(m.file, `originals/${session}/${i}_${m.file.name}`)
        .catch(e => console.warn(`[Firebase] ?뚯씪 ${i} ?낅줈???ㅽ뙣:`, e.message))
    )
  );
}

export async function firebaseSaveSession(script, restaurantName) {
  if (!db) return;
  sessionDocId = null;
  try {
    const normalized = normalizeRestaurantName(restaurantName);
    const docRef = await addDoc(collection(db, 'sessions'), {
      restaurant:    restaurantName || '',
      restaurantKey: normalized,
      template:      'auto',
      sceneCount:    script.scenes.length,
      title:         script.title || '',
      version:       'v2.73-react',
      videoUrl:      null,
      ext:           null,
      userId:        _currentUserId,
      createdAt:     serverTimestamp(),
    });
    sessionDocId = docRef.id;
    console.log('[Firebase] ?몄뀡 ???', sessionDocId);
  } catch (e) {
    console.warn('[Firebase] ?몄뀡 ????ㅽ뙣:', e.message);
  }
}

export async function firebaseUploadVideo(blob, ext, restaurantName, pipelineSessionId) {
  if (!storage || !db) return;
  const session = pipelineSessionId || `${Date.now()}_${(restaurantName || 'noname').replace(/\s+/g, '_')}`;
  const url = await fbUpload(blob, `generated/${session}/video.${ext}`);
  if (!url) return;
  try {
    await addDoc(collection(db, 'generations'), {
      restaurant: restaurantName || '',
      videoUrl: url, ext,
      version: 'v2.73-react',
      userId: _currentUserId,
      createdAt: serverTimestamp(),
    });
    if (sessionDocId) {
      await updateDoc(doc(db, 'sessions', sessionDocId), { videoUrl: url, ext });
    }
  } catch (e) {
    console.warn('[Firebase] Firestore 湲곕줉 ?ㅽ뙣:', e.message);
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
    console.warn('[Firebase] 理쒓렐 ?몄뀡 濡쒕뱶 ?ㅽ뙣:', e.message);
    return null;
  }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// #22  EDL(?몄쭛 吏?쒖꽌) Firestore ?????湲곌린 媛??몄쭛 ?곹깭 ?숆린??
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
export async function saveEDLToFirestore(edl, projectId = null) {
  if (!db) return null;
  try {
    const data = {
      ...edl,
      userId:    _currentUserId,
      updatedAt: serverTimestamp(),
      platform:  typeof window !== 'undefined' && window.electronAPI?.isElectron
        ? 'electron' : 'web',
    };
    if (projectId) {
      await setDoc(doc(db, 'projects', projectId), data, { merge: true });
      console.log('[Firebase] EDL ?낅뜲?댄듃:', projectId);
      return projectId;
    } else {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      console.log('[Firebase] EDL ?좉퇋 ???', docRef.id);
      return docRef.id;
    }
  } catch (e) {
    console.warn('[Firebase] EDL ????ㅽ뙣:', e.message);
    return null;
  }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// #23  EDL ?ㅼ떆媛?援щ룆 ???ㅻⅨ 湲곌린?먯꽌 蹂寃????먮룞 諛섏쁺
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
export function subscribeEDL(projectId, onChange) {
  if (!db || !projectId) return () => {};
  const unsub = onSnapshot(doc(db, 'projects', projectId), snap => {
    if (snap.exists()) onChange({ id: snap.id, ...snap.data() });
  });
  return unsub;
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// #25  '理쒓렐 ?묒뾽???꾨줈?앺듃' 紐⑸줉 濡쒕뱶
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
export async function loadProjects(maxCount = 20) {
  if (!db) return [];
  try {
    const constraints = [orderBy('updatedAt', 'desc'), limit(maxCount)];
    if (_currentUserId) constraints.unshift(where('userId', '==', _currentUserId));
    const q    = query(collection(db, 'projects'), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[Firebase] ?꾨줈?앺듃 紐⑸줉 濡쒕뱶 ?ㅽ뙣:', e.message);
    return [];
  }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// #24  ??遺꾩꽍 ?곗씠???대낫?닿린/遺덈윭?ㅺ린 (#24 JSON ?숆린??
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
export async function exportSceneData(projectId, sceneData) {
  if (!db) return;
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      sceneAnalysis: JSON.stringify(sceneData),
      analysisAt:    serverTimestamp(),
    });
  } catch (e) {
    console.warn('[Firebase] ???곗씠??????ㅽ뙣:', e.message);
  }
}

export async function importSceneData(projectId) {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'projects', projectId));
    if (!snap.exists()) return null;
    const raw = snap.data().sceneAnalysis;
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[Firebase] ???곗씠??濡쒕뱶 ?ㅽ뙣:', e.message);
    return null;
  }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// #27  湲곌린 媛??ㅼ젙媛??숆린??(?ㅽ겕紐⑤뱶, ??κ꼍濡???
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
export async function syncSettings(settings) {
  if (!db || !_currentUserId) return;
  try {
    await setDoc(doc(db, 'user_settings', _currentUserId), {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('[Firebase] ?ㅼ젙 ?숆린???ㅽ뙣:', e.message);
  }
}

export async function loadSettings() {
  if (!db || !_currentUserId) return {};
  try {
    const snap = await getDoc(doc(db, 'user_settings', _currentUserId));
    return snap.exists() ? snap.data() : {};
  } catch (e) {
    console.warn('[Firebase] ?ㅼ젙 濡쒕뱶 ?ㅽ뙣:', e.message);
    return {};
  }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// #30  異⑸룎 ?닿껐 ??理쒖쥌 ?섏젙 ?쒓컙(updatedAt) 湲곕컲 蹂묓빀
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
export async function mergeWithConflictResolution(projectId, localEDL) {
  if (!db) return localEDL;
  try {
    const snap   = await getDoc(doc(db, 'projects', projectId));
    if (!snap.exists()) {
      await saveEDLToFirestore(localEDL, projectId);
      return localEDL;
    }
    const remote = snap.data();
    const localTs  = localEDL.updatedAt  || 0;
    const remoteTs = remote.updatedAt?.seconds || 0;

    if (localTs >= remoteTs) {
      // 濡쒖뺄??理쒖떊 ???먭꺽 ??뼱?곌린
      await saveEDLToFirestore(localEDL, projectId);
      console.log('[Firebase] 異⑸룎 ?닿껐: 濡쒖뺄 ?곗꽑');
      return localEDL;
    } else {
      // ?먭꺽??理쒖떊 ??濡쒖뺄 ?낅뜲?댄듃
      console.log('[Firebase] 異⑸룎 ?닿껐: ?먭꺽 ?곗꽑');
      return { id: projectId, ...remote };
    }
  } catch (e) {
    console.warn('[Firebase] 異⑸룎 ?닿껐 ?ㅽ뙣:', e.message);
    return localEDL;
  }
}

// ?? ?꾩옱 濡쒓렇???ъ슜??ID 怨듦컻 ????????????????????????????????????????????
export function getCurrentUserId() { return _currentUserId; }
export function isFirebaseReady()  { return !!db; }

// ═══════════════════════════════════════════════════════════════════════════
// 블로그 포스트 저장/조회
// ═══════════════════════════════════════════════════════════════════════════
export async function saveBlogPost(blogData) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, 'blog_posts'), {
      restaurant:       blogData.restaurant || '',
      location:         blogData.location || '',
      title:            blogData.title || '',
      body:             blogData.body || '',
      naverClipTags:    blogData.naver_clip_tags || '',
      youtubeTags:      blogData.youtube_shorts_tags || '',
      instagramCaption: blogData.instagram_caption || '',
      tiktokTags:       blogData.tiktok_tags || '',
      keywords:         blogData.keywords || [],
      userId:           _currentUserId,
      createdAt:        serverTimestamp(),
    });
    console.log('[Firebase] 블로그 저장:', docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn('[Firebase] 블로그 저장 실패:', e.message);
    return null;
  }
}

export async function getRecentBlogPosts(limitN = 20) {
  if (!db) return [];
  try {
    const q    = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'), limit(limitN));
    const snap = await getDocs(q);
    const results = [];
    snap.forEach(d => results.push({ id: d.id, ...d.data() }));
    return results;
  } catch (e) {
    console.warn('[Firebase] 블로그 목록 로드 실패:', e.message);
    return [];
  }
}

export async function searchBlogPosts(keyword) {
  if (!db || !keyword?.trim()) return [];
  const kw = keyword.trim();
  try {
    const q = query(
      collection(db, 'blog_posts'),
      orderBy('restaurant'),
      where('restaurant', '>=', kw),
      where('restaurant', '<=', kw + '\uf8ff'),
      limit(30),
    );
    const snap = await getDocs(q);
    const results = [];
    snap.forEach(d => results.push({ id: d.id, ...d.data() }));
    return results;
  } catch (e) {
    console.warn('[Firebase] 블로그 검색 실패:', e.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SNS 태그 저장
// ═══════════════════════════════════════════════════════════════════════════
export async function saveSNSTags(tagsData) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, 'sns_tags'), {
      restaurant:       tagsData.restaurant || '',
      naverClipTags:    tagsData.naver_clip_tags || '',
      youtubeTags:      tagsData.youtube_shorts_tags || '',
      instagramCaption: tagsData.instagram_caption || '',
      tiktokTags:       tagsData.tiktok_tags || '',
      hashtags:         tagsData.hashtags || '',
      userId:           _currentUserId,
      createdAt:        serverTimestamp(),
    });
    console.log('[Firebase] SNS 태그 저장:', docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn('[Firebase] SNS 태그 저장 실패:', e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 마케팅 키트 저장/조회/삭제
// ═══════════════════════════════════════════════════════════════════════════
export async function saveMarketingKit(data) {
  if (!db) return null;
  try {
    const normalized = normalizeRestaurantName(data.restaurant);
    const docRef = await addDoc(collection(db, 'marketing_kits'), {
      restaurant:        data.restaurant || '',
      restaurantKey:     normalized,
      hookTitle:         data.hook_title || '',
      caption:           data.caption || '',
      hashtags30:        data.hashtags_30 || '',
      receiptReview:     data.receipt_review || '',
      hookVariations:    data.hook_variations || [],
      naverClipTags:     data.naver_clip_tags || '',
      youtubeShortsTags: data.youtube_shorts_tags || '',
      instagramCaption:  data.instagram_caption || '',
      tiktokTags:        data.tiktok_tags || '',
      hashtags:          data.hashtags || '',
      theme:             data.theme || '',
      vibeColor:         data.vibe_color || '',
      userId:            _currentUserId,
      createdAt:         serverTimestamp(),
    });
    console.log('[Firebase] 마케팅 키트 저장:', docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn('[Firebase] 마케팅 키트 저장 실패:', e.message);
    return null;
  }
}

export async function getMarketingKits(limitN = 20) {
  if (!db) return [];
  try {
    const fetchN = Math.max(limitN * 4, 80);
    const q    = query(collection(db, 'marketing_kits'), orderBy('createdAt', 'desc'), limit(fetchN));
    const snap = await getDocs(q);
    const seen = new Set();
    const results = [];
    snap.forEach(d => {
      const data = { id: d.id, ...d.data() };
      const key  = data.restaurantKey || String(data.restaurant || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!seen.has(key)) { seen.add(key); results.push(data); }
    });
    return results.slice(0, limitN);
  } catch (e) {
    console.warn('[Firebase] 마케팅 키트 목록 실패:', e.message);
    return [];
  }
}

export async function searchMarketingKits(keyword) {
  if (!db || !keyword?.trim()) return [];
  const kw = keyword.trim();
  try {
    const q = query(
      collection(db, 'marketing_kits'),
      orderBy('restaurant'),
      where('restaurant', '>=', kw),
      where('restaurant', '<=', kw + '\uf8ff'),
      limit(60),
    );
    const snap = await getDocs(q);
    const seen = new Set();
    const results = [];
    const docs = [];
    snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
    docs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    docs.forEach(data => {
      const key = data.restaurantKey || String(data.restaurant || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!seen.has(key)) { seen.add(key); results.push(data); }
    });
    return results;
  } catch (e) {
    console.warn('[Firebase] 마케팅 키트 검색 실패:', e.message);
    return [];
  }
}

export async function deleteMarketingKit(id) {
  if (!db || !id) return;
  try {
    await deleteDoc(doc(db, 'marketing_kits', id));
    console.log('[Firebase] 마케팅 키트 삭제:', id);
  } catch (e) {
    console.warn('[Firebase] 마케팅 키트 삭제 실패:', e.message);
    throw e;
  }
}

// ─── 특정 식당명의 기존 데이터 일괄 삭제 ────────────────────────────────
async function deleteDocsByRestaurant(collectionName, restaurantName) {
  if (!db || !restaurantName) return 0;
  try {
    const normalized = normalizeRestaurantName(restaurantName);
    const q    = query(collection(db, collectionName), where('restaurantKey', '==', normalized), limit(30));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      return snap.size;
    }
    const legacyQ    = query(collection(db, collectionName), where('restaurant', '==', restaurantName.trim()), limit(30));
    const legacySnap = await getDocs(legacyQ);
    if (legacySnap.empty) return 0;
    await Promise.all(legacySnap.docs.map(d => deleteDoc(d.ref)));
    return legacySnap.size;
  } catch (e) {
    console.warn(`[Firebase] ${collectionName} 삭제 실패:`, e.message);
    return 0;
  }
}

export async function firebaseReplaceRestaurantData(script, restaurantName, marketingData) {
  if (!db) return;
  await Promise.all([
    deleteDocsByRestaurant('sessions', restaurantName),
    deleteDocsByRestaurant('marketing_kits', restaurantName),
  ]);
  await firebaseSaveSession(script, restaurantName).catch(() => {});
  if (marketingData) await saveMarketingKit(marketingData).catch(() => {});
}

