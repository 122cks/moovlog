// src/components/SNSTags.jsx
import { useVideoStore } from '../store/videoStore.js';

export default function SNSTags({ script }) {
  if (!script) return null;
  const { addToast } = useVideoStore();

  const copy = async text => {
    try { await navigator.clipboard.writeText(text); addToast('클립보드 복사 완료!', 'ok'); }
    catch { addToast('복사 실패', 'err'); }
  };

  const tags = [
    { badge: 'naver',   label: 'N 클립',  limit: '300자 이내',  text: script.naver_clip_tags || '' },
    { badge: 'youtube', label: '▶ 쇼츠',  limit: '100자 이내',  text: script.youtube_shorts_tags || '' },
    { badge: 'insta',   label: '◎ 릴스',  limit: '캡션 + 태그', text: script.instagram_caption || '' },
    { badge: 'tiktok',  label: '♪ 틱톡',  limit: '5개',          text: script.tiktok_tags || '' },
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
