import React from 'react';
/** 2pt hairline across the top that fills in ink, 0…1. */
export function OnboardingProgress({ fraction = 0 }) {
  return <div style={{ height: 2, background: 'var(--border-hairline)' }}><div style={{ height: 2, width: (fraction * 100) + '%', background: 'var(--slate-ink)', transition: 'width 250ms' }} /></div>;
}