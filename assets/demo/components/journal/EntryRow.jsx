import React from 'react';
import { CalorieLabel } from './CalorieLabel.jsx';
import { ResolveShimmer } from './ResolveShimmer.jsx';
/** One journal line: text left, figure right, hairline below (becomes shimmer while resolving).
 *  status: resolved | noted | unrecognized | resolving | draft */
export function EntryRow({ text, value, status = 'resolved', exercise, source, portion, placeholder, onTap, onChange, editable, animatesIn }) {
  const mark = (c) => <span style={{ font: '400 14px/1 var(--font-sans)', color: 'var(--slate-ink-mute)', minWidth: 32, textAlign: 'right' }}>{c}</span>;
  return <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 16, padding: '16px 0', minHeight: 56, boxSizing: 'border-box', borderBottom: status === 'resolving' ? 0 : '1px solid var(--border-hairline)' }}>
    {editable
      ? <input value={text} placeholder={placeholder} onChange={e => onChange && onChange(e.target.value)} style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', padding: 0, font: '400 18px/1.3 var(--font-sans)', color: exercise ? 'var(--slate-ink-mute)' : 'var(--slate-ink)', caretColor: 'var(--slate-ink)' }} />
      : <span style={{ flex: 1, minWidth: 0, font: '400 18px/1.3 var(--font-sans)', color: text ? (exercise ? 'var(--slate-ink-mute)' : 'var(--slate-ink)') : 'var(--slate-ink-mute)' }}>{text || placeholder}</span>}
    {portion && <span style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--slate-ink-mute)' }}>× {portion}</span>}
    {source && <span style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--slate-ink-mute)', whiteSpace: 'nowrap' }}>{source}</span>}
    <span onClick={onTap} style={{ cursor: onTap ? 'pointer' : 'default' }}>
      {status === 'resolved' && <CalorieLabel value={value} exercise={exercise} animatesIn={animatesIn} />}
      {status === 'noted' && mark('✓')}
      {status === 'unrecognized' && mark('↻')}
    </span>
    {status === 'resolving' && <><div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'var(--border-hairline)' }} /><ResolveShimmer /></>}
  </div>;
}