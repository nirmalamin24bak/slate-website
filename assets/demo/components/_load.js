// Loads Slate component .jsx sources into window.Slate for cards and UI kits.
// Uses the compiled _ds_bundle.js when present; otherwise transpiles sources with Babel.
(function(){
  const FILES = ['buttons/Icon','buttons/IconButton','buttons/PrimaryPillButton','buttons/SecondaryPillButton','buttons/GreyLink','buttons/PlusBadge',
    'controls/PillSegmented','controls/SegmentedControl','controls/Chip','controls/InlineNumberField',
    'journal/ResolveShimmer','journal/CalorieLabel','journal/EntryRow','journal/BudgetBar','journal/MacroBar','journal/WaterRow','journal/TotalsBand','journal/HintBubble',
    'layout/Divider','layout/SectionHeader','layout/SettingsRow','layout/DetailCard','layout/OnboardingProgress','layout/OnboardingChip','layout/ExampleCard','navigation/Drawer',
    'journal/KeyboardBar'];
  const base = (document.currentScript && document.currentScript.src || '').replace(/_load\.js.*$/, '');
  window.loadSlate = async function(){
    if (window.Slate && window.Slate.EntryRow) return window.Slate;
    const ns = window.Slate = {};
    if (!window.lucide) await new Promise(res => { const s = document.createElement('script'); s.src = 'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
    const srcs = await Promise.all(FILES.map(f => fetch(base + f + '.jsx').then(r => r.text())));
    srcs.forEach(src => {
      const code = src
        .replace(/^import React.*$/mg, '')
        .replace(/^import \{([^}]+)\} from .*$/mg, (m, names) => 'const {' + names + '} = ns;')
        .replace(/export function (\w+)/g, 'ns.$1 = $1; function $1');
      const out = Babel.transform(code, { presets: ['react'] }).code;
      new Function('ns', 'React', out)(ns, React);
    });
    return ns;
  };
})();