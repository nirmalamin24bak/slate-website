import React from 'react';
import { Icon } from './Icon.jsx';
/** Plain 44×44 header icon: no circle, no ring, no shadow. Press scales 0.92. */
export function IconButton({ icon, size = 20, label, color = 'var(--text-body)', onClick }) {
  const [p, setP] = React.useState(false);
  return <button aria-label={label} onClick={onClick} onPointerDown={() => setP(true)} onPointerUp={() => setP(false)} onPointerLeave={() => setP(false)}
    style={{ width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', padding: 0, cursor: 'pointer', color, transform: p ? 'scale(0.92)' : 'none', transition: 'transform 180ms var(--ease-snappy)' }}>
    <Icon name={icon} size={size} />
  </button>;
}