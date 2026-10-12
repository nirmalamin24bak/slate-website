// Detail screens pushed from Body & goals and Settings.
// Sources: InfoGoalsView.swift (Calorie goal, Macro goals, Saved foods, About you), OnboardingBodyScreen.swift (Your body),
// HealthView.swift (Apple Health), SettingsView.swift (Notifications, Account, Export), WidgetsHowToView.swift (Widgets).

const dmute = 'var(--slate-ink-mute)';
const F = (w, s) => `${w} ${s}px/1.3 var(--font-sans)`;
const HL = () => <div style={{ height: 1, background: 'var(--border-hairline)' }} />;

function Toggle({ on, onChange }) {
  return <button onClick={() => onChange(!on)} style={{ width: 51, height: 31, flex: 'none', borderRadius: 16, border: 0, padding: 2, cursor: 'pointer', background: on ? '#34C759' : 'var(--slate-fill)', display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', transition: 'background 200ms' }}><span style={{ width: 27, height: 27, borderRadius: 14, background: '#fff', boxShadow: '0 2px 4px rgb(0 0 0 / 0.15)' }} /></button>;
}
const ToggleRow = ({ title, on, onChange, size = 17 }) => <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56 }}><span style={{ flex: 1, font: F(400, size) }}>{title}</span><Toggle on={on} onChange={onChange} /></div>;
const ValueRow = ({ label, value, onClick }) => <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 52, cursor: onClick ? 'pointer' : 'default' }}><span style={{ font: F(400, 16) }}>{label}</span><span style={{ font: F(500, 16) }}>{value}</span></div>;

function CalorieGoalScreen({ onBack }) {
  const [g, setG] = React.useState('2000');
  const [focus, setFocus] = React.useState(false);
  const n = parseInt(g || '0');
  return <DetailScreen title="Calorie goal" onBack={onBack}>
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10 }}>
        <input value={focus || !n ? g : n.toLocaleString('en-IN')} inputMode="numeric" onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} onChange={e => setG(e.target.value.replace(/\D/g, '').slice(0, 5))} style={{ width: 190, border: 0, outline: 'none', background: 'transparent', textAlign: 'right', font: '700 64px/1 var(--font-sans)', letterSpacing: -1.5, color: 'var(--slate-ink)', padding: 0, fontVariantNumeric: 'tabular-nums' }} />
        <span style={{ font: F(400, 24), color: dmute }}>cals</span>
      </div>
      {n && n < 1200
        ? <span style={{ font: F(400, 15), color: dmute }}>Slate can't set a goal below 1,200 calories.</span>
        : <div style={{ display: 'grid', gap: 8 }}>
            <span style={{ font: F(400, 15), color: dmute }}>BMR 1,612 · Sedentary baseline 1,934</span>
            <span style={{ font: F(400, 13), color: dmute }}>Your baseline has moved from 1,943 to 1,880 since 12 Sep.</span>
            <span style={{ font: F(400, 13), color: dmute }}>Measured maintenance 2,180</span>
          </div>}
    </div>
  </DetailScreen>;
}

function MacroGoalsScreen({ onBack }) {
  const [v, setV] = React.useState({ Protein: '90', Carbs: '220', Fat: '60' });
  return <DetailScreen title="Macro goals" onBack={onBack}>
    {Object.keys(v).map((k, i) => <React.Fragment key={k}>{i > 0 && <HL />}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 56, gap: 6 }}>
        <span style={{ flex: 1, font: F(400, 17) }}>{k}</span>
        <input value={v[k]} inputMode="numeric" onChange={e => setV({ ...v, [k]: e.target.value.replace(/\D/g, '').slice(0, 3) })} style={{ width: 56, border: 0, outline: 'none', background: 'transparent', textAlign: 'right', font: F(500, 17), color: 'var(--slate-ink)', padding: 0 }} />
        <span style={{ font: F(400, 15), color: dmute }}>g</span>
      </div></React.Fragment>)}
  </DetailScreen>;
}

