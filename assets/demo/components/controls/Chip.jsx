import React from 'react';
/** Fill capsule chip, Medium 15. selected = ink capsule with bg text (day strip). muted = grey text. */
export function Chip({ children, selected, muted, height = 34, onClick }) {
  return <button onClick={onClick} style={{ flex: 'none', minHeight: height, padding: '0 14px', border: 0, borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', background: selected ? 'var(--slate-ink)' : 'var(--slate-fill)', color: selected ? 'var(--slate-bg)' : muted ? 'var(--slate-ink-mute)' : 'var(--slate-ink)', font: '500 15px/1 var(--font-sans)' }}>{children}</button>;
}