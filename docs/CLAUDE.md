# CLAUDE.md: Slate iOS

Instructions for Claude Code (and any developer) working in the Slate repository. Read this first, then BRAND.md for copy and DESIGN.md for UI.

Last updated 8 October 2026.

---

## 1. The project in one paragraph

Slate is a calorie journal for iPhone, built for urban Indians aged 24 to 35. The user types what they ate on a line ("2 roti aur ek katori dal"), and Slate puts a number next to it, calculated on the device from Indian food composition data and adjusted for the user's own kitchen. Free forever, with an optional subscription, Slate Plus. No login, no ads, data stored in India.

- **Owner:** Sonal Systems Private Limited, Vadodara (CIN U62099GJ2026PTC179785)
- **Founders:** Nirmal Amin, Nehal Modi. **Engineering:** Basanth.
- **App Store name:** Slate: Calorie Journal. India only at launch. Age 18+.
- **Repo:** github.com/nirmalamin24bak/slate-app-rork (private). Built initially in Rork, now maintained in Xcode.

---

## 2. Stack

| Area | Choice |
|---|---|
| UI | Native SwiftUI, iOS 17+, iPhone |
| Charts | Swift Charts |
| Widgets | WidgetKit, configurable via AppIntents |
| Siri and shortcuts | AppIntents ("Log a chai in Slate") |
| Health | HealthKit (read-only: steps, weight, workouts, sleep) |
| Scanning | VisionKit (barcode, on-device label text recognition) |
| Purchases | RevenueCat SDK |
| Backend | Supabase: Postgres with row-level security, anonymous auth, Edge Functions (Deno/TypeScript) |
| AI | Anthropic API, called only from Edge Functions |
| Barcode data | Open Food Facts (barcode number only) |

Identifiers:

- Bundle ID `com.sonalsystems.slate`, widgets `com.sonalsystems.slate.widgets`
- App Group `group.com.sonalsystems.slate`
- Supabase project `yoojhlyigdcpubihoqko`, region `ap-south-1` (Mumbai)
- RevenueCat entitlement `slate_pro` (shown to users as "Slate Plus"), offering `default`, packages `$rc_monthly` → `slate_plus_monthly`, `$rc_annual` → `slate_plus_annual`

---

## 3. Repo layout

```
ios-slate/
  Slate/
    Models/        Entry, EntryCalculation, Profile, Kitchen, Dish, Ingredient ...
    Services/      LineResolver, ServerResolver, NutritionEngine, JournalWriter,
                   KitchenStore, PersonalizationStore, SyncService, PlusStore,
                   HealthService, WeightProvider ...
    Views/         Journal, EntryDetailSheet, Settings, Stats, Chat, Paywall ...
    Config/        SyncConfig.swift (Supabase URL + anon key, committed)
    Resources/     Fonts (Inter Tight), Assets (colour sets), Localizable.xcstrings,
                   seed data (ingredients, dishes, exercises)
  SlateWidgets/
  SlateTests/      FakeSupabase.swift, SlateTests.swift ...
.rork/DESIGN.md    design rules (keep in sync with DESIGN.md)
```

Edge Functions are deployed from the Supabase dashboard. Keep their source in `supabase/functions/{resolve,photo,chat}/index.ts` in this repo so they are versioned.

---

## 4. The engine: rules that must never break

1. **The AI never produces a calorie, gram or macro value.** It only maps text or photos to references in Slate's catalogue: `{intent, ref, qty, unit, context, modifiers}`. All nutrition is calculated on the device from data tables.
2. **Deterministic.** The same line with the same settings always gives the same number.
3. **Past days never change.** Every entry stores its computed values and a `calc_version`. Changing settings, data tables or the engine affects new lines only.
4. **Resolution order:** user's custom dishes → local matcher (aliases, Hinglish and Gujarati spellings) → server `resolve` function (cached globally by normalised phrase) → unresolved (↻, counted as 0). **Never guess a number.**
5. **Never cache an unresolved or low-confidence result on the device.** Only cache when every item resolved with confidence ≥ 0.8. Retry unresolved lines on launch and foreground.

### 4.1 Formulas

