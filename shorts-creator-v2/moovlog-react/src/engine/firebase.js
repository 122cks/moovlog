// src/engine/firebase.js
// Firebase Storage / Firestore 래퍼

import { initializeApp } from 'firebase/app';
import {
  getStorage, ref, uploadBytes, getDownloadURL,
} from 'firebase/storage';
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, getDocs, doc, updateDoc, where,
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

export async function firebaseUploadOriginals(files, restaurantName, pipelineSessionId) {
  if (!storage) return;
  const session = pipelineSessionId || `${Date.now()}_${(restaurantName || 'noname').replace(/\s+/g, '_')}`;
  await Promise.all(
    files.map((m, i) =>
      fbUpload(m.file, `originals/${session}/${i}_${m.file.name}`)
        .catch(e => console.warn(`[Firebase] 파일 ${i} 업로드 실패:`, e.message))
    )
  );
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
      version:    'v2.6-react',
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

export async function firebaseUploadVideo(blob, ext, restaurantName, pipelineSessionId) {
  if (!storage || !db) return;
  const session = pipelineSessionId || `${Date.now()}_${(restaurantName || 'noname').replace(/\s+/g, '_')}`;
  const url = await fbUpload(blob, `generated/${session}/video.${ext}`);
  if (!url) return;
    try {
    await addDoc(collection(db, 'generations'), {
      restaurant: restaurantName || '',
      videoUrl: url, ext,
      version: 'v2.6-react',
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

// ─── 블로그 포스팅 저장 ───────────────────────────────────
export async function saveBlogPost(blogData) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, 'blog_posts'), {
      restaurant: blogData.restaurant || '',
      location:   blogData.location || '',
      title:      blogData.title || '',
      body:       blogData.body || '',
      naverClipTags:    blogData.naver_clip_tags || '',
      youtubeTags:      blogData.youtube_shorts_tags || '',
      instagramCaption: blogData.instagram_caption || '',
      tiktokTags:       blogData.tiktok_tags || '',
      keywords:   blogData.keywords || [],
      createdAt:  serverTimestamp(),
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
    // restaurant 필드 전방 일치 검색 (Firestore는 full-text 미지원 → startAt/endAt 방식)
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

// ─── SNS 태그 저장 ────────────────────────────────────────
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
      createdAt:        serverTimestamp(),
    });
    console.log('[Firebase] SNS 태그 저장:', docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn('[Firebase] SNS 태그 저장 실패:', e.message);
    return null;
  }
}

// ─── 마케팅 키트 저장 (숏폼 생성 후 자동 저장) ────────────
export async function saveMarketingKit(data) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, 'marketing_kits'), {
      restaurant:        data.restaurant || '',
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
    const q    = query(collection(db, 'marketing_kits'), orderBy('createdAt', 'desc'), limit(limitN));
    const snap = await getDocs(q);
    const results = [];
    snap.forEach(d => results.push({ id: d.id, ...d.data() }));
    return results;
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
      limit(30),
    );
    const snap = await getDocs(q);
    const results = [];
    snap.forEach(d => results.push({ id: d.id, ...d.data() }));
    return results;
  } catch (e) {
    console.warn('[Firebase] 마케팅 키트 검색 실패:', e.message);
    return [];
  }
}