function YourBodyScreen({ onBack }) {
  const [units, setUnits] = React.useState(0), [sex, setSex] = React.useState(0);
  const field = (label, child) => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 52 }}><span style={{ font: F(400, 16) }}>{label}</span>{child}</div>;
  const num = (val, suf) => <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><span style={{ font: F(500, 17) }}>{val}</span><span style={{ font: F(400, 15), color: dmute }}>{suf}</span></span>;
  return <DetailScreen title="Your body" onBack={onBack}>
    {field('Units', <PillSegmented width={170} options={['kg · cm', 'lb · ft-in']} selection={units} onChange={setUnits} />)}<HL />
    {field('Age', num('29', ''))}<HL />
    {field('Sex', <PillSegmented width={170} options={['Male', 'Female']} selection={sex} onChange={setSex} />)}<HL />
    {field('Height', units ? <span style={{ display: 'flex', gap: 10 }}>{num('5', 'ft')}{num('9', 'in')}</span> : num('175', 'cm'))}<HL />
    {field('Weight', num(units ? '162' : '73.5', units ? 'lb' : 'kg'))}
    <div style={{ height: 1, background: 'var(--border-hairline)', margin: '8px 0' }} />
    {field('BMR', <span style={{ font: F(500, 16) }}>1,612</span>)}
    {field('Sedentary baseline', <span style={{ font: F(500, 16) }}>1,934</span>)}
    <div style={{ font: F(400, 13), color: dmute, paddingTop: 4 }}>Weight 73.5 kg · from your weigh-ins</div>
  </DetailScreen>;
}

function SavedFoodsScreen({ onBack }) {
  const foods = [['Office lunch', 612, 'dal chawal, 1 roti, salad from canteen'], ['Protein shake', 190, '1 scoop whey with 300 ml toned milk'], ['Morning chai', 72, 'chai, kam cheeni']];
  return <DetailScreen title="Saved foods" onBack={onBack}>
    {foods.map(([n, c, o], i) => <React.Fragment key={n}>{i > 0 && <HL />}
      <div style={{ display: 'grid', gap: 2, padding: '12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: F(400, 17) }}><span>{n}</span><span style={{ color: dmute }}>{c} cals</span></div>
        <span style={{ font: F(400, 13), color: dmute }}>{o}</span>
      </div></React.Fragment>)}
  </DetailScreen>;
}

function AppleHealthScreen({ onBack }) {
  const [connected, setConnected] = React.useState(false);
  const [t, setT] = React.useState({ Steps: true, Weight: true, Workouts: true });
  return <DetailScreen title="Apple Health" onBack={onBack}>
    {!connected
      ? <div style={{ display: 'grid', gap: 18 }}><span style={{ font: F(400, 17) }}>Bring in steps, weight and workouts from Apple Health.</span><PrimaryPillButton onClick={() => setConnected(true)}>Connect</PrimaryPillButton></div>
      : Object.keys(t).map((k, i) => <React.Fragment key={k}>{i > 0 && <HL />}<ToggleRow title={k} on={t[k]} onChange={v => setT({ ...t, [k]: v })} /></React.Fragment>)}
  </DetailScreen>;
}

function AnswerChip({ title, on, onClick }) {
  return <button onClick={onClick} style={{ minHeight: 34, padding: '0 12px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', background: on ? 'var(--slate-ink)' : 'var(--slate-bg)', color: on ? 'var(--slate-surface)' : 'var(--slate-ink)', border: `1px solid ${on ? 'var(--slate-ink)' : 'var(--slate-hairline)'}`, font: F(on ? 500 : 400, 14) }}>{title}</button>;
}
function AboutYouScreen({ onBack }) {
  const [diet, setDiet] = React.useState('Vegetarian');
  const [multi, setMulti] = React.useState({ fast: ['Ekadashi'], out: ['Dabba or tiffin', 'Delivery'], eye: ['Protein'] });
  const [day, setDay] = React.useState('Mostly sitting');
  const [note, setNote] = React.useState('');
  const tog = (k, v) => setMulti(m => ({ ...m, [k]: m[k].includes(v) ? m[k].filter(x => x !== v) : [...m[k], v] }));
  const Q = ({ title, children }) => <div style={{ display: 'grid', gap: 12, padding: '4px 0 16px' }}><div style={{ font: F(600, 16) }}>{title}</div>{children}</div>;
  const grid = (opts, isOn, onTap) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{opts.map(o => <AnswerChip key={o} title={o} on={isOn(o)} onClick={() => onTap(o)} />)}</div>;
  const input = (ph, w) => <input placeholder={ph} style={{ width: w || '100%', border: 0, borderBottom: '1px solid var(--border-hairline)', outline: 'none', background: 'transparent', padding: '6px 0', font: F(400, 17), color: 'var(--slate-ink)' }} />;
  return <DetailScreen title="About you" subtitle="This helps Slate read your lines the way you mean them." onBack={onBack}>
    <Q title="Diet">{grid(['Vegetarian', 'Eggetarian', 'Non-vegetarian', 'Vegan', 'Jain'], o => diet === o, setDiet)}</Q><HL />
    <div style={{ height: 16 }} /><Q title="Foods you avoid">{input('Brinjal, paneer…')}</Q><HL />
    <div style={{ height: 16 }} /><Q title="Fasting days">{grid(['Monday', 'Tuesday', 'Thursday', 'Saturday', 'Ekadashi', 'Navratri', 'Paryushan', 'Ramadan'], o => multi.fast.includes(o), o => tog('fast', o))}</Q><HL />
    <div style={{ height: 16 }} /><Q title="Where you eat outside">{grid(['Office canteen', 'Dabba or tiffin', 'Restaurants', 'Delivery', 'Street food'], o => multi.out.includes(o), o => tog('out', o))}</Q><HL />
    <div style={{ height: 16 }} /><Q title="Your day">{grid(['Mostly sitting', 'Some walking', 'On my feet most of the day'], o => day === o, setDay)}</Q><HL />
    <div style={{ height: 16 }} /><Q title="Sleep"><div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>{input('7', 48)}<span style={{ font: F(400, 15), color: dmute }}>hrs</span></div></Q><HL />
    <div style={{ height: 16 }} /><Q title="What you'd like to keep an eye on">{grid(['Protein', 'Fiber', 'Sugar', 'Eating out', 'Late-night snacking'], o => multi.eye.includes(o), o => tog('eye', o))}</Q><HL />
    <div style={{ height: 16 }} /><Q title="How you cook">
      <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 280))} placeholder="We cook with less oil than most. I use a small katori." style={{ minHeight: 120, border: 0, outline: 'none', resize: 'none', background: 'var(--slate-fill)', borderRadius: 12, padding: 14, font: F(400, 17), color: 'var(--slate-ink)' }} />
      <span style={{ justifySelf: 'end', font: F(400, 13), color: dmute }}>{note.length} / 280</span>
    </Q>
  </DetailScreen>;
}

