// Screens pushed from the drawer, the summary sheet and Settings.
// Sources: ios-slate/Slate/Views/{EntryDetailSheet,SummarySheet,HistoryView,StreakView,StatsView,StatsCards,
// WeightView,ChatView,ScanScreen,PlusPaywallView,InfoGoalsView,CustomDishesView,ConnectedAppsView,KitchenView}.swift

const fmt = (n, d = 0) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const mute = 'var(--slate-ink-mute)';
const T = (w, s) => `${w} ${s}px/1.3 var(--font-sans)`;

function Sheet({ open, onClose, children, height = '62%', bg = 'var(--slate-surface)' }) {
  return <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: open ? 'auto' : 'none' }}>
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgb(0 0 0 / 0.2)', opacity: open ? 1 : 0, transition: 'opacity 300ms' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height, background: bg, borderRadius: '24px 24px 0 0', transform: open ? 'none' : 'translateY(100%)', transition: 'transform 340ms var(--ease-snappy)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ width: 36, height: 5, borderRadius: 3, background: 'var(--slate-hairline)', margin: '6px auto 0', flex: 'none' }} />
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>{children}</div>
    </div>
  </div>;
}

function Screen({ title, onBack, children, right, pad = true }) {
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <NavBar title={title} onBack={onBack} right={right} />
    <div style={{ flex: 1, overflowY: 'auto', padding: pad ? '0 24px 24px' : 0, scrollbarWidth: 'none' }}>{children}</div>
  </div>;
}

// ---------- Entry detail sheet ----------
function EntryDetailBody({ line }) {
  const [portion, setPortion] = React.useState(1);
  const [place, setPlace] = React.useState(/swiggy|zomato/i.test(line.text) ? 0 : 1);
  const m = (line.macros || [7, 40, 4]).map(v => Math.round(v * portion));
  const cals = Math.round((line.value || 0) * portion);
  const tot = m[0] * 4 + m[1] * 4 + m[2] * 9 || 1;
  const chip = (label, sel, on) => <button key={label} onClick={on} style={{ minHeight: 34, padding: '0 12px', border: 0, borderRadius: 999, cursor: 'pointer', background: sel ? 'var(--slate-ink)' : 'var(--slate-fill)', color: sel ? 'var(--slate-surface)' : 'var(--slate-ink)', font: T(500, 14) }}>{label}</button>;
  const items = /roti/.test(line.text) ? [['Whole wheat flour (atta)', `${60 * portion} g`], ['Your roti', '8 inches'], ['Ghee on top', 'none']]
    : /dal/.test(line.text) ? [['Toor dal', `${Math.round(45 * portion)} g`], ['Oil', `${fmt(4.2 * portion, 1)} g`], ['Your katori', '200 ml']]
    : [['Dish recipe', `${Math.round(180 * portion)} g`], ['Oil', `${fmt(6 * portion, 1)} g`]];
  return <div style={{ padding: '12px 24px 24px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flex: 1, font: T(600, 20) }}>{line.text}</div>
      <IconButton icon="ellipsis" label="More" />
    </div>
    <div style={{ display: 'flex', gap: 8, padding: '10px 0 4px' }}>{[0.5, 1, 1.5, 2].map(v => chip('× ' + ({ 0.5: '½', 1: '1', 1.5: '1½', 2: '2' })[v], portion === v, () => setPortion(v)))}</div>
    <div style={{ display: 'flex', gap: 8, paddingBottom: 6, paddingTop: 4 }}>{chip('Outside', place === 0, () => setPlace(0))}{chip('Made at home', place === 1, () => setPlace(1))}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, paddingTop: 14 }}><span style={{ font: '700 40px/1 var(--font-sans)' }}>{fmt(cals)}</span><span style={{ font: T(400, 18), color: mute }}>cals</span></div>
    <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: 'var(--bar-track)', marginTop: 22 }}>
      <div style={{ width: (m[0] * 4 / tot * 100) + '%', background: 'var(--slate-macro-protein)' }} /><div style={{ width: (m[1] * 4 / tot * 100) + '%', background: 'var(--slate-macro-carbs)' }} /><div style={{ flex: 1, background: 'var(--slate-macro-fat)' }} />
    </div>
    <div style={{ height: 1, background: 'var(--border-hairline)', marginTop: 22 }} />
    <div style={{ display: 'flex', paddingTop: 16 }}>{[['Protein', m[0]], ['Carbs', m[1]], ['Fat', m[2]]].map(([l, g]) => <div key={l} style={{ flex: 1, display: 'grid', gap: 4 }}><span style={{ font: T(400, 14), color: mute }}>{l}</span><span style={{ font: T(500, 22) }}>{g} g</span></div>)}</div>
    <div style={{ height: 1, background: 'var(--border-hairline)', marginTop: 22 }} />
    <div style={{ display: 'grid', gap: 18, paddingTop: 16 }}>
      <div style={{ font: T(600, 15) }}>How we got this</div>
      <div style={{ display: 'grid', gap: 10 }}>{items.map(([a, b]) => <div key={a} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, font: T(400, 14), color: mute }}><span>{a}</span><span>{b}</span></div>)}
        {place === 0 && <div style={{ font: T(400, 14), color: mute }}>Restaurant-style oil</div>}</div>
      <div style={{ font: T(400, 13), color: mute }}>Estimated from IFCT 2017 values</div>
    </div>
  </div>;
}

