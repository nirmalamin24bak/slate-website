import React from 'react';
/** Right-aligned calorie figure, Regular 18. Exercise reads muted. animatesIn = fade + 4px rise. */
export function CalorieLabel({ value, exercise, animatesIn }) {
  return <span style={{ font: '400 18px/1.3 var(--font-sans)', color: exercise ? 'var(--slate-ink-mute)' : 'var(--slate-ink)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', animation: animatesIn ? 'slate-reveal 380ms ease-out both' : 'none' }}>{value}</span>;
}