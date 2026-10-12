import React from 'react';
import { BudgetBar } from './BudgetBar.jsx';
import { MacroBar } from './MacroBar.jsx';
/** The day's totals band: "1,075 cals" + "925 left", budget bar 12pt below, macro bar 16pt below that. */
export function TotalsBand({ total, goal, macros, showMacros = true, onClick }) {
  const f = (n) => n.toLocaleString('en-IN');
  const left = goal != null ? goal - total : null;
  return <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ font: '700 32px/1 var(--font-sans)', color: 'var(--slate-ink)' }}>{f(total)}</span>
        <span style={{ font: '400 15px/1 var(--font-sans)', color: 'var(--slate-ink-mute)' }}>cals</span>
      </div>
      {left != null && <span style={{ font: '600 17px/1 var(--font-sans)', color: 'var(--slate-ink-mute)' }}>{left >= 0 ? f(left) + ' left' : f(-left) + ' over'}</span>}
    </div>
    {goal != null && <div style={{ marginTop: 12 }}><BudgetBar fill={total / goal} /></div>}
    {showMacros && macros && <div style={{ marginTop: 16 }}><MacroBar {...macros} /></div>}
  </div>;
}