# DESIGN.md: Slate

The visual and interaction rules for the Slate iOS app (native SwiftUI, iOS 17+), and the reference for the website and any marketing material. Copy and tone rules live in BRAND.md.

Last updated 8 October 2026.

---

## 1. Principles

1. **The restraint is the brand.** Greys, ink and white. Colour only where it carries meaning (macros, water) or marks Plus.
2. **The line is the product.** Nothing competes with the journal: no banners, no cards stacked on top of it, no floating buttons.
3. **Numbers are calm.** Tabular, settled, never coloured by judgement. Over goal looks exactly like under goal.
4. **One way to do each thing.** One primary button per screen. One detail screen pattern. One card style.
5. **No celebration.** No confetti, no haptics, no badges, no sounds.

---

## 2. Colour tokens

Define every colour as a named asset (Color Set) with light and dark values. Never hard-code a hex value in a view.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F7F7F5` | `#0E0F11` | Screen background |
| `surface` | `#FFFFFF` | `#191A1D` | Cards, sheets, detail cards |
| `fill` | `#EFEFEC` | `#232428` | Tracks, chips, secondary buttons, inputs |
| `ink` | `#111214` | `#F5F5F3` | Primary text, icons, primary buttons, progress bar, app tint |
| `inkMute` | `#8A8B90` | `#7E7F85` | Secondary text, labels, exercise lines, placeholders |
| `hairline` | `#E3E3DF` | `#2B2C30` | Dividers, outlines |
| `accent` | `#3E5C9E` | `#3E5C9E` | Resolve shimmer, Plus badge, focus. Nothing else. |

### 2.1 Semantic colours

| Token | Light | Dark | Use |
|---|---|---|---|
| `protein` | `#2E7D72` (teal) | `#4FA596` | Protein segment, dot and label accents |
| `carbs` | `#C9962B` (turmeric) | `#DDB04F` | Carbs segment |
| `fat` | `#7B4B8A` (plum) | `#A77BB6` | Fat segment |
| `water` | `#3B82C4` | `#6AA8E0` | Water bar and water chart only |

### 2.2 Rules

- **App-wide tint is `ink`.** No system blue anywhere: back buttons, toolbar items, links, toggles' accessory text. (Toggles may keep the system green fill.)
- **No red** for delete, over goal or errors. Delete is a quiet grey trash icon.
- **Over goal never changes colour.** Bars stay full in their normal colour; text reads "210 over" in `inkMute`.
- No gradients except the resolve shimmer.
- Web only: secondary body text uses a darker mute (`#6E6F74` light, `#9A9BA1` dark) to meet 4.5:1 contrast; web dark accent is `#7C97D6`.

---

## 3. Typography

- **One family: Inter Tight** (bundled). Weights: 400 body, 500 labels and values, 700 titles, 800 display.
- **Tabular figures on every number, everywhere** (`.monospacedDigit()` in SwiftUI, `font-feature-settings: "tnum"` on the web).
- All text uses Dynamic Type-relative sizes so it scales.

| Style | Size (pt) | Weight | Tracking | Use |
|---|---|---|---|---|
| Display | 40 | 800 | −0.035em | Screen titles ("Today", "Your body", "Stats") |
| Hero number | 44 to 56 | 700 | −0.02em | Today's total, a line's calories on its sheet |
| Title | 22 | 700 | −0.01em | Card titles, sheet titles |
| Body | 17 | 400 | 0 | Journal lines, paragraphs |
| Value | 17 | 500 | 0 | Numbers on lines, stat values |
| Label | 15 | 400 | 0 | Secondary text, captions |
| Small | 13 | 500 | 0 | Macro labels, units, footnotes |

- Units sit beside a number in a smaller muted size: "1,532" + " cals".
- Line height about 1.3 for body, 1.05 for display.
- Indic scripts (future localisation): fall back to Noto Sans Devanagari and Noto Sans Gujarati.

---

## 4. Spacing, radius, elevation

- Base unit 4 pt. Common steps: 4, 8, 12, 16, 20, 24, 32, 40.
- Screen side padding 24 pt.
- Journal rows at least 52 pt tall, about 20 pt rhythm between text baselines.
- Radius: sheets 24, detail cards and stat cards 16 (continuous corners), widgets follow the system, plan rows 20, chips 12, buttons and pills 999 (fully rounded).
- **One shadow, cards only:** `0 2 24 rgba(17,18,20,0.06)` in light mode. None in dark mode (use a `hairline` outline instead). Never on buttons.

---

## 5. Layout patterns

### 5.1 Journal (home)