function NotificationsScreen({ onBack }) {
  const [w, setW] = React.useState(true), [h, setH] = React.useState(false);
  return <DetailScreen title="Notifications" subtitle="Quiet nudges at the times you pick. Nothing else." onBack={onBack}>
    <ToggleRow title="Remind me to write on Slate" on={w} onChange={setW} size={16} />
    {w && <ValueRow label="Time" value="8:30 pm" />}<HL />
    <ToggleRow title="Remind me to weigh in" on={h} onChange={setH} size={16} />
    {h && <ValueRow label="Time" value="7:00 am" />}
  </DetailScreen>;
}

function AccountScreen({ onBack }) {
  return <DetailScreen title="Account" onBack={onBack}>
    <ValueRow label="Plan" value="Free" /><HL /><ValueRow label="Renewal date" value="—" /><HL />
    <ValueRow label="Questions" value="support@writeonslate.com" />
    <div style={{ font: F(400, 14), color: dmute, paddingTop: 12 }}>Privacy policy · Terms · Support</div>
  </DetailScreen>;
}

function ExportScreen({ onBack }) {
  const [done, setDone] = React.useState(false);
  return <DetailScreen title="Export your data" subtitle="Two files, yours to keep. Everything in them is everything Slate has." onBack={onBack}>
    <div style={{ display: 'grid', gap: 18 }}>
      <span style={{ font: F(400, 16) }}>Your journal, body, kitchen and goals as one JSON and one CSV file.</span>
      <PrimaryPillButton onClick={() => setDone(true)}>{done ? 'Exported' : 'Export'}</PrimaryPillButton>
    </div>
  </DetailScreen>;
}

function WidgetsScreen({ onBack }) {
  const step = (n, t) => <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44 }}><span style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--slate-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: F(600, 13), flex: 'none' }}>{n}</span><span style={{ font: F(400, 17) }}>{t}</span></div>;
  return <DetailScreen title="Widgets" onBack={onBack}>
    <div style={{ display: 'flex', gap: 12, padding: '4px 0 18px' }}>
      <div style={{ flex: 1, height: 150, borderRadius: 22, background: 'var(--slate-bg)', border: '1px solid var(--border-hairline)', padding: 14, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <span style={{ font: F(400, 13), color: dmute }}>Today</span><span style={{ flex: 1 }} />
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}><span style={{ font: '700 34px/1 var(--font-sans)' }}>1,287</span><span style={{ font: F(400, 15), color: dmute }}>cals</span></span>
        <span style={{ font: F(400, 13), color: dmute }}>468 left</span>
      </div>
      <div style={{ width: 92, height: 150, borderRadius: 999, border: '1px solid rgb(17 18 20 / 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="coffee" size={20} /><span style={{ font: F(600, 14) }}>Chai</span></div>
    </div>
    {step(1, 'Touch and hold the home screen')}{step(2, 'Tap Edit, then Add Widget')}{step(3, 'Search for Slate')}
    <div style={{ font: F(400, 13), color: dmute, paddingTop: 10 }}>To change the quick-add item, touch and hold the widget, then tap Edit Widget.</div>
  </DetailScreen>;
}
