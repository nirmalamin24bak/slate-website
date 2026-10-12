import React from 'react';
import { PlusBadge } from '../buttons/PlusBadge.jsx';
import { Icon } from '../buttons/Icon.jsx';
/** Plain 56pt row on canvas: Regular 17 ink title, optional Plus badge, optional chevron. No grouped-table chrome. */
export function SettingsRow({ title, plus, chevron, value, onClick }) {
  return <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, cursor: onClick ? 'pointer' : 'default' }}>
    <span style={{ font: '400 17px/1.3 var(--font-sans)', color: 'var(--slate-ink)' }}>{title}</span>
    {plus && <PlusBadge />}
    <span style={{ flex: 1 }} />
    {value && <span style={{ font: '500 17px/1 var(--font-sans)', color: 'var(--slate-ink)' }}>{value}</span>}
    {chevron && <Icon name="chevron-right" size={15} color="var(--slate-ink-mute)" />}
  </div>;
}