| Thing | Rule |
|---|---|
| BMR | Mifflin-St Jeor × 0.90 |
| Baseline | BMR × 1.2 (no activity multiplier) |
| Body weight | `WeightProvider`: latest weight trend (EWMA of weigh-ins), else latest weigh-in, else profile weight. Used for BMR, baseline, steps and exercise. |
| Exercise | MET × 3.5 × kg ÷ 200 × minutes. If the watch measured active energy (HealthKit, heart-rate device), use that instead. |
| Steps | Only steps above 3,000 count: (steps − 3,000) × 0.045 × kg ÷ 70. Read with `HKStatisticsQuery` cumulative sum, never by summing samples. |
| Steps and walk/run same day | Count only the larger burn; the other shows ✓ "included". |
| Katori | Kitchen katori ml × the dish's cooked density |
| Roti | Kitchen roti size → flour grams |
| Home oil | bottle ml ÷ days ÷ household size = oil per person per day, shared across home-cooked dishes |
| Outside food | Cooking fat × 1.35, portion × 1.20, no kitchen calibration. Dishes flagged `usually_outside` default to outside unless the line says home, ghar ka, homemade. |
| Chai | 5 + milk (none 0, toned 35, full 45 per 60 ml) + 16 per tsp sugar |
| Modifiers | less_oil fat × 0.6 · no_oil × 0 · extra_oil × 1.5 · extra_ghee +5 g ghee · no_sugar removes added sugar · less_sugar × 0.5 · extra_sugar × 1.5 · small_portion × 0.75 · large_portion × 1.25 |
| How you cook note | `resolve` with `{mode:"note"}` returns `oil_factor` 0.5 to 1.5, `sugar_factor` 0 to 1.5, `portion_factor` 0.7 to 1.3. Home-cooked dishes only. |
| Personalisation clamp | All personal adjustments together move a dish at most ±20% kcal and ±30% fat. |
| Floors | Goals below 1,200 are refused. A displayed **net** figure never shows below 1,200. **Food eaten is never floored.** |
| Measured maintenance (Plus) | Last 28 days: average intake on logged days − (trend change kg × 7,700 ÷ days). Needs ≥ 21 logged days, ≥ 4 weigh-ins over ≥ 14 days, user 18+. Round to 10. Never below 1,200, never presented as a target. Saved to `profiles.settings.measured_maintenance` as `{kcal, computed_at}`. |

### 4.2 Product rules

- No goal suggestions anywhere, including chat and measured maintenance.
- Under 18: no numbers, BMR, goal, chat or photo logging anywhere.
- A weight change over 5 kg asks "Did you mean …?".
- Over goal is never coloured or commented on.
- No haptics, no celebration, no streak pressure.
- Hide calorie counts removes every calorie figure from the app, widgets and VoiceOver.
- Health weight never silently overwrites Your body; it asks first.

---

## 5. Free and Plus

