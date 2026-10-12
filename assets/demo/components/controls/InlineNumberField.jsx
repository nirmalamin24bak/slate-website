import React from 'react';
/** Editable number inside a sentence: centred Medium 17 digits over a short 35% ink rule. Max 3 digits. */
export function InlineNumberField({ value, onChange, width = 48 }) {
  return <input inputMode="numeric" value={value} onChange={e => onChange && onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
    style={{ width, height: 24, border: 0, borderBottom: '1px solid var(--inline-rule)', background: 'transparent', textAlign: 'center', font: '500 17px/1 var(--font-sans)', color: 'var(--slate-ink)', outline: 'none', padding: 0, fontVariantNumeric: 'tabular-nums' }} />;
}