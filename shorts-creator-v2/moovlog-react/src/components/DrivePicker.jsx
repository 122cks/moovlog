// src/components/DrivePicker.jsx
import { useEffect, useState } from 'react';
import { useVideoStore } from '../store/videoStore.js';

const API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API || '';

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true; s.defer = true;
    s.onload = resolve; s.onerror = resolve;
    document.body.appendChild(s);
  });
}

export default function DrivePicker() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addFiles, addToast } = useVideoStore();

  useEffect(() => {
    (async () => {
      await Promise.all([
        loadScript('https://apis.google.com/js/api.js').then(
          () => new Promise(r => window.gapi.load('picker', r))
        ),
        loadScript('https://accounts.google.com/gsi/client'),
      ]);
      setReady(true);
    })();
  }, []);

  const getClientId = () => {
    let id = localStorage.getItem('moovlog_google_client_id') || '';
    if (!id) {
      id = prompt(
        'Google OAuth 클라이언트 ID를 입력하세요.\n(GCP 콘솔 > 사용자 인증 정보 > OAuth 클라이언트 ID)\n예: 123456789-abc.apps.googleusercontent.com',
        ''
      ) || '';
      if (id) localStorage.setItem('moovlog_google_client_id', id.trim());
    }
    return id.trim();
  };

  const handleClick = () => {
    if (!ready) { addToast('Google API 로딩 중...', 'inf'); return; }
    if (!API_KEY) { addToast('Google API 키가 설정되지 않았습니다.', 'err'); return; }
    const clientId = getClientId();
    if (!clientId) { addToast('클라이언트 ID가 필요합니다.', 'err'); return; }

    window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (resp) => {
        if (resp.error) { addToast('Google 로그인 실패: ' + resp.error, 'err'); return; }
        openPicker(resp.access_token, clientId);
      },
    }).requestAccessToken({ prompt: 'consent' });
  };

  const openPicker = (accessToken, clientId) => {
    const appId = clientId.split('-')[0];
    const myView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    myView.setMimeTypes('image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/x-m4v');
    const sharedView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    sharedView.setMimeTypes('image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/x-m4v');
    sharedView.setOwnedByMe(false);

    new window.google.picker.PickerBuilder()
      .addView(myView)
      .addView(sharedView)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .setAppId(appId)
      .setCallback((data) => pickerCallback(data, accessToken))
      .build()
      .setVisible(true);
  };

  const pickerCallback = async (data, accessToken) => {
    if (data.action !== window.google.picker.Action.PICKED) return;
    const docs = data.docs || [];
    if (!docs.length) return;
    setLoading(true);
    addToast(`${docs.length}개 파일 다운로드 중...`, 'inf');
    try {
      const files = await Promise.all(docs.map(async (doc) => {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(doc.id)}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error(`'${doc.name}' 다운로드 실패 (${res.status})`);
        const blob = await res.blob();
        return new File([blob], doc.name, { type: doc.mimeType || blob.type });
      }));
      addFiles(files);
      addToast(`${files.length}개 파일을 드라이브에서 추가했습니다!`, 'ok');
    } catch (err) {
      console.error('[DrivePicker]', err);
      addToast(err.message || '파일 다운로드 중 오류 발생', 'err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="drive-import-btn"
      title="Google Drive에서 사진/영상 불러오기"
    >
      <svg width="18" height="15" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
      </svg>
      {loading ? '다운로드 중...' : '드라이브에서 가져오기'}
    </button>
  );
}
