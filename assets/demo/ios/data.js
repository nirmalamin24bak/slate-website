const FOODS = [
  [/roti|chapati/, 98, [3.5, 20, 2]], [/dal/, 146, [8, 20, 4]], [/poha/, 246, [5, 44, 6]], [/chai/, 48, [1.5, 7, 1.5]],
  [/dosa/, 294, [6, 44, 10]], [/idli/, 58, [2, 12, 0.3]], [/paneer/, 265, [18, 6, 20]], [/rice|chawal/, 180, [3.5, 40, 0.4]],
  [/banana|kela/, 105, [1.3, 27, 0.4]], [/egg|anda/, 78, [6, 0.6, 5]], [/shake/, 190, [24, 12, 4]], [/sabzi|bhindi/, 120, [3, 12, 7]]
];
function resolveLine(text) {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  if (/water|paani/.test(t)) return { status: 'noted' };
  if (/^weight/.test(t)) return { status: 'noted' };
  const steps = t.match(/([\d,]+)\s*steps/); if (steps) return { status: 'resolved', value: -Math.round(parseInt(steps[1].replace(/,/g, '')) * 0.032), exercise: true };
  const jog = t.match(/(\d+)\s*min\s*(jog|run|walk)/); if (jog) return { status: 'resolved', value: -Math.round(parseInt(jog[1]) * (jog[2] === 'walk' ? 4 : 8.3)), exercise: true };
  const n = parseFloat((t.match(/^(\d+(\.\d+)?)/) || [])[1]) || (/^(ek|one|a)\b/.test(t) ? 1 : /^(do|two)\b/.test(t) ? 2 : 1);
  for (const [re, cal, m] of FOODS) if (re.test(t)) {
    const k = (/kam tel|less oil/.test(t) ? 0.85 : 1) * (/swiggy|zomato|outside/.test(t) ? 1.25 : 1);
    return { status: 'resolved', value: Math.round(cal * n * k), macros: m.map(x => x * n) };
  }
  return { status: 'unrecognized' };
}
const SEED = [
  { text: '2 roti', status: 'resolved', value: 195, macros: [7, 40, 4] },
  { text: 'ek katori dal', status: 'resolved', value: 146, macros: [8, 20, 4] },
  { text: '1 plate poha', status: 'resolved', value: 246, macros: [5, 44, 6] },
  { text: 'chai, kam cheeni', status: 'resolved', value: 48, macros: [1.5, 7, 1.5] },
  { text: '1 masala dosa from Swiggy', status: 'resolved', value: 294, macros: [6, 44, 10] },
  { text: 'Water 1,500 ml', status: 'noted' },
  { text: '9,412 steps', status: 'resolved', value: -305, exercise: true, source: 'Health' },
];
const SUGGESTIONS = ['Protein shake', 'Office lunch', 'Chai, kam cheeni', '2 idli'];