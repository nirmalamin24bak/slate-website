function OnboardingPage({ progress, headline, subline, children, near, button = 'Next', secondary, link, onNext }) {
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px 30px' }}>
    {progress != null && <div style={{ paddingTop: 12 }}><OnboardingProgress fraction={progress} /></div>}
    <div style={{ font: '800 40px/1.08 var(--font-sans)', letterSpacing: -1, paddingTop: 24, textWrap: 'pretty' }}>{headline}</div>
    {subline && <div style={{ font: '400 17px/1.35 var(--font-sans)', color: 'var(--slate-ink-mute)', paddingTop: 14 }}>{subline}</div>}
    <div style={{ flex: 1, minHeight: 16 }} />
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{children}</div>
    {near && <div style={{ flex: 1, minHeight: 16 }} />}
    <div style={{ flex: 1, minHeight: 16 }} />
    {link && <div style={{ textAlign: 'center', paddingBottom: 8 }}><GreyLink>{link}</GreyLink></div>}
    {secondary && <div style={{ paddingBottom: 8 }}><SecondaryPillButton onClick={onNext}>{secondary}</SecondaryPillButton></div>}
    <PrimaryPillButton onClick={onNext}>{button}</PrimaryPillButton>
  </div>;
}
const Arrow = () => <Icon name="arrow-down" size={16} strokeWidth={1.2} color="var(--slate-ink-mute)" />;
function Bowl() { return <svg width="46" height="27" viewBox="0 0 46 27" fill="none" stroke="var(--slate-ink)" strokeWidth="1.5"><ellipse cx="23" cy="3.24" rx="23" ry="3.24" /><path d="M0 3.24C1.84 19.44 12.88 27 23 27C33.12 27 44.16 19.44 46 3.24" /></svg>; }
function KitchenShapes() {
  return <div style={{ display: 'flex', alignItems: 'flex-end', gap: 30, paddingBottom: 8 }}>
    <Bowl />
    <svg width="30" height="30" fill="none" stroke="var(--slate-ink)" strokeWidth="1.5"><circle cx="15" cy="15" r="14.25" /></svg>
    <svg width="20" height="40" viewBox="0 0 20 40" fill="none" stroke="var(--slate-ink)" strokeWidth="1.5"><path d="M6.6 0H13.4V6.6L20 12V36Q20 40 16 40H4Q0 40 0 36V12L6.6 6.6Z" /></svg>
    <svg width="28" height="30" viewBox="0 0 28 30" fill="none" stroke="var(--slate-ink)" strokeWidth="1.5"><path d="M0 0L5.6 30H22.4L28 0Z" /></svg>
  </div>;
}
function Onboarding({ onDone }) {
  const [i, setI] = React.useState(0);
  const next = () => i < 3 ? setI(i + 1) : onDone();
  const pages = [
    <OnboardingPage key="0" progress={0.125} headline="Write it the way you'd say it." near onNext={next}>
      <div style={{ display: 'grid', gap: 10, justifyItems: 'center', width: '100%' }}><OnboardingChip>2 roti aur ek katori dal</OnboardingChip><Arrow /><ExampleCard rows={[{ text: '2 roti', value: 220 }, { text: '1 katori dal', value: 140 }]} /></div>
    </OnboardingPage>,
    <OnboardingPage key="1" progress={0.25} headline="Your kitchen, not a database." near onNext={next}>
      <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}><KitchenShapes /><Arrow /><OnboardingChip>Numbers for how you cook</OnboardingChip></div>
    </OnboardingPage>,
    <OnboardingPage key="2" progress={0.375} headline="Movement goes in the same place." near onNext={next}>
      <ExampleCard rows={[{ text: 'Poha', value: 270 }, { text: '30 min jog', value: '−250', muted: true }, { text: 'Chai', value: 110 }, { text: '9000 steps', value: '−270', muted: true }, { text: '1 glass of water', check: true }]} />
    </OnboardingPage>,
    <OnboardingPage key="3" progress={0.5} headline="Every number here is an estimate." onNext={next}>
      <div style={{ display: 'grid', gap: 18 }}><div style={{ font: '400 17px/1.4 var(--font-sans)' }}>Packet labels can be 20% out. Restaurant oil can be more. Slate aims to be consistent, so your week tells the truth even when a single day is rough.</div><div><GreyLink>Where these numbers come from</GreyLink></div></div>
    </OnboardingPage>
  ];
  return pages[i];
}