/* The journal demo in the hero (docs/WEBSITE-SPEC.md §9).
   A small, illustrative dictionary. The app uses its own engine and your kitchen.
   No storage, no cookies, no network. Reloading resets it. */
(function () {
  "use strict";

  var GOAL = { kcal: 2000, p: 90, c: 250, f: 60, water: 2500 };
  var MAX_LINES = 12;
  var RESOLVE_MS = 650;

  // Per one unit: cals, protein, carbs, fat (g). Longer aliases are matched first.
  var FOODS = [
    { name: "roti", aliases: ["roti", "chapati", "phulka"], kcal: 110, p: 3.5, c: 20, f: 2 },
    { name: "dal", aliases: ["dal"], kcal: 160, p: 9, c: 22, f: 4 },
    { name: "rice", aliases: ["rice", "chawal"], kcal: 200, p: 4, c: 44, f: 0.5 },
    { name: "rajma", aliases: ["rajma"], kcal: 210, p: 10, c: 28, f: 6 },
    { name: "poha", aliases: ["poha"], kcal: 270, p: 5, c: 45, f: 8 },
    { name: "upma", aliases: ["upma"], kcal: 250, p: 6, c: 38, f: 8 },
    { name: "idli", aliases: ["idli"], kcal: 60, p: 2, c: 12, f: 0.3 },
    { name: "dosa", aliases: ["masala dosa", "dosa"], kcal: 360, p: 7, c: 50, f: 14 },
    { name: "vada pav", aliases: ["vada pav"], kcal: 300, p: 7, c: 40, f: 13 },
    { name: "samosa", aliases: ["samosa"], kcal: 260, p: 4, c: 26, f: 16 },
    { name: "dhokla", aliases: ["dhokla"], kcal: 160, p: 6, c: 26, f: 4 },
    { name: "thepla", aliases: ["thepla"], kcal: 120, p: 3, c: 16, f: 5 },
    { name: "khichdi", aliases: ["khichdi"], kcal: 220, p: 7, c: 36, f: 5 },
    { name: "pav bhaji", aliases: ["pav bhaji"], kcal: 400, p: 9, c: 50, f: 18 },
    { name: "biryani", aliases: ["biryani"], kcal: 450, p: 15, c: 55, f: 18 },
    { name: "paneer", aliases: ["paneer sabzi", "paneer"], kcal: 280, p: 12, c: 10, f: 21 },
    { name: "egg", aliases: ["egg", "anda"], kcal: 78, p: 6, c: 0.6, f: 5 },
    { name: "banana", aliases: ["banana", "kela"], kcal: 105, p: 1.3, c: 27, f: 0.4 },
    { name: "chaas", aliases: ["chaas", "buttermilk"], kcal: 40, p: 2, c: 5, f: 1 },
    { name: "chai", aliases: ["chai"], kcal: 72, p: 2, c: 9, f: 3, sugary: true },
    { name: "coffee", aliases: ["coffee"], kcal: 90, p: 3, c: 10, f: 4, sugary: true }
  ];

  // Cals per minute. Jog is 8.34 so that 30 minutes reads 250, as on the rest of the site.
  var EXERCISE = [
    { aliases: ["jogging", "jog", "running", "run"], perMin: 8.34 },
    { aliases: ["walking", "walk"], perMin: 4.5 },
    { aliases: ["yoga"], perMin: 3 },
    { aliases: ["gym", "weights"], perMin: 4.2 },
    { aliases: ["cycling", "cycle"], perMin: 7 },
    { aliases: ["badminton"], perMin: 5.5 },
    { aliases: ["cricket"], perMin: 5 }
  ];

  var QTY_WORDS = { ek: 1, one: 1, "do": 2, two: 2, teen: 3, three: 3, "char": 4, four: 4, half: 0.5, aadha: 0.5, dedh: 1.5 };

  var OUTSIDE = /\b(swiggy|zomato|restaurant|canteen|dhaba|cafe|outside|ordered|hotel)\b/;

  // Modifier phrases. A piece after a comma made only of these joins the previous line.
  var MODIFIERS = [
    { re: /\b(less oil|kam tel)\b/, kind: "lessOil" },
    { re: /\b(no sugar|bina cheeni)\b/, kind: "noSugar" },
    { re: /\b(less sugar|kam cheeni)\b/, kind: "lessSugar" },
    { re: /\bhalf plate\b/, kind: "halfPlate" }
  ];
  var FILLER = /\b(from|with|via|on|at|the|a|an)\b/g;

  function aliasRe(alias) {
    return new RegExp("\\b" + alias.replace(/ /g, "\\s+") + "s?\\b");
  }

  function clean(text) {
    return String(text).toLowerCase().replace(/\s+/g, " ").trim();
  }

  function isModifierOnly(piece) {
    var s = clean(piece);
    MODIFIERS.forEach(function (m) { s = s.replace(new RegExp(m.re.source, "g"), " "); });
    s = s.replace(new RegExp(OUTSIDE.source, "g"), " ").replace(FILLER, " ").trim();
    return s.length === 0;
  }

  // "2 roti aur ek katori dal" -> ["2 roti", "ek katori dal"]; "chai, kam cheeni" stays one line.
  function split(text) {
    var out = [];
    String(text).split(/\s+aur\s+|\s+and\s+|\s*\+\s*/i).forEach(function (chunk) {
      chunk.split(",").forEach(function (piece, i) {
        piece = piece.trim();
        if (!piece) return;
        if (i > 0 && out.length && isModifierOnly(piece)) {
          out[out.length - 1] += ", " + piece;
        } else {
          out.push(piece);
        }
      });
    });
    return out;
  }

  // Show "ek katori dal" as "1 katori dal", the way the app writes it back.
  function displayText(piece) {
    var t = piece.trim();
    var m = t.match(/^(\S+)(\s.*)$/);
    if (m && Object.prototype.hasOwnProperty.call(QTY_WORDS, m[1].toLowerCase()) && QTY_WORDS[m[1].toLowerCase()] >= 1) {
      t = QTY_WORDS[m[1].toLowerCase()] + m[2];
    }
    return t;
  }

  function quantity(s) {
    var num = s.match(/(\d+(?:\.\d+)?)/);
    if (num) return parseFloat(num[1]);
    var words = s.split(" ");
    for (var i = 0; i < words.length; i++) {
      if (Object.prototype.hasOwnProperty.call(QTY_WORDS, words[i])) return QTY_WORDS[words[i]];
    }
    return 1;
  }

  function minutes(s) {
    var m = s.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?)\b/);
    if (!m) return null;
    var n = parseFloat(m[1]);
    return /^h/.test(m[2]) ? n * 60 : n;
  }

  function resolve(piece) {
    var s = clean(piece);
    var m;

    // Water
    if (/\b(water|paani|pani)\b/.test(s)) {
      var amount = quantity(s);
      var ml;
      if (/\bml\b/.test(s) || /\d\s*ml\b/.test(s)) ml = amount;
      else if (/\b(litres?|liters?|l)\b/.test(s)) ml = amount * 1000;
      else ml = amount * 250;
      return { kind: "water", ml: ml };
    }

    // Weight
    if (/^(weight|wt)\b.*\d/.test(s) || /\b\d+(?:\.\d+)?\s*kgs?\b/.test(s)) {
      return { kind: "weight" };
    }

    // Steps: only steps above 3,000 count
    if ((m = s.match(/(\d[\d,]*)\s*steps?\b/))) {
      var steps = parseInt(m[1].replace(/,/g, ""), 10);
      return { kind: "exercise", kcal: Math.max(0, Math.round((steps - 3000) * 0.045)) };
    }

    // Exercise
    for (var e = 0; e < EXERCISE.length; e++) {
      if (EXERCISE[e].aliases.some(function (a) { return aliasRe(a).test(s); })) {
        var mins = minutes(s);
        if (mins === null) return { kind: "unknown" };   // never guess a duration
        return { kind: "exercise", kcal: Math.round(EXERCISE[e].perMin * mins) };
      }
    }

    // Food
    var food = null;
    var best = 0;
    FOODS.forEach(function (f) {
      f.aliases.forEach(function (a) {
        if (a.length > best && aliasRe(a).test(s)) { food = f; best = a.length; }
      });
    });
    if (!food) return { kind: "unknown" };

    var mods = {};
    var rest = s;
    MODIFIERS.forEach(function (mod) {
      if (mod.re.test(rest)) { mods[mod.kind] = true; rest = rest.replace(new RegExp(mod.re.source, "g"), " "); }
    });
    var q = quantity(rest);
    var kcal = food.kcal * q;
    var p = food.p * q;
    var c = food.c * q;
    var f = food.f * q;

    if (OUTSIDE.test(s)) { kcal *= 1.25; f *= 1.25; }
    if (mods.lessOil) { f *= 0.6; kcal = p * 4 + c * 4 + f * 9; }
    if (food.sugary && mods.noSugar) kcal -= 32 * q;
    else if (food.sugary && mods.lessSugar) kcal -= 8 * q;
    if (mods.halfPlate) { kcal *= 0.5; p *= 0.5; c *= 0.5; f *= 0.5; }

    return { kind: "food", kcal: Math.max(0, Math.round(kcal)), p: p, c: c, f: f };
  }

  function fmt(n) {
    return Math.round(n).toLocaleString("en-IN");
  }

  function totals(lines) {
    var t = { eaten: 0, burn: 0, p: 0, c: 0, f: 0, water: 0 };
    lines.forEach(function (l) {
      var r = l.result;
      if (!r) return;
      if (r.kind === "food") { t.eaten += r.kcal; t.p += r.p; t.c += r.c; t.f += r.f; }
      else if (r.kind === "exercise") t.burn += r.kcal;
      else if (r.kind === "water") t.water += r.ml;
    });
    t.left = GOAL.kcal - t.eaten + t.burn;
    return t;
  }

  var Engine = { split: split, resolve: resolve, totals: totals, displayText: displayText, fmt: fmt, GOAL: GOAL };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Engine;
    return;
  }

  /* ---------------- Browser ---------------- */

  var root = document.getElementById("demo");
  if (!root) return;

  var $ = function (id) { return document.getElementById(id); };
  var list = $("demo-lines");
  var form = $("demo-form");
  var input = $("demo-entry");
  var chips = $("demo-chips");
  var tryBox = root.querySelector(".demo-try");
  var live = $("demo-live");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var START = { lines: ["1 plate poha", "1 cup chai", "30 min jog"], water: 500 };
  var lines = [];
  var baseWater = START.water;
  var uid = 0;

  function numberFor(r) {
    if (r.kind === "food") return { text: fmt(r.kcal), muted: false };
    if (r.kind === "exercise") return { text: "−" + fmt(r.kcal), muted: true };
    if (r.kind === "water" || r.kind === "weight") return { text: "✓", muted: true };
    return { text: "↻", muted: true };
  }

  function sentence(line) {
    var r = line.result;
    if (r.kind === "food") return line.text + ", " + fmt(r.kcal) + " calories.";
    if (r.kind === "exercise") return line.text + ", minus " + fmt(r.kcal) + " calories.";
    if (r.kind === "water" || r.kind === "weight") return line.text + ", added.";
    return line.text + ", not recognised, counted as zero.";
  }

  function setWidth(el, ratio) {
    el.style.width = (Math.min(1, Math.max(0, ratio)) * 100).toFixed(2) + "%";
  }

  function renderHeader() {
    var t = totals(lines);
    $("demo-eaten").textContent = fmt(t.eaten);
    $("demo-left").textContent = t.left >= 0 ? fmt(t.left) + " left" : fmt(-t.left) + " over";
    setWidth($("demo-bar"), t.eaten / GOAL.kcal);
    $("demo-p").textContent = fmt(t.p);
    $("demo-c").textContent = fmt(t.c);
    $("demo-f").textContent = fmt(t.f);
    setWidth($("demo-p-bar"), t.p / GOAL.p);
    setWidth($("demo-c-bar"), t.c / GOAL.c);
    setWidth($("demo-f-bar"), t.f / GOAL.f);
    var water = baseWater + t.water;
    $("demo-water").textContent = fmt(water);
    setWidth($("demo-water-bar"), water / GOAL.water);
  }

  function lineElement(line) {
    var li = document.createElement("li");
    li.className = "jline";
    li.dataset.id = String(line.id);

    var text = document.createElement("span");
    text.className = "jline-text";
    text.textContent = line.text;

    var num = document.createElement("span");
    num.className = "jline-num";

    var del = document.createElement("button");
    del.type = "button";
    del.className = "jline-del";
    del.setAttribute("aria-label", "Delete " + line.text);
    del.textContent = "×";
    del.addEventListener("click", function () { removeLine(line.id, true); });

    li.appendChild(text);
    li.appendChild(num);
    li.appendChild(del);
    return li;
  }

  function settle(line, li, animate) {
    var n = numberFor(line.result);
    var num = li.querySelector(".jline-num");
    num.textContent = n.text;
    li.classList.remove("is-resolving");
    li.classList.toggle("is-muted", line.result.kind === "exercise");
    num.classList.toggle("is-muted", n.muted && line.result.kind !== "exercise");
    if (animate && !reduceMotion) num.classList.add("is-settling");
  }

  // After a delete, keep keyboard focus nearby without opening the phone keyboard.
  function removeLine(id, moveFocus) {
    lines = lines.filter(function (l) { return l.id !== id; });
    var li = list.querySelector('[data-id="' + id + '"]');
    if (!li) return renderHeader();
    var near = li.nextElementSibling || li.previousElementSibling;
    li.parentNode.removeChild(li);
    renderHeader();
    if (moveFocus) (near ? near.querySelector(".jline-del") : input).focus();
  }

  function addLine(piece, opts) {
    var line = { id: ++uid, text: displayText(piece), result: null, user: !opts.initial };
    lines.push(line);
    var li = lineElement(line);
    list.appendChild(li);

    // Keep the page short: drop the oldest line the visitor added.
    while (lines.length > MAX_LINES) {
      var oldest = lines.filter(function (l) { return l.user; })[0] || lines[0];
      removeLine(oldest.id, false);
    }

    if (opts.initial) {
      line.result = resolve(piece);
      settle(line, li, false);
      return Promise.resolve(line);
    }

    li.classList.add("is-resolving");
    return new Promise(function (done) {
      window.setTimeout(function () {
        line.result = resolve(piece);
        if (li.isConnected) settle(line, li, true);
        renderHeader();
        done(line);
      }, reduceMotion ? 0 : RESOLVE_MS);
    });
  }

  function submit(text) {
    var pieces = split(text);
    if (!pieces.length) return;
    Promise.all(pieces.map(function (p) { return addLine(p, {}); })).then(function (added) {
      live.textContent = added.map(sentence).join(" ");
    });
  }

  // Starting state, rebuilt so every line can be deleted.
  list.textContent = "";
  START.lines.forEach(function (t) { addLine(t, { initial: true }); });
  renderHeader();

  form.hidden = false;
  tryBox.hidden = false;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var value = input.value.trim();
    if (!value) return;
    input.value = "";
    submit(value);
  });

  chips.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    var next = chip.nextElementSibling || chip.previousElementSibling;
    input.value = chip.textContent;
    chip.parentNode.removeChild(chip);
    if (form.requestSubmit) form.requestSubmit();
    else form.dispatchEvent(new Event("submit", { cancelable: true }));
    if (next) next.focus();
    else { tryBox.hidden = true; input.focus(); }
  });
})();
