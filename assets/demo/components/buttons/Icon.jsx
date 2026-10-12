import React from 'react';
/** Lucide glyph standing in for the app's SF Symbols. 1.5 stroke, round caps, 24 grid (DESIGN.md §6.9 web icon rule). Needs the lucide UMD global (loaded by _load.js). */
export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.5, style }) {
  const key = name.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
  const node = (window.lucide && window.lucide.icons && window.lucide.icons[key]) || [];
  const kids = Array.isArray(node[2]) ? node[2] : node;
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', display: 'block', ...style }}>
    {kids.map((c, i) => React.createElement(c[0], { key: i, ...c[1] }))}
  </svg>;
}