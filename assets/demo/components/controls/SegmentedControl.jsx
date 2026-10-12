import React from 'react';
/** Wider segmented control (34pt segments, 15pt): scanner tabs, grams/servings. No thumb shadow. */
export function SegmentedControl({ options, selection = 0, onChange }) {
  return <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 999, background: 'var(--slate-fill)' }}>
    {options.map((o, i) => { const s = i === selection; return <button key={o} onClick={() => onChange && onChange(i)} style={{ flex: 1, minHeight: 34, border: 0, borderRadius: 999, cursor: 'pointer', background: s ? 'var(--slate-surface)' : 'transparent', font: (s ? 600 : 400) + ' 15px/1 var(--font-sans)', color: s ? 'var(--slate-ink)' : 'var(--slate-ink-mute)', transition: 'background 250ms' }}>{o}</button>; })}
  </div>;
}