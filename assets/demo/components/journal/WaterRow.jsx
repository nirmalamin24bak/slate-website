import React from 'react';
import { BudgetBar } from './BudgetBar.jsx';
/** Water-blue bar toward the goal with "1,250 of 2,500 ml". Tap adds a glass. */
export function WaterRow({ ml = 0, goal = 2500, onClick }) {
  const f = (n) => n.toLocaleString('en-IN');
  return <div onClick={onClick} style={{ display: 'grid', gap: 6, cursor: onClick ? 'pointer' : 'default' }}>
    <BudgetBar fill={ml / goal} color="var(--slate-water)" minFill={4} />
    <span style={{ font: '400 13px/1.2 var(--font-sans)', color: 'var(--slate-ink-mute)' }}>{f(ml)} of {f(goal)} ml</span>
  </div>;
}