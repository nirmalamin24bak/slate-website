import React from 'react';
/** 1pt hairline. */
export function Divider({ inset = 0 }) { return <div style={{ height: 1, background: 'var(--border-hairline)', marginLeft: inset }} />; }