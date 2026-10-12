import React from 'react';
import { BudgetBar } from './BudgetBar.jsx';
/** Connected macro bar: three 4pt segments, 3pt gaps, widths = goal calories (P×4, C×4, F×9), labels below. */
export function MacroBar({ protein = [0, 0], carbs = [0, 0], fat = [0, 0] }) {
  const m = [['Protein', protein, 4, 'var(--slate-macro-protein)'], ['Carbs', carbs, 4, 'var(--slate-macro-carbs)'], ['Fat', fat, 9, 'var(--slate-macro-fat)']];
  const w = m.map(x => (x[1][1] || x[1][0]) * x[2]); const tot = w.reduce((a, b) => a + b, 0) || 1;
  const fl = w.map(v => Math.max(v / tot, 0.08));
  return <div style={{ display: 'grid', gap: 8 }}>
    <div style={{ display: 'flex', gap: 3 }}>{m.map((x, i) => <div key={x[0]} style={{ flex: fl[i] }}><BudgetBar fill={x[1][1] ? x[1][0] / x[1][1] : 1} color={x[3]} minFill={4} /></div>)}</div>
    <div style={{ display: 'flex' }}>{m.map(x => <div key={x[0]} style={{ flex: 1, display: 'grid', gap: 2 }}>
      <span style={{ font: '400 12px/1.2 var(--font-sans)', color: 'var(--slate-ink-mute)' }}>{x[0]}</span>
      <span style={{ font: '500 15px/1.2 var(--font-sans)', color: 'var(--slate-ink)' }}>{x[1][1] ? x[1][0] + ' / ' + x[1][1] + ' g' : x[1][0] + ' g'}</span>
    </div>)}</div>
  </div>;
}