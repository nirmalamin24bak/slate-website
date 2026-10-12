// Shared router for the kit and the website demo: every screen and how they link.
// localStorage can throw (private windows, blocked storage); the demo then starts on the initial screen.
const readStored = (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } };
const writeStored = (key, value) => { try { localStorage.setItem(key, value); } catch (e) {} };
function useSlateKit(storageKey, initial = 'journal') {
  const [screen, setScreen] = React.useState(() => readStored(storageKey) || initial);
  const [dark, setDark] = React.useState(() => document.getElementById('root')?.getAttribute('data-theme') === 'dark');
  const go = (s) => { setScreen(s); writeStored(storageKey, s); };
  const open = (t) => go({ 'Appearance': 'appearance', 'Water': 'water', 'Your kitchen': 'kitchen', "What Slate won't do": 'promise', 'Body & goals': 'body', 'Custom dishes': 'dishes', 'Connected apps': 'connected', 'Slate': 'paywall', 'About you': 'aboutyou', 'Widgets': 'widgets', 'Notifications': 'notifications', 'Account': 'account', 'Export your data': 'export' }[t] || screen);
  const back = () => go('journal');
  const view = {
    onboarding: <Onboarding onDone={() => go('journal')} />,
    journal: <JournalScreen onNavigate={go} />,
    settings: <SettingsScreen onBack={() => go('journal')} onOpen={open} />,
    appearance: <AppearanceScreen onBack={() => go('settings')} dark={dark} setDark={setDark} />,
    water: <WaterScreen onBack={() => go('settings')} />,
    kitchen: <KitchenScreen onBack={() => go('settings')} />,
    promise: <PromiseScreen onBack={() => go('settings')} />,
    history: <HistoryScreen onBack={back} />,
    streak: <StreakScreen onBack={back} />,
    stats: <StatsScreen onBack={back} />,
    weight: <WeightScreen onBack={back} />,
    chat: <ChatScreen onBack={back} />,
    scan: <ScanScreen onClose={back} onPaywall={() => go('paywall')} />,
    paywall: <PaywallScreen onClose={back} />,
    body: <BodyGoalsScreen onBack={() => go('settings')} onOpen={go} />,
    dishes: <CustomDishesScreen onBack={() => go('settings')} />,
    connected: <ConnectedAppsScreen onBack={() => go('settings')} />,
    calgoal: <CalorieGoalScreen onBack={() => go('body')} />,
    macros: <MacroGoalsScreen onBack={() => go('body')} />,
    yourbody: <YourBodyScreen onBack={() => go('body')} />,
    saved: <SavedFoodsScreen onBack={() => go('body')} />,
    health: <AppleHealthScreen onBack={() => go('body')} />,
    aboutyou: <AboutYouScreen onBack={() => go('settings')} />,
    widgets: <WidgetsScreen onBack={() => go('settings')} />,
    notifications: <NotificationsScreen onBack={() => go('settings')} />,
    account: <AccountScreen onBack={() => go('settings')} />,
    export: <ExportScreen onBack={() => go('settings')} />
  }[screen];
  return { screen, go, view, dark, setDark };
}

function App({ label = 'iOS UI kit', storageKey = 'slate-kit-screen' }) {
  const { screen, go, view, dark, setDark } = useSlateKit(storageKey);
  const groups = [
    ['First run', [['onboarding', 'Onboarding']]],
    ['Journal', [['journal', 'Today'], ['scan', 'Scan'], ['chat', 'Chat']]],
    ['Your numbers', [['weight', 'Weight'], ['stats', 'Stats'], ['streak', 'Streak'], ['history', 'History']]],
    ['Settings', [['settings', 'Settings'], ['body', 'Body & goals'], ['kitchen', 'Your kitchen'], ['dishes', 'Custom dishes'], ['connected', 'Connected apps'], ['promise', "What Slate won't do"]]],
    ['Slate Plus', [['paywall', 'Paywall']]]
  ];
  // The demo-* classes only carry the narrow-screen layout in assets/pages.css; the inline styles are the design.
  return <div className="demo-app" style={{ display: 'flex', gap: 56, padding: 40, justifyContent: 'center', alignItems: 'flex-start' }}>
    <aside className="demo-aside" style={{ width: 232, flex: 'none', paddingTop: 12, display: 'grid', gap: 22 }}>
      <div className="demo-brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/assets/demo/assets/app-icon.png?v=2" alt="" width="28" height="28" style={{ width: 28, height: 28, borderRadius: 7 }} />
        <span style={{ font: '700 20px/1 var(--font-sans)', letterSpacing: -0.3 }}>Slate</span>
        <span style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--slate-ink-mute)' }}>{label}</span>
      </div>
      <nav className="demo-nav" aria-label="Demo screens" style={{ display: 'grid', gap: 16 }}>
        {groups.map(([g, items]) => <div key={g} className="demo-nav-group" style={{ display: 'grid', gap: 2 }}>
          <div className="demo-nav-label" style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--slate-ink-mute)', padding: '0 10px 6px' }}>{g}</div>
          {items.map(([k, l]) => { const on = screen === k; return <button key={k} className="demo-nav-button" aria-current={on ? 'true' : undefined} onClick={() => go(k)} style={{ display: 'flex', alignItems: 'center', height: 32, padding: '0 10px', border: 0, borderRadius: 8, cursor: 'pointer', textAlign: 'left', background: on ? 'var(--slate-ink)' : 'transparent', color: on ? 'var(--slate-bg)' : 'var(--slate-ink)', font: (on ? 600 : 400) + ' 15px/1 var(--font-sans)' }}>{l}</button>; })}
        </div>)}
      </nav>
      <div className="demo-appearance" style={{ display: 'grid', gap: 10, paddingTop: 18, borderTop: '1px solid var(--slate-hairline)' }}>
        <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--slate-ink-mute)', padding: '0 10px' }}>Appearance</div>
        <PillSegmented width={232} options={['Light', 'Dark']} selection={dark ? 1 : 0} onChange={i => setDark(i === 1)} />
        <div style={{ font: '400 12px/1.5 var(--font-sans)', color: 'var(--slate-ink-mute)', padding: '4px 10px 0' }}>On Today: type a line and press return. Tap a number for How we got this, the totals for the summary sheet, water to add a glass, the title for the day strip, ≡ for the drawer.</div>
      </div>
    </aside>
    <div className="demo-phone-fit"><Phone dark={dark}>{view}</Phone></div>
  </div>;
}