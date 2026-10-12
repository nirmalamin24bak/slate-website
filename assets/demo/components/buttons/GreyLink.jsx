import React from 'react';
/** Grey text link, Regular 15 inkMute. */
export function GreyLink({ children, onClick, size = 15 }) {
  return <button onClick={onClick} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', font: '400 ' + size + 'px/1.3 var(--font-sans)' }}>{children}</button>;
}