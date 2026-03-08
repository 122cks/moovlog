// src/components/SNSTags.jsx
import { useVideoStore } from '../store/videoStore.js';

/* ── 플랫폼별 태그 정제 함수 ── */
function processNaver(text) {
  const raw = text || '';
  const t = raw.startsWith('#협찬') ? raw : '#협찬 ' + raw;
  if (t.length <= 300) return t;
  const cut = t.slice(0, 300);
  const sp = cut.lastIndexOf(' ');
  return sp > 0 ? cut.slice(0, sp) : cut;
}

function processYoutube(text) {
  const raw = text || '';
  if (raw.length <= 100) return raw;
  const cut = raw.slice(0, 100);
  const sp = cut.lastIndexOf(' ');
  return sp > 85 ? cut.slice(0, sp) : cut;
}

function processTikTok(text) {
  const tags = (text || '').match(/#[^\s#]+/g) || [];
  return tags.slice(0, 5).join(' ');
}

function processInsta(caption) {
  if (!caption) return '';
  const sep = caption.indexOf('\n\n');
  if (sep !== -1) {
    const desc = caption.slice(0, sep);
    const tags = (caption.slice(sep + 2).match(/#[^\s#]+/g) || []).slice(0, 5);
    return desc + '\n\n' + tags.join(' ');
  }
  const tags = (caption.match(/#[^\s#]+/g) || []).slice(0, 5);
  return tags.length ? tags.join(' ') : caption;
}

export default function SNSTags({ script }) {
  if (!script) return null;
  const { addToast } = useVideoStore();

  const copy = async text => {
    try { await navigator.clipboard.writeText(text); addToast('클립보드 복사 완료!', 'ok'); }
    catch { addToast('복사 실패', 'err'); }
  };

  const tags = [
    { badge: 'naver',   label: 'N 클립',  limit: '300자 (#협찬 포함)',  text: processNaver(script.naver_clip_tags) },
    { badge: 'youtube', label: '▶ 쇼츠',  limit: '100자 이내',          text: processYoutube(script.youtube_shorts_tags) },
    { badge: 'insta',   label: '◎ 릴스',  limit: '캡션 + 5개 태그',     text: processInsta(script.instagram_caption) },
    { badge: 'tiktok',  label: '♪ 틱톡',  limit: '5개만',               text: processTikTok(script.tiktok_tags) },
  ];

  return (
    <div className="sns-wrap">
      <p className="sns-title"><i className="fas fa-hashtag" /> SNS 플랫폼별 태그</p>
      {tags.map((t, i) => (
        <div key={i} className="sns-card">
          <div className="sns-card-head">
            <span className={`sns-badge ${t.badge}`}>{t.label}</span>
            <span className="sns-limit">{t.limit}</span>
            <button className="sns-copy-btn" onClick={() => copy(t.text)}>
              <i className="fas fa-copy" /> 복사
            </button>
          </div>
          <div className="sns-text">{t.text}</div>
        </div>
      ))}
    </div>
  );
}
