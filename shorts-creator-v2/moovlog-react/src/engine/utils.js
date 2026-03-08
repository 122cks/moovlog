// src/engine/utils.js

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function splitCaptions(text) {
  if (!text) return ['', ''];
  const clean = text.trim();
  if (clean.includes('\n')) {
    const parts = clean.split('\n').map(s => s.trim()).filter(Boolean);
    return [parts[0] || '', parts.slice(1).join(' ') || ''];
  }
  const sm = clean.match(/^(.{3,14}[.!?…]+)\s*(.{2,})$/);
  if (sm) return [sm[1], sm[2]];
  const cp = clean.split(/[,，]/);
  if (cp.length >= 2 && cp[0].trim().length >= 3)
    return [cp[0].trim(), cp.slice(1).join(',').trim()];
  const stripped = clean.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim();
  if (stripped.length <= 10) return [clean, ''];
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
  const mid = Math.ceil(clean.length / 2);
  return [clean.slice(0, mid), clean.slice(mid)];
}

export function formatDuration(sec) {
  const s  = Math.max(0, Math.floor(Number(sec) || 0));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p  = n => String(n).padStart(2, '0');
  return hh > 0 ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
}

export function sanitizeName(name) {
  return (name || 'video').replace(/\s+/g, '_') + '_' + Date.now();
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 8000);
}
