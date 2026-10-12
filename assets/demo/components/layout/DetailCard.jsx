import React from 'react';
/** The single centred card of a detail screen: surface, 16pt radius, 20pt padding, hairline border. */
export function DetailCard({ children, radius = 16, padding = 20 }) {
  return <div style={{ background: 'var(--slate-surface)', border: '1px solid var(--border-hairline)', borderRadius: radius, padding, boxSizing: 'border-box' }}>{children}</div>;
}