- **Top bar:** menu (`line.3.horizontal`) top left, scan (`viewfinder`) top right. Both plain SF Symbols in `ink`, 22 pt, 44 pt tap targets, **no circles, no rings, no backgrounds.**
- **Title:** "Today" in Display, or the date for past days.
- **Header band** (no card, no shadow), pinned with `.safeAreaInset(edge: .top)` and an opaque `bg` background so lines scroll under it cleanly:
  - Total eaten in Hero number + "cals"; right-aligned on the same baseline: "468 left" or "210 over" in `inkMute`.
  - Thin `ink` progress bar, 4 pt, `fill` track.
  - Connected macro bar (see 6.4) with labels.
  - Water row (shown when Show water is on in Customize display, on by default): 4 pt bar in `water` and "1,250 of 2,500 ml" in Small `inkMute`. Tap to add a glass.
- **Lines:** text left, number right. Placeholder "What did you have?". Exercise and steps in `inkMute` with a leading "−". Water, weight and sleep show "✓". Unrecognised shows a grey "↻".
- Keyboard accessory row: camera, suggestion chips (saved foods, then recent), Done.

### 5.2 Detail screen pattern (every pushed screen)

Used for Your body, Calorie goal, Macros, Your kitchen, About you, Water, Notifications, Privacy, Account, Export, Connected apps and every other screen pushed from Settings or the drawer.

- Large Display title top left, optional one-line `inkMute` subtitle.
- Content in **one centred card**: `surface`, radius 16 (continuous), 20 pt padding, hairline border, the card shadow in light mode. Rows inside separated by `hairline`.
- A full-width **Done** button pinned at the bottom (primary style).
- Back button in `ink`.
- No grouped `List` styling, no section headers in caps.
- Exceptions: Settings and Body & goals are hub lists (menus of rows), and History, Streak, Stats, Weight, Chat and Custom dishes keep their own data-screen layouts.

### 5.3 Line detail sheet

- Presented as a sheet with a grabber. Title is the line text. A plain `ellipsis` icon top right (no box) opens: Nickname, Save as food, Copy to today, Delete.
- Hero number + "cals".
- Connected macro bar, then Protein / Carbs / Fat as three columns: Small label, Value number.
- **Portion row:** ½, 1, 1½, 2 as chips, plus a stepper. Changes rescale everything and save immediately.
- **Outside / Made at home** segmented switch.
- **How we got this:** each ingredient with grams right-aligned, adjustments in plain words ("Your katori: 200 ml", "Less oil than usual", "Restaurant-style oil"), then a Small `inkMute` line "Estimated from IFCT 2017 values".

### 5.4 Stats

- Range tabs as plain text: Week, Month, 3 months, Year. Selected in `ink` with a 2 pt underline, others `inkMute`. No segmented control.
- Stacked cards (card style), in order: Summary, Calories, Macros, Weight, Water, Movement, Fiber (Plus), Maintenance (Plus). Tap a card for its detail screen.
- Charts (Swift Charts): thin bars, no gridlines except a faint baseline, goal as a dashed `inkMute` rule, weight as `inkMute` dots plus an `ink` trend line. No arrows, no good or bad colours, no bottom summary card.

### 5.5 Onboarding

- One continuous 2 pt `ink` hairline progress at the top, filling from the first teach screen to reminders. No step pills, no dots.
- One idea per screen, primary button at the bottom, skippable where noted.
- Ends with "That's the whole app." and "Start writing."

### 5.6 Paywall

- Close button (`xmark`, plain) visible in every state. Swipe down dismisses.
- Headline "Slate is free forever." Body lists Plus features. Plan rows (radius 20, `fill` background, selected row with an `ink` 1.5 pt outline): Yearly preselected with "7 days free, then ₹2,999 a year" and a "−37%" tag; Monthly with "₹92 a week".
- Primary button "Start free trial" or "Upgrade". Text buttons: No thanks · What Slate won't do · Restore purchases · Terms · Privacy policy.
- No urgency copy, no countdown, no strike-through.

### 5.7 Chat

- One thread per day. User messages in `fill` bubbles right-aligned; Slate's replies as plain text left-aligned (no bubble).
- Suggestions as tappable chips (`fill`, radius 12, no outline) that send immediately.
- Waiting: three small `inkMute` dots.
- Failure: the user's message stays; a Small `inkMute` line under it reads "Chat couldn't answer. Tap to try again."
- Small footnote: "Chat sends today's journal to our AI provider to answer. It isn't used to train models."

---

## 6. Components

### 6.1 Buttons

