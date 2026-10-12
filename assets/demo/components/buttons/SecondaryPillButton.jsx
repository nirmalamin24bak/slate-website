import React from 'react';
/** Full-width grey pill (e.g. "No thanks"): fill background, ink text. */
export function SecondaryPillButton({ children, onClick }) {
  return <button onClick={onClick} style={{ width: '100%', height: 50, border: 0, borderRadius: 999, background: 'var(--slate-fill)', color: 'var(--slate-ink)', font: '600 17px/1 var(--font-sans)', cursor: 'pointer' }}>{children}</button>;
}