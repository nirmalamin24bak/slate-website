function Phone({ children, dark }) {
  return <div className="demo-phone" data-theme={dark ? 'dark' : 'light'} style={{ width: 402, height: 874, borderRadius: 56, background: 'var(--slate-bg)', color: 'var(--slate-ink)', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 10px #1b1c1f, 0 30px 60px rgb(0 0 0 / 0.18)', flex: 'none', fontFamily: 'var(--font-sans)' }}>
    <div style={{ height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px 0 48px', font: '600 17px/1 var(--font-sans)', position: 'relative', zIndex: 30 }}>
      <span>09:41</span><span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="signal" size={17} strokeWidth={2.4} /><Icon name="wifi" size={17} strokeWidth={2.4} /><Icon name="battery-full" size={22} strokeWidth={1.8} /></span>
    </div>
    <div style={{ position: 'absolute', top: 11, left: '50%', marginLeft: -62, width: 124, height: 36, borderRadius: 20, background: '#000', zIndex: 31 }} />
    <div style={{ position: 'absolute', top: 54, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    <div style={{ position: 'absolute', bottom: 8, left: '50%', marginLeft: -70, width: 140, height: 5, borderRadius: 3, background: 'var(--slate-ink)', zIndex: 31 }} />
  </div>;
}