// ---------- Summary sheet ----------
function SummaryBody({ onSelect }) {
  const rows = [['Chat about your day', true, 'chat'], ['Body & goals', false, 'body'], ['Your kitchen', false, 'kitchen'], ['Custom dishes', true, 'dishes'], ['Customize display', false, null], ['What you can write', false, null]];
  return <div style={{ padding: '4px 24px 24px' }}>{rows.map(([t, p, r], i) => <React.Fragment key={t}>{i > 0 && <Divider />}<SettingsRow title={t} plus={p} chevron onClick={() => r && onSelect(r)} /></React.Fragment>)}</div>;
}

// ---------- History ----------
function HistoryScreen({ onBack }) {
  const days = [['Sat 10 Oct', 1842], ['Fri 9 Oct', 2016], ['Thu 8 Oct', 1734], ['Wed 7 Oct', 1958], ['Tue 6 Oct', 1611], ['Mon 5 Oct', 2104], ['Sun 4 Oct', 2290], ['Sat 3 Oct', 1877]];
  return <Screen title="History" onBack={onBack}>
    {days.map(([d, c], i) => <React.Fragment key={d}>{i > 0 && <Divider />}<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, font: T(400, 17) }}><span>{d}</span><span style={{ color: mute }}>{fmt(c)} cals</span></div></React.Fragment>)}
    <div style={{ height: 1, background: 'var(--border-hairline)', margin: '10px 0' }} />
    <div style={{ minHeight: 56, display: 'flex', alignItems: 'center', font: T(400, 15), color: mute }}>Slate Plus keeps your full history.</div>
  </Screen>;
}

// ---------- Streak ----------
function StreakScreen({ onBack }) {
  const logged = (w, d) => !(w === 1 && d === 3) && !(w === 2 && d > 4) && !(w === 0 && d < 2) && !(w === 7 && d > 5);
  return <Screen title="Streak" onBack={onBack}>
    <div style={{ display: 'grid', justifyItems: 'center', gap: 2, paddingTop: 28 }}>
      <span style={{ font: '700 96px/1 var(--font-sans)', letterSpacing: -2 }}>23</span>
      <span style={{ font: T(400, 20), color: mute }}>days</span>
    </div>
    <div style={{ marginTop: 20, borderTop: '1px solid var(--border-hairline)', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: T(400, 15), color: mute }}><span>Longest</span><span>Longest 34 days</span></div>
    <div style={{ display: 'grid', gap: 10, justifyContent: 'center', paddingTop: 20 }}>
      {Array.from({ length: 8 }).map((_, w) => <div key={w} style={{ display: 'flex', gap: 12 }}>{Array.from({ length: 7 }).map((_, d) => {
        const today = w === 7 && d === 5; const on = logged(w, d) && !today;
        return <span key={d} style={{ width: 10, height: 10, borderRadius: 5, boxSizing: 'border-box', background: on ? 'var(--slate-ink)' : 'transparent', border: on ? 0 : `1px solid ${today ? 'var(--slate-ink)' : 'var(--slate-hairline)'}` }} />;
      })}</div>)}
    </div>
  </Screen>;
}

