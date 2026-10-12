import React from 'react';
/** White surface capsule with ink Medium 17 text — the onboarding illustration unit. */
export function OnboardingChip({ children }) {
  return <div style={{ display: 'inline-block', padding: '14px 22px', borderRadius: 999, background: 'var(--slate-surface)', border: '1px solid var(--border-hairline)', font: '500 17px/1.3 var(--font-sans)', color: 'var(--slate-ink)', textAlign: 'center' }}>{children}</div>;
}