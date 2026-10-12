function JournalScreen({ onNavigate }) {
  const [detail, setDetail] = React.useState(null);
  const [summary, setSummary] = React.useState(false);
  const [lines, setLines] = React.useState(() => SEED.map((l, i) => ({ ...l, id: i })));
  const [draft, setDraft] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [drawer, setDrawer] = React.useState(false);
  const [strip, setStrip] = React.useState(false);
  const [water, setWater] = React.useState(1500);
  const [fresh, setFresh] = React.useState(null);
  const goal = 2000;
  const eaten = lines.filter(l => l.status === 'resolved').reduce((a, l) => a + l.value, 0);
  const mac = lines.reduce((a, l) => l.macros ? a.map((v, i) => v + l.macros[i]) : a, [0, 0, 0]).map(Math.round);
  const commit = (text) => {
    if (!text.trim()) return;
    const id = Date.now();
    setLines(ls => [...ls, { id, text, status: 'resolving' }]);
    setDraft('');
    setTimeout(() => { setLines(ls => ls.map(l => l.id === id ? { ...l, ...resolveLine(text) } : l)); setFresh(id); }, 900);
  };
  const remove = (id) => setLines(ls => ls.filter(l => l.id !== id));
  const days = ['Fri 2', 'Sat 3', 'Sun 4', 'Mon 5', 'Tue 6', 'Wed 7'];
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
    <div style={{ paddingTop: 12, background: 'var(--slate-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px 0' }}>
        <IconButton icon="menu" label="Menu" onClick={() => setDrawer(true)} />
        <IconButton icon="scan" size={22} label="Scan" onClick={() => onNavigate('scan')} />
      </div>
      <div onClick={() => setStrip(s => !s)} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '10px 24px 0', cursor: 'pointer' }}>
        <span style={{ font: '700 44px/1.05 var(--font-sans)', letterSpacing: -0.8 }}>Today</span>
        <Icon name="chevron-down" size={15} color="var(--slate-ink-mute)" style={{ transform: strip ? 'rotate(180deg)' : 'none', transition: 'transform 250ms' }} />
      </div>
      {strip && <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 24px', scrollbarWidth: 'none' }}><Chip>View all history</Chip>{days.map(d => <Chip key={d}>{d}</Chip>)}<Chip selected>Today</Chip></div>}
      <div style={{ padding: '18px 24px 0' }}><TotalsBand total={eaten} goal={goal} macros={{ protein: [mac[0], 90], carbs: [mac[1], 220], fat: [mac[2], 60] }} onClick={() => setSummary(true)} /></div>
      <div style={{ padding: '16px 24px 16px' }}><WaterRow ml={water} goal={2500} onClick={() => setWater(w => w + 250)} /></div>
      <Divider />
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px', scrollbarWidth: 'none' }}>
      {lines.map(l => <div key={l.id} onDoubleClick={() => remove(l.id)}><EntryRow {...l} animatesIn={l.id === fresh} onTap={l.status === 'resolved' && !l.exercise ? () => setDetail(l) : undefined} /></div>)}
      <div style={{ borderBottom: '1px solid var(--border-hairline)' }}>
        <input value={draft} onFocus={() => setFocused(true)} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') commit(draft); }} placeholder={lines.length ? '' : 'What did you have?'} style={{ width: '100%', height: 56, border: 0, outline: 'none', background: 'transparent', font: '400 18px/1 var(--font-sans)', color: 'var(--slate-ink)', padding: 0, caretColor: 'var(--slate-ink)' }} />
      </div>
      {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 56, borderBottom: '1px solid var(--border-hairline)' }} />)}
      <div style={{ height: 96 }} />
    </div>
    {focused && <div style={{ paddingBottom: 26, background: 'var(--slate-bg)' }}><KeyboardBar suggestions={SUGGESTIONS} onSelect={s => commit(s)} onDone={() => setFocused(false)} /></div>}
    <Drawer open={drawer} onClose={() => setDrawer(false)} onSelect={t => { setDrawer(false); const r = { Weight: 'weight', Scan: 'scan', Chat: 'chat', History: 'history', Streak: 'streak', Stats: 'stats', Settings: 'settings' }[t]; if (r) onNavigate(r); }} items={[{ title: 'Slate' }, { title: 'Weight' }, { title: 'Scan' }, { title: 'Chat', plus: true }, '-', { title: 'History' }, { title: 'Streak' }, { title: 'Stats', plus: true }, { title: 'Settings' }]} />
    <Sheet open={!!detail} onClose={() => setDetail(null)} height="78%">{detail && <EntryDetailBody key={detail.id} line={detail} />}</Sheet>
    <Sheet open={summary} onClose={() => setSummary(false)} height="52%" bg="var(--slate-bg)"><SummaryBody onSelect={r => { setSummary(false); onNavigate(r); }} /></Sheet>
  </div>;
}