// ---------- Stats (StatsView.swift + StatsCards.swift + StatsSlotChart.swift) ----------
function StatCard({ children }) {
  return <div style={{ padding: 20, background: 'var(--slate-surface)', borderRadius: 26, border: '1px solid color-mix(in srgb, var(--slate-hairline) 70%, transparent)', boxShadow: '0 4px 16px rgb(17 18 20 / 0.04)', display: 'grid', gap: 16 }}>{children}</div>;
}
const CardLabel = ({ children }) => <span style={{ font: T(400, 12), color: mute }}>{children}</span>;
const Big = ({ v, u }) => <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}><span style={{ font: '700 28px/1 var(--font-sans)' }}>{v}</span><span style={{ font: T(400, 12), color: mute }}>{u}</span></div>;
// Every slot: full-height fill track, value bar on top, 60% of slot, radius 4. Goal = dashed inkMute rule. Tap a bar for its value.
function SlotChart({ values, height, color = 'var(--slate-ink)', goal, labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], fmtV = v => fmt(v) }) {
  const [sel, setSel] = React.useState(null);
  const yMax = Math.max(...values.filter(v => v != null), goal || 0) * 1.1;
  const plotH = height - 14;
  return <div style={{ position: 'relative', height }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: plotH, display: 'flex' }}>
      {values.map((v, i) => <div key={i} onClick={() => setSel(sel === i ? null : i)} style={{ flex: 1, display: 'flex', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
        <div style={{ width: '60%', height: '100%', borderRadius: 4, background: 'var(--slate-fill)', position: 'relative', overflow: 'hidden', opacity: v === undefined ? 0.5 : 1 }}>
          {v != null && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: v / yMax * 100 + '%', borderRadius: 4, background: color }} />}
        </div>
        {sel === i && v != null && <span style={{ position: 'absolute', top: Math.max(plotH - v / yMax * plotH - 18, -4), font: T(400, 12), color: 'var(--slate-ink)', whiteSpace: 'nowrap', background: 'var(--slate-surface)', padding: '0 2px' }}>{fmtV(v)}</span>}
      </div>)}
    </div>
    {goal && <div style={{ position: 'absolute', left: 0, right: 0, top: plotH - goal / yMax * plotH, zIndex: 1, pointerEvents: 'none', borderTop: '1px dashed var(--slate-ink-mute)' }} />}
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex' }}>{labels.map((l, i) => <span key={i} style={{ flex: 1, textAlign: 'center', font: T(400, 12), color: mute, lineHeight: '14px' }}>{l}</span>)}</div>
  </div>;
}
function StatsScreen({ onBack }) {
  const [p, setP] = React.useState(0);
  const sumCol = (l, v, u) => <div style={{ flex: 1, display: 'grid', gap: 6 }}><span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><span style={{ font: '500 22px/1.1 var(--font-sans)' }}>{v}</span>{u && <span style={{ font: T(400, 13), color: mute }}>{u}</span>}</span><span style={{ font: T(400, 13), color: mute }}>{l}</span></div>;
  const measure = (l, v, pad) => <div style={{ flex: 1, display: 'grid', gap: 4, paddingLeft: pad }}><span style={{ font: T(400, 14), color: mute }}>{l}</span><span style={{ font: '500 22px/1.1 var(--font-sans)' }}>{v}</span></div>;
  const range = (l, v) => <div style={{ flex: 1, display: 'grid', gap: 2 }}><span style={{ font: T(400, 13), color: mute }}>{l}</span><span style={{ font: T(500, 15) }}>{v}</span></div>;
  const m = [62, 214, 58], tot = m[0] * 4 + m[1] * 4 + m[2] * 9;
  const pts = Array.from({ length: 12 }, (_, i) => 74.4 - i * 0.075 + Math.sin(i * 1.9) * 0.3);
  const W = 314, H = 160, lo = 73, hi = 75, x = i => 6 + i / 11 * (W - 12), y = v => H - 8 - (v - lo) / (hi - lo) * (H - 16);
  const mw = [2240, 2205, 2190, 2210, 2180, 2185, 2170, 2180], mx = i => i / 7 * W, my = v => 58 - (v - 2150) / 110 * 52;
  return <Screen title="Stats" onBack={onBack}>
    <div style={{ display: 'grid', gap: 12, paddingTop: 8 }}>
      <div style={{ display: 'flex', gap: 24 }}>{['Week', 'Month', '3 months', 'Year'].map((t, i) => <button key={t} onClick={() => setP(i)} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', font: T(i === p ? 600 : 400, 15), color: i === p ? 'var(--slate-ink)' : mute }}>{t}</button>)}</div>
      <StatCard><CardLabel>Summary</CardLabel><div style={{ display: 'flex' }}>{sumCol('Food a day', '1,862', 'cals')}{sumCol('Days logged', '6 of 7')}{sumCol('Net a day', '1,604', 'cals')}</div></StatCard>
      <StatCard><CardLabel>Calories</CardLabel><Big v="1,862" u="cals a day" />
        <div style={{ display: 'grid', gap: 6 }}><span style={{ justifySelf: 'end', font: T(400, 12), color: mute }}>Goal 2,000</span><SlotChart values={[1842, 2016, 1734, 1958, 1611, 2104, 1075]} height={160} goal={2000} /></div></StatCard>
      <StatCard><CardLabel>Macros</CardLabel>
        <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: 'var(--bar-track)' }}><div style={{ width: m[0] * 4 / tot * 100 + '%', background: 'var(--slate-macro-protein)' }} /><div style={{ width: m[1] * 4 / tot * 100 + '%', background: 'var(--slate-macro-carbs)' }} /><div style={{ flex: 1, background: 'var(--slate-macro-fat)' }} /></div>
        <div style={{ display: 'flex' }}>{measure('Protein', '62 g', 0)}{measure('Carbs', '214 g', 16)}{measure('Fat', '58 g', 16)}</div></StatCard>
      <StatCard>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}><CardLabel>Weight</CardLabel>
          <div style={{ display: 'grid', gap: 2, justifyItems: 'end' }}><span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}><span style={{ font: '500 20px/1 var(--font-sans)' }}>73.5</span><span style={{ font: T(400, 14), color: mute }}>kg trend</span></span><span style={{ font: T(400, 12), color: mute }}>Latest 73.6 kg · 11 Oct</span></div></div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>{pts.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="var(--slate-ink-mute)" />)}<polyline points={pts.map((_, i) => `${x(i)},${y(74.4 - i * 0.075)}`).join(' ')} fill="none" stroke="var(--slate-ink)" strokeWidth="2" strokeLinecap="round" /></svg>
        <div style={{ display: 'flex' }}>{range('Start', '74.4 kg')}{range('Now', '73.5 kg')}{range('Change', '−0.9 kg')}</div></StatCard>
      <StatCard><CardLabel>Water</CardLabel><div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><div style={{ flex: 1 }}><Big v="2.0" u="L a day" /></div><div style={{ flex: 1 }}><SlotChart values={[2250, 2500, 1750, 2000, 2750, 1500, 1500]} height={64} color="var(--slate-water)" /></div></div></StatCard>
      <StatCard><CardLabel>Movement</CardLabel><div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, display: 'grid', gap: 4 }}><Big v="8,214" u="steps a day" /><span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}><span style={{ font: T(500, 15) }}>1,140</span><span style={{ font: T(400, 12), color: mute }}>burned in workouts</span></span></div>
        <div style={{ flex: 1 }}><SlotChart values={[9412, 7100, 10230, 6400, 8800, 5200, 9412]} height={64} /></div></div></StatCard>
      <StatCard>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><CardLabel>Maintenance</CardLabel><span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}><span style={{ font: '500 20px/1 var(--font-sans)' }}>2,180</span><span style={{ font: T(400, 14), color: mute }}>cals</span></span></div>
        <svg width="100%" height="64" viewBox={`0 0 ${W} 64`} preserveAspectRatio="none" style={{ display: 'block' }}><polyline points={mw.map((v, i) => `${mx(i)},${my(v)}`).join(' ')} fill="none" stroke="var(--slate-ink)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
        <span style={{ font: T(400, 13), color: mute }}>Based on what you've logged and your weight trend.</span></StatCard>
    </div>
  </Screen>;
}

