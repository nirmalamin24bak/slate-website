import React from 'react';
/** Faint accent sweep on a line's divider while it resolves. */
export function ResolveShimmer() {
  return <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 14, overflow: 'hidden', pointerEvents: 'none' }}>
    <div style={{ position: 'absolute', top: 0, bottom: 0, width: '55%', animation: 'slate-shimmer 900ms ease-in-out infinite', background: 'linear-gradient(90deg, transparent, var(--shimmer-wash), transparent)' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--shimmer-line), transparent)' }} />
    </div>
  </div>;
}