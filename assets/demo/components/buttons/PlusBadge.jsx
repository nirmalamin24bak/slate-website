import React from 'react';
/** Small "Plus" capsule: accent text on 10% accent fill. Marks Slate Plus features. */
export function PlusBadge() {
  return <span style={{ display: 'inline-block', font: '600 11px/1.2 var(--font-sans)', color: 'var(--plus-fg)', background: 'var(--plus-bg)', padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>Plus</span>;
}