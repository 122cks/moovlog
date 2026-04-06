// src/engine/firebase.js
// Firebase Storage / Firestore ?˜í¼

import { initializeApp } from 'firebase/app';
import {
  getStorage, ref, uploadBytes, getDownloadURL,
} from 'firebase/storage';
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, getDocs, doc, updateDoc, where, deleteDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain:        'moovlog-be7a6.firebaseapp.com',
  projectId:         'moovlog-be7a6',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'moovlog-be7a6.firebasestorage.app',
  messagingSenderId: '173534090692',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let storage = null, db = null, sessionDocId = null;

function normalizeRestaurantName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function initFirebase() {
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
    console.log('[Firebase] API ???†ìŒ ??ë¡œì»¬ ëª¨ë“œ');
    return false;
  }
  try {
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    db      = getFirestore(app);
    console.log('[Firebase] ì´ˆê¸°???„ë£Œ ??moovlog-be7a6');
    return true;
  } catch (e) {
    console.warn('[Firebase] ì´ˆê¸°???¤íŒ¨:', e.message);
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
    console.warn('[Firebase] ?…ë¡œ???¤íŒ¨:', e.message);
    return null;
  }
}

export async function firebaseUploadOriginals(files, restaurantName, pipelineSessionId) {
  if (!storage) return;
  const session = pipelineSessionId || `${Date.now()}_${(restaurantName || 'noname').replace(/\s+/g, '_')}`;
  await Promise.all(
    files.map((m, i) =>
      fbUpload(m.file, `originals/${session}/${i}_${m.file.name}`)
        .catch(e => console.warn(`[Firebase] ?Œì¼ ${i} ?…ë¡œ???¤íŒ¨:`, e.message))
    )
  );
}

export async function firebaseSaveSession(script, restaurantName) {
  if (!db) return;
  sessionDocId = null;
  try {
    const normalized = normalizeRestaurantName(restaurantName);
    const docRef = await addDoc(collection(db, 'sessions'), {
      restaurant: restaurantName || '',
      restaurantKey: normalized,
      template:   'auto',
      sceneCount: script.scenes.length,
      title:      script.title || '',
      version:    'v2.69-react',
      videoUrl:   null,
      ext:        null,
      createdAt:  serverTimestamp(),
    });
    sessionDocId = docRef.id;
    console.log('[Firebase] ?¸ì…˜ ?€??', sessionDocId);
  } catch (e) {
    console.warn('[Firebase] ?¸ì…˜ ?€???¤íŒ¨:', e.message);
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
      version: 'v2.69-react',
      createdAt: serverTimestamp(),
    });
    if (sessionDocId) {
      await updateDoc(doc(db, 'sessions', sessionDocId), { videoUrl: url, ext });
    }
  } catch (e) {
    console.warn('[Firebase] Firestore ê¸°ë¡ ?¤íŒ¨:', e.message);
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
    console.warn('[Firebase] ìµœê·¼ ?¸ì…˜ ë¡œë“œ ?¤íŒ¨:', e.message);
    return null;
  }
}

// ?€?€?€ ë¸”ë¡œê·??¬ìŠ¤???€???€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
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
    console.log('[Firebase] ë¸”ë¡œê·??€??', docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn('[Firebase] ë¸”ë¡œê·??€???¤íŒ¨:', e.message);
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
    console.warn('[Firebase] ë¸”ë¡œê·?ëª©ë¡ ë¡œë“œ ?¤íŒ¨:', e.message);
    return [];
  }
}

export async function searchBlogPosts(keyword) {
  if (!db || !keyword?.trim()) return [];
  const kw = keyword.trim();
  try {
    // restaurant ?„ë“œ ?„ë°© ?¼ì¹˜ ê²€??(Firestore??full-text ë¯¸ì?????startAt/endAt ë°©ì‹)
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
    console.warn('[Firebase] ë¸”ë¡œê·?ê²€???¤íŒ¨:', e.message);
    return [];
  }
}

// ?€?€?€ SNS ?œê·¸ ?€???€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
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
    console.log('[Firebase] SNS ?œê·¸ ?€??', docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn('[Firebase] SNS ?œê·¸ ?€???¤íŒ¨:', e.message);
    return null;
  }
}

// ?€?€?€ ë§ˆì????¤íŠ¸ ?€??(?í¼ ?ì„± ???ë™ ?€?? ?€?€?€?€?€?€?€?€?€?€?€?€
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
      createdAt:         serverTimestamp(),
    });
    console.log('[Firebase] ë§ˆì????¤íŠ¸ ?€??', docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn('[Firebase] ë§ˆì????¤íŠ¸ ?€???¤íŒ¨:', e.message);
    return null;
  }
}

