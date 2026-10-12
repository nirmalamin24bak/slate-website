function NavBar({ title, onBack, right }) {
  return <div style={{ height: 44, display: 'flex', alignItems: 'center', position: 'relative', padding: '0 8px' }}>
    <button onClick={onBack} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'var(--slate-ink)', display: 'flex', alignItems: 'center', width: 44, height: 44, justifyContent: 'center' }}><Icon name="chevron-left" size={24} strokeWidth={2} /></button>
    {title && <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', font: '600 17px/1 var(--font-sans)', pointerEvents: 'none' }}>{title}</div>}
    {right && <div style={{ marginLeft: 'auto', paddingRight: 16, position: 'relative' }}>{right}</div>}
  </div>;
}
function SettingsScreen({ onBack, onOpen }) {
  const rows = (list) => list.map((r, i) => <React.Fragment key={r[0]}>{i > 0 && <Divider />}<SettingsRow title={r[0]} plus={r[1]} chevron={r[2] !== false} onClick={() => onOpen(r[0])} /></React.Fragment>);
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <NavBar title="Settings" onBack={onBack} />
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 40px', scrollbarWidth: 'none' }}>
      <SectionHeader>You</SectionHeader>{rows([['Body & goals'], ['Your kitchen'], ['About you'], ['Water'], ['Custom dishes', true]])}
      <SectionHeader>App</SectionHeader>{rows([['Widgets'], ['Appearance'], ['Notifications'], ['Connected apps', true], ['Account'], ['Tell a friend', false, false], ['Send feedback', false, false]])}
      <SectionHeader>Your data</SectionHeader>{rows([['Export your data'], ['Clear chat history', false, false], ['Delete my data', false, false], ["What Slate won't do"]])}
      <div style={{ paddingTop: 28 }}><SettingsRow title="Slate" plus onClick={() => onOpen('Slate')} /></div>
      <div style={{ display: 'grid', gap: 12, padding: '12px 0 8px', font: '400 14px/1 var(--font-sans)', color: 'var(--slate-ink-mute)' }}><div style={{ display: 'flex', gap: 8 }}><span>Privacy policy</span><span>·</span><span>Terms</span></div><span>support@writeonslate.com</span></div>
    </div>
  </div>;
}
function DetailScreen({ title, subtitle, onBack, children }) {
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <NavBar onBack={onBack} />
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 24px' }}>
      <div style={{ font: '800 40px/1.08 var(--font-sans)', letterSpacing: -1 }}>{title}</div>
      {subtitle && <div style={{ font: '400 15px/1.35 var(--font-sans)', color: 'var(--slate-ink-mute)', paddingTop: 8 }}>{subtitle}</div>}
      <div style={{ paddingTop: 20 }}><DetailCard>{children}</DetailCard></div>
    </div>
    <div style={{ padding: '10px 24px 30px' }}><PrimaryPillButton onClick={onBack}>Done</PrimaryPillButton></div>
  </div>;
}
function AppearanceScreen({ onBack, dark, setDark }) {
  const [sel, setSel] = React.useState(dark ? 2 : 0);
  return <DetailScreen title="Appearance" onBack={onBack}><div style={{ display: 'flex', justifyContent: 'center' }}><PillSegmented options={['System', 'Light', 'Dark']} selection={sel} onChange={i => { setSel(i); setDark(i === 2); }} /></div></DetailScreen>;
}
function WaterScreen({ onBack }) {
  return <DetailScreen title="Water" subtitle="A glass is what you say it is. The header's water row counts toward the goal." onBack={onBack}>
    <SettingsRow title="Water goal" value="2,500 ml" /><Divider /><SettingsRow title="A glass" value="250 ml" />
  </DetailScreen>;
}
function PromiseScreen({ onBack }) {
  const p = ['Show you ads.', "Move anything that's free today behind Plus.", 'Sell or share your data.', 'Call you, coach you, or sell you a plan.'];
  return <DetailScreen title="What Slate won't do" onBack={onBack}>
    <div style={{ padding: '4px 0' }}>{p.map((t, i) => <React.Fragment key={t}>{i > 0 && <Divider />}<div style={{ font: '400 17px/1.35 var(--font-sans)', padding: '18px 0' }}>{t}</div></React.Fragment>)}</div>
    <div style={{ font: '400 13px/1.3 var(--font-sans)', color: 'var(--slate-ink-mute)', paddingTop: 20 }}>Nirmal and Nehal, Sonal Systems, Vadodara</div>
  </DetailScreen>;
}