// ---------- Weight ----------
function WeightChart() {
  const pts = Array.from({ length: 30 }, (_, i) => 74.4 - i * 0.032 + Math.sin(i * 1.7) * 0.32 + Math.cos(i * 0.9) * 0.18);
  const lo = 72.8, hi = 75, W = 354, H = 160, x = i => i / 29 * W, y = v => H - (v - lo) / (hi - lo) * H;
  const trend = pts.map((_, i) => 74.4 - i * 0.032);
  return <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
    {pts.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="var(--slate-ink-mute)" />)}
    <polyline points={trend.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke="var(--slate-ink)" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}
function WeightScreen({ onBack }) {
  const [r, setR] = React.useState(0);
  const stat = (l, v) => <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, borderBottom: '1px solid var(--border-hairline)', font: T(400, 15) }}><span style={{ color: mute }}>{l}</span><span>{v}</span></div>;
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <NavBar title="Weight" onBack={onBack} />
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 24px', scrollbarWidth: 'none' }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}><span style={{ font: '700 56px/1 var(--font-sans)' }}>73.5</span><span style={{ font: T(400, 17), color: mute }}>kg</span></div>
        <span style={{ font: T(400, 13), color: mute }}>Latest 73.6 kg · 11 Oct</span>
      </div>
      <div style={{ display: 'flex', paddingTop: 20 }}>{['1M', '3M', '6M', '1Y', 'All'].map((t, i) => <button key={t} onClick={() => setR(i)} style={{ flex: 1, border: 0, background: 'none', padding: 0, cursor: 'pointer', display: 'grid', gap: 6 }}>
        <span style={{ font: T(i === r ? 600 : 400, 15), color: i === r ? 'var(--slate-ink)' : mute }}>{t}</span><span style={{ height: 2, background: i === r ? 'var(--slate-ink)' : 'transparent' }} /></button>)}</div>
      <div style={{ paddingTop: 20 }}><WeightChart /></div>
      <div style={{ paddingTop: 20 }}>{stat('Change', '−0.9 kg')}{stat('Weigh-ins', '30')}{stat('Lowest', '72.9 kg')}</div>
      <div style={{ font: T(400, 13), color: mute, paddingTop: 12 }}>One salty dinner isn't a change. The trend line shows what is.</div>
    </div>
    <div style={{ padding: '10px 24px 30px' }}><PrimaryPillButton>Log weight</PrimaryPillButton></div>
  </div>;
}

