import React from 'react';
/** Compact segmented control (32pt): fill track, surface thumb with faint shadow, 13pt labels. */
export function PillSegmented({ options, selection = 0, onChange, width = 232 }) {
  const n = options.length;
  return <div style={{ position: 'relative', width, height: 32, borderRadius: 999, background: 'var(--slate-fill)' }}>
    {selection >= 0 && <div style={{ position: 'absolute', top: 2, left: 'calc(' + (selection * 100 / n) + '% + 2px)', width: 'calc(' + (100 / n) + '% - 4px)', height: 28, borderRadius: 999, background: 'var(--slate-surface)', boxShadow: 'var(--shadow-thumb)', transition: 'left 250ms var(--ease-snappy)' }} />}
    <div style={{ position: 'relative', display: 'flex', height: '100%' }}>
      {options.map((o, i) => <button key={o} onClick={() => onChange && onChange(i)} style={{ flex: 1, border: 0, background: 'none', cursor: 'pointer', font: (i === selection ? 600 : 400) + ' 13px/1 var(--font-sans)', color: i === selection ? 'var(--slate-ink)' : 'var(--slate-ink-mute)' }}>{o}</button>)}
    </div>
  </div>;
}