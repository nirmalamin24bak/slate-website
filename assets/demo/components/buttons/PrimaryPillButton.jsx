import React from 'react';
/** Full-width ink pill for "Next", "Continue", "Done". 50pt tall, SemiBold 17. */
export function PrimaryPillButton({ children, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ width: '100%', height: 50, border: 0, borderRadius: 999, background: 'var(--slate-ink)', color: 'var(--slate-surface)', font: '600 17px/1 var(--font-sans)', cursor: 'pointer', opacity: disabled ? 0.4 : 1 }}>{children}</button>;
}