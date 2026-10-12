import React from 'react';
/** Small grey section header (Settings): Regular 13, 24 top / 6 bottom. */
export function SectionHeader({ children }) { return <div style={{ font: '400 13px/1.2 var(--font-sans)', color: 'var(--slate-ink-mute)', padding: '24px 0 6px' }}>{children}</div>; }