// ---------- Chat ----------
function ChatScreen({ onBack }) {
  const [msgs, setMsgs] = React.useState([{ u: true, t: 'Where did most of my calories come from today?' }, { u: false, t: 'The masala dosa from Swiggy, at 294. The two rotis and dal together come to 341.' }]);
  const [v, setV] = React.useState(''); const [wait, setWait] = React.useState(false);
  const send = (t) => { if (!t.trim()) return; setMsgs(m => [...m, { u: true, t }]); setV(''); setWait(true); setTimeout(() => { setWait(false); setMsgs(m => [...m, { u: false, t: 'You have 925 left against the goal you set. Protein is at 34 of 90 g.' }]); }, 1200); };
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <NavBar title="Chat" onBack={onBack} />
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 12px', display: 'flex', flexDirection: 'column', gap: 18, scrollbarWidth: 'none' }}>
      <span style={{ font: T(400, 13), color: mute }}>Today</span>
      {msgs.map((m, i) => m.u
        ? <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', paddingLeft: 64 }}><span style={{ font: T(400, 17), background: 'var(--slate-fill)', padding: '9px 14px', borderRadius: 22 }}>{m.t}</span></div>
        : <div key={i} style={{ font: T(400, 17) }}>{m.t}</div>)}
      {wait && <div style={{ display: 'flex', gap: 5, padding: '6px 0' }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: mute, opacity: 0.4 + i * 0.25 }} />)}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['How much protein today?', 'What was my heaviest meal?'].map(s => <button key={s} onClick={() => send(s)} style={{ border: 0, cursor: 'pointer', minHeight: 36, padding: '0 14px', borderRadius: 12, background: 'var(--slate-surface)', font: T(400, 15), color: 'var(--slate-ink)' }}>{s}</button>)}</div>
      <span style={{ font: T(400, 13), color: mute }}>Chat sends today's lines to our AI provider to answer. It isn't used to train models.</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: '10px 24px 30px', borderTop: '1px solid var(--border-hairline)' }}>
      <input aria-label="Ask about your day" value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(v)} placeholder="Ask about your day" style={{ flex: 1, border: 0, outline: 'none', borderRadius: 20, background: 'var(--slate-fill)', padding: '9px 14px', font: T(400, 17), color: 'var(--slate-ink)' }} />
      <button onClick={() => send(v)} style={{ width: 32, height: 32, borderRadius: 16, border: 0, background: 'var(--slate-ink)', color: 'var(--slate-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 3 }}><Icon name="arrow-up" size={18} strokeWidth={2.2} /></button>
    </div>
  </div>;
}

// ---------- Scanner ----------
function ScanScreen({ onClose, onPaywall }) {
  const [tab, setTab] = React.useState(2);
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
    <div style={{ padding: '8px 16px 0' }}><IconButton icon="x" label="Close" onClick={onClose} /></div>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      {tab === 2 ? <div style={{ width: '100%', padding: 24, boxSizing: 'border-box', background: 'var(--slate-surface)', borderRadius: 26, border: '1px solid var(--border-hairline)', boxShadow: '0 4px 16px rgb(17 18 20 / 0.04)', display: 'grid', justifyItems: 'center', textAlign: 'center' }}>
        <PlusBadge />
        <div style={{ font: T(600, 17), paddingTop: 12 }}>Take a photo of your plate.</div>
        <div style={{ font: T(400, 15), color: mute, paddingTop: 6 }}>Slate spots each dish, you confirm the portions.</div>
        <div style={{ width: '100%', paddingTop: 20 }}><PrimaryPillButton onClick={onPaywall}>See Slate Plus</PrimaryPillButton></div>
      </div> : <div style={{ display: 'grid', justifyItems: 'center', gap: 16 }}>
        <div style={{ width: 260, height: tab === 0 ? 140 : 300, borderRadius: 20, border: '1.5px solid var(--slate-ink)', position: 'relative' }}>{tab === 0 && <div style={{ position: 'absolute', left: 20, right: 20, top: '50%', height: 1.5, background: 'var(--slate-accent)' }} />}</div>
        <span style={{ font: T(400, 15), color: mute }}>{tab === 0 ? 'Point at the barcode on the packet.' : 'Fit the nutrition label inside the frame.'}</span>
      </div>}
    </div>
    <div style={{ padding: '10px 16px 30px' }}><SegmentedControl options={['Barcode', 'Label', 'Photo']} selection={tab} onChange={setTab} /></div>
  </div>;
}

// ---------- Paywall ----------
function PaywallScreen({ onClose }) {
  const [plan, setPlan] = React.useState(1);
  const row = (i, title, sub, tag) => <button key={i} onClick={() => setPlan(i)} style={{ height: 64, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', boxSizing: 'border-box', borderRadius: 16, cursor: 'pointer', background: 'var(--slate-surface)', border: plan === i ? '1.5px solid var(--slate-ink)' : '1px solid var(--border-hairline)', textAlign: 'left', width: '100%' }}>
    <span style={{ flex: 1, display: 'grid', gap: 3 }}><span style={{ font: T(500, 16), color: 'var(--slate-ink)' }}>{title}</span><span style={{ font: T(400, 13), color: mute }}>{sub}</span></span>
    {tag && <span style={{ font: T(600, 12), color: 'var(--plus-fg)', background: 'var(--plus-bg)', padding: '3px 8px', borderRadius: 999 }}>{tag}</span>}
  </button>;
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px 30px', position: 'relative' }}>
    <div style={{ position: 'absolute', top: 6, left: 8 }}><IconButton icon="x" label="Close" onClick={onClose} /></div>
    <div style={{ font: '800 40px/1.08 var(--font-sans)', letterSpacing: -1, paddingTop: 58 }}>Slate is free forever.</div>
    <div style={{ font: T(400, 17), color: mute, paddingTop: 14 }}>Slate Plus adds photo and voice logging, delivery orders, chat, measured maintenance, stats, Apple Health, widgets, custom dishes, saved foods, fiber and sugar, sleep and full history.</div>
    <div style={{ display: 'grid', gap: 10, paddingTop: 24 }}>{row(0, 'Monthly ₹399', 'about ₹92 a week')}{row(1, 'Yearly ₹2,999', '7 days free, then about ₹58 a week', '−37%')}</div>
    <div style={{ paddingTop: 24 }}><PrimaryPillButton>{plan === 1 ? 'Start free trial' : 'Upgrade'}</PrimaryPillButton></div>
    <div style={{ textAlign: 'center', paddingTop: 12 }}><GreyLink onClick={onClose}>No thanks</GreyLink></div>
    <div style={{ textAlign: 'center', paddingTop: 12 }}><GreyLink>What Slate won't do</GreyLink></div>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 10, font: T(400, 13), color: mute }}><span>Restore purchases</span><span>·</span><span>Terms</span><span>·</span><span>Privacy policy</span></div>
  </div>;
}

// ---------- Body & goals hub ----------
function BodyGoalsScreen({ onBack, onOpen }) {
  const rows = [['Calorie goal'], ['Macro goals'], ['Your body'], ['Saved foods'], ['Apple Health', true]];
  return <Screen title="Body & goals" onBack={onBack}>
    <div style={{ paddingTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, minHeight: 56, paddingTop: 10 }}>
        <span style={{ flex: 1, font: T(400, 14), color: mute }}>Apple Health says 72.4 kg. Use it?</span>
        <span style={{ font: T(500, 15) }}>Use</span><span style={{ font: T(400, 15), color: mute }}>Not now</span>
      </div>
      {rows.map(([t, p]) => <React.Fragment key={t}><Divider /><SettingsRow title={t} plus={p} chevron onClick={() => onOpen({ 'Calorie goal': 'calgoal', 'Macro goals': 'macros', 'Your body': 'yourbody', 'Saved foods': 'saved', 'Apple Health': 'health' }[t])} /></React.Fragment>)}
    </div>
  </Screen>;
}

// ---------- Custom dishes ----------
function CustomDishesScreen({ onBack }) {
  const dishes = [["Mummy's dal", 168], ['Sunday rajma', 312], ['Methi thepla', 124]];
  return <Screen title="Custom dishes" onBack={onBack} right={<span style={{ font: T(500, 15), cursor: 'pointer' }}>New dish</span>}>
    {dishes.map(([n, c]) => <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, borderBottom: '1px solid var(--border-hairline)', font: T(400, 17) }}><span>{n}</span><span style={{ color: mute }}>{c} cals</span></div>)}
  </Screen>;
}

// ---------- Connected apps ----------
function ConnectedAppsScreen({ onBack }) {
  const [on, setOn] = React.useState(true);
  const apps = [['Apple Watch', 'Last read 2 hours ago'], ['Strava', 'Last read 2 hours ago'], ['Garmin Connect', 'Not seen yet'], ['Nike Run Club', 'Not seen yet']];
  const toggle = <button onClick={() => setOn(!on)} style={{ width: 51, height: 31, borderRadius: 16, border: 0, padding: 2, cursor: 'pointer', background: on ? '#34C759' : 'var(--slate-fill)', display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', transition: 'background 200ms' }}><span style={{ width: 27, height: 27, borderRadius: 14, background: '#fff', boxShadow: '0 2px 4px rgb(0 0 0 / 0.15)' }} /></button>;
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <NavBar onBack={onBack} />
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 24px', scrollbarWidth: 'none' }}>
      <div style={{ font: '800 40px/1.08 var(--font-sans)', letterSpacing: -1 }}>Connected apps</div>
      <div style={{ font: T(400, 15), color: mute, paddingTop: 8 }}>Slate reads from Apple Health, so anything that writes to Health works with Slate.</div>
      <div style={{ paddingTop: 20 }}><DetailCard padding={16}><div style={{ display: 'flex', alignItems: 'center' }}><div style={{ flex: 1, display: 'grid', gap: 2 }}><span style={{ font: T(600, 17) }}>Apple Health</span><span style={{ font: T(400, 13), color: mute }}>{on ? 'Connected' : 'Not connected'}</span></div>{toggle}</div></DetailCard></div>
      <div style={{ paddingTop: 12 }}><DetailCard padding={16}><div style={{ font: T(600, 17), paddingBottom: 4 }}>Works through Apple Health</div>
        {apps.map(([n, s], i) => <div key={n} style={{ display: 'grid', gap: 2, padding: '10px 0', borderTop: i ? '1px solid var(--border-hairline)' : 0 }}><span style={{ font: T(400, 17) }}>{n}</span><span style={{ font: T(400, 13), color: mute }}>{s}</span></div>)}</DetailCard></div>
    </div>
    <div style={{ padding: '10px 24px 30px' }}><PrimaryPillButton onClick={onBack}>Done</PrimaryPillButton></div>
  </div>;
}

// ---------- Your kitchen (KitchenView.swift, settings mode) ----------
function KitchenScreen({ onBack }) {
  const [k, setK] = React.useState(1), [r, setR] = React.useState(1), [days, setDays] = React.useState('30'), [ppl, setPpl] = React.useState('4');
  const [cs, setCs] = React.useState(1), [cm, setCm] = React.useState(1), [fs, setFs] = React.useState(1), [fm, setFm] = React.useState(1);
  const title = t => <div style={{ font: T(600, 16) }}>{t}</div>;
  const div = <div style={{ height: 1, background: 'var(--border-hairline)', margin: '12px 0' }} />;
  const opt = (sel, label, onClick, shape, h) => <button key={label} onClick={onClick} style={{ flex: 1, border: 0, background: 'none', padding: 0, cursor: 'pointer', display: 'grid', gap: 8, justifyItems: 'center' }}>
    <span style={{ height: h, display: 'flex', alignItems: 'flex-end' }}>{shape}</span>
    <span style={{ font: T(sel ? 500 : 400, 13), color: sel ? 'var(--slate-ink)' : mute, whiteSpace: 'nowrap' }}>{label}</span></button>;
  const bowl = (ml, sel) => { const w = ml * 0.22, h = ml * 0.136, s = sel ? 'var(--slate-ink)' : mute, sw = sel ? 1.8 : 1.2, rim = h * 0.24;
    return <svg width={w + 2} height={h + 2} viewBox={`-1 -1 ${w + 2} ${h + 2}`} fill="none" stroke={s} strokeWidth={sw}><ellipse cx={w / 2} cy={rim / 2} rx={w / 2} ry={rim / 2} /><path d={`M0 ${rim / 2}C${w * 0.04} ${h * 0.72} ${w * 0.28} ${h} ${w / 2} ${h}C${w * 0.72} ${h} ${w * 0.96} ${h * 0.72} ${w} ${rim / 2}`} /></svg>; };
  const roti = (inch, sel) => { const d = inch * 5.6; return <span style={{ width: d, height: d, borderRadius: '50%', boxSizing: 'border-box', border: `${sel ? 1.8 : 1.2}px solid ${sel ? 'var(--slate-ink)' : mute}` }} />; };
  const perPerson = (+days > 0 && +ppl > 0) ? `≈ ${fmt(1000 / +days / +ppl, 1)} ml per person a day` : '≈ ml per person a day';
  const bev = (name, sugar, setSugar, milk, setMilk, milkOpts) => <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span style={{ width: 56, font: T(500, 14), flex: 'none' }}>{name}</span>
    <div style={{ flex: 1, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 38, font: T(400, 12), color: mute, flex: 'none' }}>Sugar</span><div style={{ flex: 1 }}><PillSegmented width="100%" options={['0', '1 tsp', '2 tsp']} selection={sugar} onChange={setSugar} /></div></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 38, font: T(400, 12), color: mute, flex: 'none' }}>Milk</span><div style={{ flex: 1 }}><PillSegmented width="100%" options={milkOpts} selection={milk} onChange={setMilk} /></div></div>
    </div>
  </div>;
  return <DetailScreen title="Your kitchen" subtitle="Four questions. Every home-cooked number gets more accurate." onBack={onBack}>
    <div style={{ display: 'grid', gap: 10 }}>{title('Your katori')}<div style={{ display: 'flex', alignItems: 'flex-end' }}>{[['Small', 150], ['Standard', 200], ['Large', 250]].map(([l, ml], i) => opt(k === i, `${l} · ${ml} ml`, () => setK(i), bowl(ml, k === i), 36))}</div></div>
    {div}
    <div style={{ display: 'grid', gap: 10 }}>{title('Your roti')}<div style={{ display: 'flex', alignItems: 'flex-end' }}>{[['Small', 6], ['Medium', 8], ['Large', 10]].map(([l, n], i) => opt(r === i, `${l} · ${n}″`, () => setR(i), roti(n, r === i), 56))}</div></div>
    {div}
    <div style={{ display: 'grid', gap: 8 }}>{title('Your oil')}
      <div style={{ display: 'grid', gap: 6, font: T(400, 17) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>A 1L bottle lasts us about <InlineNumberField value={days} onChange={setDays} /> days,</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>cooking for <InlineNumberField value={ppl} onChange={setPpl} /> people.</div>
      </div>
      <div style={{ font: T(400, 14), color: mute }}>{perPerson}</div>
    </div>
    {div}
    <div style={{ display: 'grid', gap: 12 }}>{title('Chai & coffee')}{bev('Chai', cs, setCs, cm, setCm, ['None', 'Toned', 'Full-fat'])}{bev('Coffee', fs, setFs, fm, setFm, ['None', 'Toned', 'Full-fat', 'Filter'])}</div>
  </DetailScreen>;
}
