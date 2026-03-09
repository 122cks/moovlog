// src/components/PromptInput.jsx
import { useVideoStore } from '../store/videoStore.js';

export default function PromptInput() {
  const { userPrompt, setUserPrompt } = useVideoStore();

  return (
    <div style={{ marginTop: '14px', width: '100%' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#aaa', fontSize: '0.82rem' }}>
        ✨ AI에게 특별히 부탁할 점 <span style={{ color: '#555', fontWeight: '400' }}>(선택)</span>
      </label>
      <textarea
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        placeholder="예: 조금 더 감성적인 톤으로 써줘, 가게 인테리어를 강조해줘, 자막에 이모지를 많이 써줘 등"
        rows={3}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 12px',
          backgroundColor: '#0f0f1a',
          border: '1px solid #333',
          borderRadius: '10px',
          color: '#e2e2e2',
          fontSize: '0.88rem',
          fontFamily: 'inherit',
          resize: 'none',
          outline: 'none',
          transition: 'border-color 0.2s',
          lineHeight: '1.5',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#8E2DE2')}
        onBlur={(e) => (e.target.style.borderColor = '#333')}
      />
    </div>
  );
}
