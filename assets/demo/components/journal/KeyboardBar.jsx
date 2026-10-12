import React from 'react';
import { IconButton } from '../buttons/IconButton.jsx';
import { Chip } from '../controls/Chip.jsx';
/** 48pt row above the keyboard: camera, mic (Plus), suggestion chips, Done. */
export function KeyboardBar({ suggestions = [], showMic = true, listening, onSelect, onDone, onScan, onMic }) {
  return <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: 'var(--slate-bg)', borderTop: '1px solid var(--border-hairline)', boxSizing: 'border-box' }}>
    <IconButton icon="camera" label="Scan" onClick={onScan} />
    {showMic && <IconButton icon="mic" label="Voice" color={listening ? 'var(--slate-accent)' : 'var(--slate-ink)'} onClick={onMic} />}
    <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>{suggestions.map(s => <Chip key={s} height={36} onClick={() => onSelect && onSelect(s)}>{s}</Chip>)}</div>
    <button onClick={onDone} style={{ border: 0, background: 'none', minHeight: 44, padding: '0 8px', font: '500 17px/1 var(--font-sans)', color: 'var(--slate-ink)', cursor: 'pointer' }}>Done</button>
  </div>;
}