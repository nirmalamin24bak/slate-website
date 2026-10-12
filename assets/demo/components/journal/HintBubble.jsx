import React from 'react';
/** Small popover: one sentence, surface, 14pt radius, hairline, faint shadow. 240pt wide. */
export function HintBubble({ children = 'Not sure what this is. Try adding detail?' }) {
  return <div style={{ width: 240, boxSizing: 'border-box', padding: '10px 14px', background: 'var(--slate-surface)', border: '1px solid var(--border-hairline)', borderRadius: 14, boxShadow: 'var(--shadow-bubble)', font: '400 13px/1.35 var(--font-sans)', color: 'var(--slate-ink)' }}>{children}</div>;
}