Gate Plus features on the RevenueCat entitlement `slate_pro` through `PlusStore`. **Never move a free feature behind Plus** (it's a public promise).

- **Free:** journal (food, exercise, weight, water, steps), Hinglish spellings and modifiers, your kitchen, About you and How you cook, outside/home and portions, barcode and label scan, macros and goals, How we got this, BMR and baseline, water, streak, 30 days of history, Siri, Hide calorie counts, appearance, export and delete.
- **Plus:** photo logging, chat, measured maintenance, stats and weight trend, Apple Health and Connected apps, widgets with quick add, custom dishes, saved foods, fiber and sugar, sleep, history beyond 30 days.
- **When Plus lapses:** delete nothing. Hide older history, keep custom dishes resolving.
- Prices: ₹399 a month, ₹2,999 a year with a 7-day free trial. The paywall is always dismissible.

---

## 6. Backend

### 6.1 Tables (all with RLS)

Reference (read-only to users): `ingredients`, `dishes`, `dish_ingredients`, `exercises`, `packaged_foods`, `resolution_cache` (no client read).
User ("own rows" policy): `profiles` (with `settings` jsonb: `about_you`, `hide_calorie_counts`, `measured_maintenance` ...; and `how_you_cook`), `kitchen`, `entries`, `weights`, `saved_foods`, `custom_dishes`, `custom_dish_ingredients`, `chat_messages`, `ai_usage`.
RPC: `delete_my_account()`.

### 6.2 Sync

Local-first. Client-generated UUIDs, dirty flags, soft deletes (`deleted_at`), last-write-wins. The app must work fully offline except for server resolution, photo and chat.

### 6.3 Edge Functions

Each verifies the user itself with `admin.auth.getUser(token)`; "Verify JWT with legacy secret" stays **off**.

| Function | Model | Daily cap | Request | Response |
|---|---|---|---|---|
| `resolve` | Haiku-class | 300 | `{text}` or `{mode:"note", text}` | `{items:[{intent, ref, qty, unit, context, modifiers, confidence}]}` or `{oil_factor, sugar_factor, portion_factor, notes}` |
| `photo` | Sonnet-class | 25 | image (never stored) | `{dishes:[{ref, label, qty, unit, context_hint, confidence}]}` |
| `chat` | Sonnet-class | 40 | `{message, date}` | `{reply}`; errors `401`, `400`, `429 daily_limit`, `502 upstream` |

The app must handle every error visibly and never silently drop the user's input.

---

## 7. Security rules

- **Never** put these in the app or the repo: Supabase `service_role` key, Anthropic API key, App Store Connect `.p8` keys, RevenueCat secret keys. They live in Supabase Secrets or App Store Connect only.
- Safe to commit: the Supabase URL and anon key (`SyncConfig.swift`) and the RevenueCat public `appl_` key (`PlusStore.swift`).
- `SyncConfig.swift` must be committed and populated, not gitignored, or release builds won't sync.
- Keep the repo private.
- No analytics or crash SDKs (PostHog, Sentry and so on) until after App Store launch and handover. Adding one requires updating the privacy policy first.
- No ad SDKs, ever. No IDFA, no tracking.

---

## 8. Testing

- **Tests never touch the live Supabase project or live Edge Functions.** Use `FakeSupabase` and mocked function responses.
- Unit-test the engine: katori sizes, roti sizes, oil days, chai formula, outside factors, modifiers, the clamp, floors, steps rule, larger-burn rule, measured maintenance thresholds, under-18 behaviour, past days unchanged after settings changes.
- If the test runner fails for tooling reasons (for example StoreKit configuration), report it and move on. Don't loop on it.
- For subscriptions, test in TestFlight (free sandbox purchases) with an India-storefront sandbox tester so prices show in rupees.

---

## 9. Build and release

- Bump the build number for every TestFlight upload; keep the version unless asked.
- Before uploading: build succeeds, `SyncConfig.swift` populated, no secrets in the diff.
- One TestFlight upload per batch of work, not per change.
- Don't run the simulator or take screenshots unless asked.
- The app opts out of Liquid Glass with Apple's compatibility-mode Info.plist key so it keeps Slate's flat ink design. Apple treats this as temporary (ignored from iOS 27), so the back button and bars need a Liquid Glass pass before then.

---

## 10. Code conventions

- SwiftUI with `@Observable` models; services injected through the environment.
- Colours only from asset colour sets (`bg`, `surface`, `fill`, `ink`, `inkMute`, `hairline`, `accent`, `protein`, `carbs`, `fat`, `water`). App-wide `.tint(Color.ink)`.
- Fonts only through the shared Inter Tight text styles; `.monospacedDigit()` on every number.
- All user-facing strings in `Localizable.xcstrings` (Hindi and Gujarati are deferred, but strings must be ready).
- Number formatting through one formatter: Indian grouping, Western digits, whole calories.
- Every new screen follows the detail screen pattern in DESIGN.md §5.2.
- Every new user-facing string passes the BRAND.md checklist: sentence case, no exclamation marks, no em dashes, no emoji, none of the banned words (just, healthy, journey, great job, cheat ...).

---

## 11. Contacts and links

- Support: support@writeonslate.com · Privacy and Grievance Officer: privacy@writeonslate.com
- Website: writeonslate.com (`/privacy/`, `/terms/`, `/support/`)
- Data region: Mumbai, India. Governing law: DPDP Act 2023.

---

## 12. Before you finish any task

- [ ] Builds without warnings you introduced.
- [ ] Engine rules in §4 still hold; tests pass (mocks only).
- [ ] No secrets added. No live backend touched by tests.
- [ ] UI follows DESIGN.md; copy follows BRAND.md.
- [ ] Free features are still free.
- [ ] Report what changed, what wasn't done, and why.