| Type | Style |
|---|---|
| Primary | Full width, 56 pt tall, pill, `ink` fill, `bg` text, Body 500. One per screen. |
| Secondary | Pill, `fill` background, `ink` text. |
| Text | `ink` or `inkMute` text, no background. |
| Icon | SF Symbol in `ink`, 22 pt, 44 pt target, no background, no ring. |

No shadows on buttons. No haptics on any tap.

### 6.2 Chips

`fill` background, radius 12, 8 by 12 pt padding, Label text in `ink`. Selected chip: `ink` background, `bg` text.

### 6.3 Inputs

Plain text on `bg` for journal lines (no box). In detail cards: `fill` background, radius 12, 14 pt padding. Number inputs use tabular figures and a trailing unit ("cals", "kg", "ml").

### 6.4 Connected macro bar

- One row of three segments: protein, carbs, fat, separated by **3 pt gaps**.
- Each segment's width is proportional to its goal in calories (protein g × 4, carbs g × 4, fat g × 9). Without goals, use the day's split.
- Each segment has a `fill` track and fills from the left toward its goal.
- 4 pt tall, each segment a capsule on its own light track.
- Labels under each segment: "Protein 42 of 90 g" in Small `inkMute`.
- Over goal: the segment is shown full in its own colour. Never red.

### 6.5 Progress bars

4 pt tall, fully rounded, `fill` track, `ink` fill (water uses `water`). Capped at full when over.

### 6.6 Plus badge

Small pill, "Plus", `accent` text on `accent` at 10% opacity, Small 500.

### 6.7 Cards

`surface`, radius 16 (continuous), 20 pt padding, the card shadow (light) or `hairline` outline (dark).

### 6.8 Rows

Title left in Body, value right in Value `inkMute` or a chevron. 52 pt minimum height. `hairline` divider inset 0.

### 6.9 Icons

SF Symbols only in the app, regular weight, `ink` or `inkMute`. On the web: line icons, 1.5 px stroke, 24 grid, rounded caps, `currentColor`.

---

## 7. Widgets

- **Small:** "Today", total + "cals", "468 left" (or "120 over"), progress bar.
- **Medium:** the above on the left, macros (dot + label + grams) below, and a **quick-add button** on the right: smaller and outlined (1 pt `ink` at 30% opacity, `ink` icon and label, no fill). The item is configurable (Chai by default, Coffee, Glass of water, any saved food). After a tap it reads "Chai added" for about 3 seconds; repeat taps within 3 seconds are ignored.
- **Lock screen:** rectangular (total and left), circular gauge (no ring chart styling beyond the system gauge), inline ("1,371 cals").
- All widgets respect Hide calorie counts and use the same tokens.

---

## 8. Motion

Three animations, no more:

1. **Resolve shimmer:** a faint gradient sweep under a line that's resolving, about 900 ms, ease-out: transparent → `#7FBFA8` at 12% → `#3E5C9E` at 18% → transparent.
2. **Number settle:** a resolved number fades in and rises 4 pt, about 180 ms. Changing numbers use `.contentTransition(.numericText())`, never showing garbage digits.
3. **Sheet spring:** system default.

Deletes: the row slides out and fades (0.22 s), and the gap closes with a soft spring.

**No haptics anywhere. No confetti. No celebration. No sounds.**

Reduce Motion: the shimmer becomes a static faint fill; numbers change instantly.

---

## 9. Accessibility

- Dynamic Type up to the largest accessibility sizes. Lines reflow; numbers never wrap or truncate.
- Every control has a VoiceOver label. A journal line reads as one utterance: "2 roti, 220 calories." The header band reads as one sentence: "1,532 calories eaten, 468 left."
- Hide calorie counts also removes calories from VoiceOver.
- Minimum tap target 44 by 44 pt.
- Contrast: text at least 4.5:1, large text and UI at least 3:1, in both modes.
- Light and dark mode on every screen. Appearance setting: System, Light, Dark.
- Respect the user's Button Shapes setting (underlined back buttons are expected).

---

## 10. Things never to do

- Ring or donut progress charts, ringed circular buttons, floating summary cards at the bottom of the journal.
- Two-chapter onboarding pills, dots "consistency" graphics.
- System blue tint, red delete buttons, red or orange over-goal states.
- Shadows on buttons, gradients on surfaces, colour backgrounds on sections.
- Haptics, confetti, badges, streak flames, celebratory animations.
- Grouped iOS `List` styling on detail screens.
- Competitor sample numbers (790 / 2400, 1610 left, 32 g / 98 g / 27 g) in any screenshot or mock.
- Logos of other companies (Apple Watch, Garmin, Strava, Nike) in the UI.
