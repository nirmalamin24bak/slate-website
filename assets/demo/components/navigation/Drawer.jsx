import React from 'react';
import { PlusBadge } from '../buttons/PlusBadge.jsx';
/** Left drawer menu over the journal: bg panel (≤320pt), hairline right edge, 16% ink scrim, 52pt rows. */
export function Drawer({ open, onClose, onSelect, items = [] }) {
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: open ? 'auto' : 'none', zIndex: 20 }}>
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--scrim)', opacity: open ? 1 : 0, transition: 'opacity 320ms' }} />
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 'min(320px, 84%)', background: 'var(--slate-bg)', borderRight: '1px solid var(--border-hairline)', boxShadow: 'var(--shadow-drawer)', transform: open ? 'none' : 'translateX(calc(-100% - 32px))', transition: 'transform 320ms var(--ease-snappy)', display: 'flex', flexDirection: 'column', padding: '64px 0 24px', boxSizing: 'border-box' }}>
      {items.map((it, i) => it === '-' ? <div key={i} style={{ height: 1, background: 'var(--border-hairline)', margin: '10px 20px' }} /> :
        <div key={i} onClick={() => onSelect && onSelect(it.title)} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '0 20px', cursor: 'pointer', font: '400 17px/1.3 var(--font-sans)', color: 'var(--slate-ink)' }}>{it.title}{it.plus && <PlusBadge />}</div>)}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '0 20px', minHeight: 48, display: 'flex', alignItems: 'center', font: '400 15px/1 var(--font-sans)', color: 'var(--slate-ink-mute)' }}>Share Slate with friends</div>
    </div>
  </div>;
}