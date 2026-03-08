// src/components/ToastContainer.jsx
import { useEffect } from 'react';
import { useVideoStore } from '../store/videoStore.js';

export default function ToastContainer() {
  const { toasts, removeToast } = useVideoStore();

  return (
    <div className="toasts">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 3500);
    return () => clearTimeout(timer);
  }, []);

  const icons = { ok: 'fa-check-circle', err: 'fa-exclamation-circle', inf: 'fa-info-circle' };

  return (
    <div className={`toast ${toast.type}`} onClick={onRemove}>
      <i className={`fas ${icons[toast.type] || icons.inf}`} />
      <span>{toast.msg}</span>
    </div>
  );
}
