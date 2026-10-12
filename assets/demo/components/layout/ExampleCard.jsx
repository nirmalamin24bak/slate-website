import React from 'react';
/** Onboarding example rows on a surface card (20pt radius): Regular 15 text, Medium 15 figure, inset hairlines. */
export function ExampleCard({ rows = [] }) {
  return <div style={{ background: 'var(--slate-surface)', border: '1px solid var(--border-hairline)', borderRadius: 20, padding: '4px 0', width: '100%' }}>
    {rows.map((r, i) => <React.Fragment key={i}>
      {i > 0 && <div style={{ height: 1, background: 'var(--border-hairline)', marginLeft: 16 }} />}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 42, padding: '0 16px', gap: 12, color: r.muted ? 'var(--slate-ink-mute)' : 'var(--slate-ink)' }}>
        <span style={{ flex: 1, font: '400 15px/1.3 var(--font-sans)' }}>{r.text}</span>
        {r.value != null ? <span style={{ font: '500 15px/1 var(--font-sans)' }}>{r.value}</span> : r.check && <span style={{ font: '400 14px/1 var(--font-sans)', color: 'var(--slate-ink-mute)' }}>✓</span>}
      </div>
    </React.Fragment>)}
  </div>;
}