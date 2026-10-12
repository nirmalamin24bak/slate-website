import React from 'react';
/** Thin 4pt capsule bar on track. Over 1 stays full. */
export function BudgetBar({ fill = 0, color = 'var(--slate-ink)', minFill = 8 }) {
  const f = Math.min(Math.max(fill, 0), 1);
  return <div style={{ height: 4, borderRadius: 999, background: 'var(--bar-track)', overflow: 'hidden' }}>
    <div style={{ height: 4, borderRadius: 999, background: color, width: f > 0 ? 'max(' + (f * 100) + '%, ' + minFill + 'px)' : 0, transition: 'width 450ms var(--ease-snappy)' }} />
  </div>;
}