export async function getMarketingKits(limitN = 20) {
  if (!db) return [];
  try {
    // ì¤‘ë³µ ?œê±°ë¥??„í•´ ??ë§ì´ ê°€?¸ì????´ë¼?´ì–¸?¸ì—??dedup
    const fetchN = Math.max(limitN * 4, 80);
    const q    = query(collection(db, 'marketing_kits'), orderBy('createdAt', 'desc'), limit(fetchN));
    const snap = await getDocs(q);
    const seen = new Set();
    const results = [];
    snap.forEach(d => {
      const data = { id: d.id, ...d.data() };
      // restaurantKey(?•ê·œ???? ?°ì„ , ?†ìœ¼ë©?restaurant ?Œë¬¸???¸ë¦¼
      const key = data.restaurantKey || String(data.restaurant || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!seen.has(key)) {
        seen.add(key);
        results.push(data);
      }
    });
    return results.slice(0, limitN);
  } catch (e) {
    console.warn('[Firebase] ë§ˆì????¤íŠ¸ ëª©ë¡ ?¤íŒ¨:', e.message);
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
    // createdAt ?´ë¦¼ì°¨ìˆœ ?•ë ¬ ??dedup
    const docs = [];
    snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
    docs.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
    docs.forEach(data => {
      const key = data.restaurantKey || String(data.restaurant || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!seen.has(key)) { seen.add(key); results.push(data); }
    });
    return results;
  } catch (e) {
    console.warn('[Firebase] ë§ˆì????¤íŠ¸ ê²€???¤íŒ¨:', e.message);
    return [];
  }
}

export async function deleteMarketingKit(id) {
  if (!db || !id) return;
  try {
    await deleteDoc(doc(db, 'marketing_kits', id));
    console.log('[Firebase] ë§ˆì????¤íŠ¸ ?? œ:', id);
  } catch (e) {
    console.warn('[Firebase] ë§ˆì????¤íŠ¸ ?? œ ?¤íŒ¨:', e.message);
    throw e;
  }
}

// ?€?€?€ ?ë‹¹ëª?ê¸°ì? ê¸°ì¡´ ?°ì´???? œ (ê°™ì? ?ë‹¹ ?¬ìƒ?????€ì²? ?€?€?€?€
async function deleteDocsByRestaurant(collectionName, restaurantName) {
  if (!db || !restaurantName) return 0;
  try {
    const normalized = normalizeRestaurantName(restaurantName);
    const q = query(
      collection(db, collectionName),
      where('restaurantKey', '==', normalized),
      limit(30),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      console.log(`[Firebase] ${collectionName} ê¸°ì¡´ ${snap.size}ê°??? œ (${restaurantName})`);
      return snap.size;
    }

    // êµ¬ë²„???°ì´???¸í™˜: restaurantKey ?†ëŠ” ë¬¸ì„œ??restaurant ?ë¬¸?¼ë¡œ 1???´ë°± ?? œ
    const legacyQ = query(
      collection(db, collectionName),
      where('restaurant', '==', restaurantName.trim()),
      limit(30),
    );
    const legacySnap = await getDocs(legacyQ);
    if (legacySnap.empty) return 0;
    await Promise.all(legacySnap.docs.map(d => deleteDoc(d.ref)));
    console.log(`[Firebase] ${collectionName} ?ˆê±°??${legacySnap.size}ê°??? œ (${restaurantName})`);
    return legacySnap.size;
  } catch (e) {
    console.warn(`[Firebase] ${collectionName} ?? œ ?¤íŒ¨:`, e.message);
    return 0;
  }
}

/**
 * ê¸°ì¡´ ?¸ì…˜Â·ë§ˆì????¤íŠ¸ë¥??? œ?˜ê³  ???°ì´?°ë¡œ ?€ì²? * ê°™ì? ?ë‹¹ëª…ìœ¼ë¡??¬ìƒ????Firebase??ì¤‘ë³µ ?„ì ?˜ì? ?Šë„ë¡??? */
export async function firebaseReplaceRestaurantData(script, restaurantName, marketingData) {
  if (!db) return;
  // ê¸°ì¡´ ?ˆì½”???? œ (ë³‘ë ¬)
  await Promise.all([
    deleteDocsByRestaurant('sessions', restaurantName),
    deleteDocsByRestaurant('marketing_kits', restaurantName),
  ]);
  // ???°ì´???€??  await firebaseSaveSession(script, restaurantName).catch(() => {});
  if (marketingData) await saveMarketingKit(marketingData).catch(() => {});
}
