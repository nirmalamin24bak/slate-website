# writeonslate.com: website build spec

**For:** Claude Code (VS Code), building the Slate marketing website
**Owner:** Sonal Systems Private Limited, Vadodara
**Last updated:** 9 October 2026
**Status of the app:** iOS app in TestFlight, App Store launch pending (India only)

This file is everything needed to build the website without asking anyone a question. It covers what Slate is, who makes it, how it works, what is free and what is paid, every section of every page with final copy, the design system, the interactive demo, the legal pages, SEO, hosting, and an acceptance checklist.

Read it top to bottom once before writing code. Where this file gives exact copy, use it word for word. Where it describes intent, write copy that follows the voice rules in §3.

A first version of the site exists (`slate-website/`: `index.html`, `privacy/`, `terms/`, `404.html`, `assets/` with self-hosted Inter Tight and icons). You may start from it or rebuild. Either way, the result must match this spec, which adds sections and updates content the first version doesn't have.

---

## Contents

1. What Slate is
2. Who makes Slate
3. Brand and voice
4. How Slate works (product facts the site must get right)
5. Free and Slate Plus
6. Privacy and data (facts)
7. Site map
8. Home page, section by section, with copy
9. The interactive journal demo
10. Privacy policy page
11. Terms of use page
12. Support page
13. 404 page
14. Design system
15. Components
16. Motion
17. Accessibility
18. SEO, metadata and structured data
19. Technical requirements and hosting
20. Assets
21. Things the site must never do
22. Placeholders to fill before launch
23. Acceptance checklist
24. Content pages: /calories/, /for/, /compare/, /blog/

---

## 1. What Slate is

Slate is a calorie journal for iPhone, built for urban Indians aged 24 to 35.

You type what you ate on a line, the way you'd say it ("2 roti aur ek katori dal", "masala dosa from Swiggy", "30 min jog"). Slate puts a number next to it. That is the core of the app, and everything else stays out of the way.

- **Positioning line:** A calorie journal that gets out of the way.
- **The name:** a slate is a flat grey stone you write on. Chalk on, wipe off. It has no opinion about what you wrote.
- **Who it's for:** people in Indian cities who eat home food, office canteen food, tiffin, street food and delivery in the same week, and who found Western calorie apps useless for dal, roti, sabzi and chai.
- **The problem it solves:** other apps have big food databases built around Western portions, and they don't know Indian households. A katori in one home is 150 ml and in another 250 ml. Rotis vary. Oil use varies hugely between families. Restaurant food carries far more oil than home food. Slate is built around those facts.
- **The one-sentence test (internal):** if a change makes Slate slower to open, slower to type into, or louder, it is wrong.

**What Slate is not:** a coach, a nutritionist, a diet plan, a wellness platform, a social network or a habit app. It never suggests a goal, never praises eating less and never criticises eating more.

**Platform:** iPhone only (iOS 17 and later). Available in India at launch. Age 18+. No Android, no web app.

---

## 2. Who makes Slate

- **Company:** Sonal Systems Private Limited
- **CIN:** U62099GJ2026PTC179785
- **Registered address:** A-3, Mehsana Nagar, Nizampura, Vadodara 390002, Gujarat, India
- **Founders:** Nirmal Amin and Nehal Amin
- **Based in:** Vadodara, Gujarat
- **Support email:** support@writeonslate.com
- **Privacy and grievance email:** privacy@writeonslate.com
- **Grievance Officer (DPDP Act):** Nirmal Amin (to be confirmed before launch, see §22)
- **Domain:** writeonslate.com

Never show a personal Gmail address anywhere on the site.

The founders sign the promises as: *Nirmal and Nehal, Sonal Systems, Vadodara*

---

## 3. Brand and voice

### 3.1 Principles (these shape every line of copy)

| Principle | What it means on the site |
|---|---|
| Instruments, not instructions | Slate shows numbers (BMR, baseline, measured maintenance). The user decides their own goal. The site never says "lose weight fast", "reach your goal" or anything that sounds like coaching. |
| Honest about being an estimate | The site says plainly that every number is an estimate, and explains why that's fine. |
| The household, not the database | The selling point is that Slate knows your katori, roti, oil and chai, not that it has a million foods. |
| Nothing between you and the line | No forms, no search boxes, no sign-up. The site should feel this way too: no pop-ups, no email capture, no cookie banner. |
| No login. No ads. No coaches. No sales calls. | Literal and permanent. |

### 3.2 Voice rules

- Calm, factual, plain. Short sentences. Sentence case everywhere, including headings and buttons.
- **Never use these words:** just, healthy, journey, great job, cheat, guilt-free, crush, smash, transform, burn fat, detox, superfood.
- **No exclamation marks. No em dashes in any visible copy. No emoji.**
- Never praise eating less. Never criticise eating more. No "good" or "bad" foods.
- Never suggest a goal, diet, plan, fast or target weight.
- Never make health claims ("lose 5 kg", "get fit", "clinically proven").
- Use Indian words naturally: katori, roti, chai, dal, poha, thali, sabzi, tiffin, Swiggy, Zomato. Hinglish examples are welcome.
- Units: "cals" next to numbers in UI-style displays, "calories" in sentences.
- Numbers: Indian grouping with Western digits where it applies (1,619 and ₹2,999). Always tabular figures.
- Prices always in rupees with the ₹ sign.

### 3.3 Distinctiveness (legal hygiene)

Slate shares a concept with other text-first calorie apps but must look and sound like itself. On the site, never use:

- A ring or donut progress chart, ringed circular buttons, or a floating summary card.
- Copy from competitor listings, including "as quickly as a notes app", "Hide calorie counts whenever you want", "Type anything, including exercise", "Want to be precise? Add detail", "Snap a food to get instant nutrition info", "Try it out".
- Competitor sample numbers: 790 / 2400, 1610 left, 32 g / 98 g / 27 g.
- Any competitor's name, except on the /compare/ pages, which follow the rules in the content pages section: factual, sourced, dated, no logos or screenshots, nothing disparaging, and an honest "where they fit better" section. Never name Mist.

---

## 4. How Slate works (product facts the site must get right)

Use these facts for copy. Don't invent features that aren't here.

### 4.1 Slate, the page you write on

**Naming.** Inside the app, the page you write on is called "Slate", not "journal": "your Slate", "write on Slate", "lines" (not "journal lines"). "Calorie journal" stays only as the description of what Slate is (the H1, title tags, meta descriptions, Open Graph, JSON-LD names and the App Store name), because that is what people search for.


- One page per day, titled "Today". You type a line and press return. The line shimmers briefly and a number settles next to it.
- One line can become several: "2 roti aur ek katori dal" becomes "2 roti" and "1 katori dal".
- Above the lines, a header shows food eaten today in cals, "X left" or "X over" against your goal, a thin progress bar, a connected macro bar (protein, carbs, fat), and a thin blue water bar.
- Over goal is shown as plain text ("210 over"). It never turns red and nothing is said about it.
- Tap any number to open its detail: calories, protein, carbs, fat, a portion row (½, 1, 1½, 2), an Outside / Made at home switch, and **How we got this**: every ingredient in grams, your kitchen adjustments in plain words, and the data source ("Estimated from IFCT 2017 values").
- Swipe left to delete. No confirmation, no red.
- Past days: pull down on the title to move between the last 30 days. Copy a line or a meal to today.

### 4.2 What you can write

| Type | Examples | Shows |
|---|---|---|
| Food | "1 plate poha", "2 roti aur ek katori dal", "masala dosa from Swiggy", "chai, less sugar", "half plate biryani" | A number in cals |
| Exercise | "30 min jog", "45 min badminton", "1 hour yoga" | A minus number in grey |
| Steps | "9000 steps" | A minus number for steps above 3,000 |
| Water | "2 glass water", "1 litre paani" | ✓. All water goes on one line per day ("Water 1,750 ml") that grows with each glass, and the water bar fills |
| Weight | "weight 72" | ✓, and the weight trend updates |
| Sleep (Plus) | "slept 7 hours" | ✓ |

Slate understands English, Hinglish and Gujarati-English spellings, quantities in words (ek, do, aadha, half), and preparation words ("less oil", "kam tel", "no sugar", "bina cheeni", "extra ghee", "half plate", "full plate").

If Slate can't recognise a line, it shows a grey ↻ and counts it as zero. **It never guesses a number.**

### 4.3 How a number is made (the engine)

This is a real differentiator and the site should explain it in plain words.

1. Slate reads the line and works out what it is: which dish, how much, and whether it was home or outside.
2. AI is used only for that reading step, and only when Slate's own matcher on the phone doesn't recognise the line. **The AI never produces a calorie number.** It can only point to dishes in Slate's own catalogue.
3. The number is calculated on the phone from food composition data (Indian Food Composition Tables, IFCT 2017) and dish recipes in grams, then adjusted for your kitchen.
4. The same line always gives the same number. Changing a setting later never rewrites past days.

### 4.4 Your kitchen (free)

Asked once, changeable any time:

- **Your katori:** 150, 200 or 250 ml.
- **Your roti:** 6, 8 or 10 inches.
- **Your oil:** a sentence: "A 1 litre bottle lasts us about 30 days, cooking for 4 people." Slate turns that into oil per person per day and spreads it across home-cooked dishes.
- **Your chai and coffee:** sugar (teaspoons) and milk (none, toned, full fat).

Home-cooked dishes use your kitchen. Outside food (restaurant, delivery, street food, canteen) uses more oil and a bigger portion than home food. Dishes usually eaten out (chole bhature, pav bhaji, biryani, pizza and similar) count as outside unless you switch them to "Made at home".

### 4.5 About you (free)

Optional questions that help Slate read your lines the way you mean them: diet (vegetarian, eggetarian, non-vegetarian, vegan, Jain), foods you avoid, fasting days, where you eat outside (office canteen, tiffin, restaurants, delivery, street food), your day (mostly sitting, some walking, on your feet), usual sleep, what you'd like to keep an eye on (protein, fiber, sugar, eating out, late-night snacking), and a short note on how you cook ("We cook with less oil than most. I use a small katori."). The note is turned into small, capped adjustments to home-cooked dishes. Slate never asks about health conditions or medication.

### 4.6 Your body, goals and measured maintenance

- **Your body:** age, sex, height, weight. Slate shows your BMR and your sedentary baseline. These update as your weight trend changes.
- **Your goal:** one number you type yourself. Slate never suggests one. It won't accept a goal below 1,200 calories.
- **Measured maintenance (Plus):** after about three weeks of logging and a few weigh-ins, Slate works out how many calories your body has actually been using each day, from what you logged and how your weight trend moved. Shown as: "Based on what you've logged and your weight trend, your body has been using about 2,180 cals a day." It's a measurement, not a target, and Slate doesn't turn it into a suggestion.
- **Weight trend:** a smoothed trend line through your weigh-ins, so one salty dinner doesn't look like a change.

### 4.7 Movement and connected apps

- Exercise lines use a standard formula based on activity, minutes and your weight.
- Steps count only above 3,000 a day (everyday movement is already in your baseline).
- If steps and a walk or run are logged the same day, only the larger counts, so nothing is counted twice.
- **Apple Health (Plus):** Slate reads steps, weight and workouts. Anything that writes to Apple Health works with Slate, including Apple Watch, Garmin Connect, Strava, Nike Run Club and Fitbit. When a workout comes from a watch with heart-rate data, Slate uses the watch's measured energy. Steps use Apple Health's combined total, so a watch and a phone aren't double counted.

### 4.8 Other features

| Feature | Free or Plus | Facts |
|---|---|---|
| Barcode scan | Free | Packaged foods via Open Food Facts. Only the barcode number is sent. |
| Label scan | Free | Reads the nutrition label on the phone. You confirm before it's added. |
| Photo logging | Plus | Take a photo of your plate. Slate spots each dish, you confirm the portions. Nothing is added until you confirm. The photo is never stored. |
| Voice logging | Plus | Tap the mic and speak the line, in English or Hinglish. Speech is turned into text on the iPhone, or by Apple's speech service where on-device recognition isn't available. You check the line and press return. Slate never receives or stores audio. |
| Delivery orders | Plus | Share a Swiggy or Zomato order to Slate, or paste it into a new line. The order text is read on the iPhone; fees and totals are dropped and each dish becomes its own line, counted as outside food. You check the list and tap Add. Slate never connects to those apps. |
| Chat about your day | Plus | Ask "Where did most of my calories come from?" Answers use only numbers Slate already calculated. No goals, diets or medical advice. |
| Stats | Plus | Summary, calories, macros, weight trend, water, movement, fiber, measured maintenance. Week, month, 3 months, year. |
| Widgets | Plus | Home and lock screen. Today's number and macros, plus a one-tap quick add that can be set to chai (default), coffee, a glass of water, any saved food or a custom line. |
| Siri | Free | "Log a chai in Slate". |
| Water | Free | Water goal, a blue bar, tap to add a glass. All water shows as one line per day ("Water 1,750 ml") that grows with each glass. |
| Reminders | Free | Two optional reminders, each at a time the user picks: "Remind me to write on Slate" (default 9 pm) and a daily "Remind me to weigh in" (default 7:30 am). Local notifications scheduled on the iPhone, no push service, no marketing. Skipped on days already logged. The weigh-in reminder is never shown to under-18s. |
| Streak | Free | Days logged in a row. Breaking it is silent. No flames, no badges. |
| History | Free for 30 days, Plus for older | |
| Hide calorie counts | Free | Removes every calorie number from the app, widgets and VoiceOver. Macros stay. |
| Custom dishes | Plus | Your own recipes ("Mummy's dal") with ingredients and yield. |
| Saved foods | Plus | Name a line and reuse it. |
| Fiber and sugar | Plus | |
| Sleep | Plus | |
| Export and delete | Free | JSON and CSV export, and full deletion, from Settings, any time. |
| Light and dark mode | Free | |

### 4.9 Safety rules (the site must not contradict these)

- 18+ only. Under-18s see no numbers, goals, chat or photo logging.
- No goal suggestions anywhere, including chat.
- No haptics, no celebrations, no streak pressure.
- Chat offers Tele-MANAS (14416) if someone describes disordered eating.
- Slate is not medical advice.

---

## 5. Free and Slate Plus

### 5.1 The rule

Slate is free forever. Slate Plus is optional. **Nothing that is free today will ever move behind Plus.** That is one of the four public promises.

### 5.2 Free (forever)

- Slate: food, exercise, weight, water and steps
- Writing in English, Hinglish and Gujarati spellings, including "less oil", "no sugar" and "half plate"
- Your kitchen: katori, roti, oil, chai and coffee
- About you and How you cook
- Outside or home, and portion changes on every line
- Barcode and label scanning
- Protein, carbs, fat and macro goals
- How we got this, for every number
- Your body: BMR and baseline that follow your weight
- Water, one line a day
- Reminders to write and to weigh in
- Streak and the last 30 days of history
- Siri: "Log a chai in Slate"
- Hide calorie counts, appearance and display options
- Export and delete your data
- What Slate won't do

### 5.3 Slate Plus

- Photo logging
- Voice logging
- Delivery orders from Swiggy and Zomato
- Chat about your day
- Measured maintenance
- Stats and weight trend
- Apple Health, with Apple Watch, Garmin, Strava, Nike Run Club and more
- Widgets with one-tap quick add
- Custom dishes
- Saved foods
- Fiber and sugar
- Sleep
- Full history beyond 30 days

### 5.4 Pricing (India)

| Plan | Price | Per week | Notes |
|---|---|---|---|
| Monthly | ₹399 a month | about ₹92 a week | |
| Yearly | ₹2,999 a year | about ₹58 a week | 37% less than paying monthly. 7 days free for eligible new subscribers. |

- Billing through Apple only. Cancel any time in iPhone Settings, at least 24 hours before renewal. Refunds through Apple.
- If Plus ends, nothing is deleted. Plus screens go back to free, history older than 30 days is hidden (not removed), and custom dishes still work.
- No discounts, countdowns, "limited time" or urgency copy anywhere.

---

## 6. Privacy and data (facts)

- **No login.** An anonymous account is created on the phone at install. No name, phone number, email, contacts, location or advertising ID is collected.
- **Stored in India:** Mumbai (Supabase, AWS ap-south-1). Each account can only read its own rows.
- **No ads, no ad SDKs, no tracking, no analytics at launch.** Nothing is sold or shared for marketing.
- **AI provider:** Anthropic (USA) reads lines Slate doesn't recognise, photos (Plus) and chat messages (Plus). Not used to train models. Photos are never stored.
- **Label scanning** happens on the phone. **Barcode scanning** sends only the barcode number to Open Food Facts.
- **Subscriptions:** RevenueCat (USA) holds subscription status only. Apple handles payment.
- **Apple Health (Plus):** read-only, only the types the user allows.
- **Export** (JSON and CSV) and **delete** (immediate, server-side) from Settings, free.
- **Retention:** data kept while the app is used; deleted on request (backups within 30 days); accounts inactive for 24 months are deleted; chat kept until cleared; server logs up to 1 year.
- **Law:** India's Digital Personal Data Protection Act 2023 and Rules. Sonal Systems is the Data Fiduciary.

---

## 7. Site map

| URL | Page |
|---|---|
| `/` | Home, a single long page with anchors |
| `/privacy/` | Privacy policy (linked from the app, required by Apple) |
| `/terms/` | Terms of use (linked from the app, required by Apple) |
| `/support/` | Support and FAQ, with the contact email (App Store support URL) |
| `/404.html` | Not found |
| `/calories/` | Calories in Indian food: every dish, grouped, with a search box (§24.2) |
| `/calories/<dish>/` | One page per dish, 70 dishes (§24.2) |
| `/for/` and 8 pages | Who Slate is for: Indian food, vegetarians, home cooking, eating out, Hinglish, no login, fasting days, office canteen and tiffin (§24.3) |
| `/compare/` and 4 pages | Slate compared with HealthifyMe, MyFitnessPal, Cal AI and Lose It! (§24.4) |
| `/blog/` and 6 articles | Articles by Nirmal Amin, Sonal Systems (§24.5) |

Home anchors: `#how`, `#write`, `#kitchen`, `#estimate`, `#body`, `#health`, `#more`, `#promise`, `#pricing`, `#faq`, `#about`.

Trailing-slash URLs. `www.writeonslate.com` redirects to `writeonslate.com`. HTTP redirects to HTTPS.

---

## 8. Home page, section by section, with copy

Each section is separated by a hairline divider and generous vertical space (96 to 128 px desktop, 64 to 80 px mobile). Max content width 1120 px. Section headings are large display type.

### 8.1 Header

- Left: wordmark "Slate" (Inter Tight 700, tracking −0.03em), links to `/`.
- Right nav (text links): Your kitchen (`#kitchen`) · Pricing (`#pricing`) · Our promise (`#promise`).
- Mobile: under 420 px wide, hide "Your kitchen". No hamburger menu.
- Not sticky. No shadow.

### 8.2 Hero

Two columns on desktop (copy left, demo right), stacked on mobile (copy first).

- **H1:** A calorie journal that gets out of the way.
- **Lede:** Type what you ate, the way you'd say it. Slate puts a number next to it. That's the whole app.
- **Primary button:** "Coming soon to iPhone" (disabled look but readable; becomes the official "Download on the App Store" badge linking to the App Store URL once live, see §22).
- **Secondary button:** "What Slate won't do" → `#promise`.
- **Small note under the buttons:** Free forever. No login. Stored in India. Slate Plus is optional.
- **Right:** the interactive journal demo (§9).

### 8.3 How it works (`#how`)

- **Heading:** Three things happen.
- Three columns (stacked on mobile), each with a number in large tabular type, a title and one sentence:
  1. **You write a line.** "2 roti aur ek katori dal", the way you'd say it out loud.
  2. **Slate works it out.** Your katori, your roti, your oil. Not someone else's.
  3. **Tap to see how.** Every number shows its ingredients, grams and adjustments.

### 8.4 Write it the way you'd say it (`#write`)

- **Heading:** Write it the way you'd say it.
- **Lede:** Hinglish, Gujarati spellings, half katoris, "from Swiggy", "kam tel". Exercise, steps, water and weight go on the same page. No search box, no dropdowns, no forms.
- A static journal-style list (not interactive), number right-aligned, tabular:

| Line | Number |
|---|---|
| 2 roti | 220 |
| 1 katori dal | 160 |
| 1 plate poha | 270 |
| Masala dosa from Swiggy | 450 |
| Chai, less sugar | 64 |
| 30 min jog | −250 (grey) |
| 9000 steps | −270 (grey) |
| Water 500 ml | ✓ |
| Weight 72 | ✓ |

- Under it, small grey text: If Slate doesn't recognise something, it shows ↻ and counts it as zero. It never guesses.
- Below that, two short lines in small muted text, each followed by a Plus badge:
  - Or say it. Tap the mic and speak the line, Hinglish included.
  - Ordered in? Share a Swiggy or Zomato order to Slate and each dish lands as its own line.

### 8.5 Your kitchen, not a database (`#kitchen`)

- **Heading:** Your kitchen, not a database.
- **Lede:** Every other app has more food entries. None of them know how big your katori is, or how long a litre of oil lasts your family. Slate asks four questions, once.
- Four cards in a 4-column grid (2×2 on tablet, 1 column on mobile), each with a line icon, title and one line:
  - **Your katori.** 150, 200 or 250 ml.
  - **Your roti.** 6, 8 or 10 inches.
  - **Your oil.** "A litre lasts us 30 days, for 4 people."
  - **Your chai.** Sugar and milk, for chai and coffee.
- Below the cards, a two-column block:
  - Left, **Home or outside.** Restaurant and delivery food carries more oil and bigger portions than home food. Slate counts them differently, and you can switch any line with one tap.
  - Right, **About you.** Tell Slate how you eat: vegetarian or Jain, fasting days, tiffin or canteen, how you cook. It reads your lines the way you mean them.
- Footer line in small grey text: All of this is free, for everyone.

### 8.6 Every number here is an estimate (`#estimate`)

- **Heading:** Every number here is an estimate.
- **Body:** Packet labels can be 20% out. Restaurant oil can be more. Slate is built to be consistent, so your week tells the truth even when a single day is rough.
- **Second paragraph:** Numbers are worked out from the Indian Food Composition Tables (IFCT 2017) and adjusted for your kitchen. AI only reads what you wrote. It never makes up a calorie.
- **Third paragraph:** Slate reads your line and works out the dish, how much, and whether it was made at home or outside. The number is then calculated on your phone from the Indian Food Composition Tables (IFCT 2017) and dish recipes in grams. Home-cooked dishes use your kitchen: your katori (150, 200 or 250 ml), your roti (6, 8 or 10 inches), how long a bottle of oil lasts your family, and how you take your chai. Outside food uses more oil and a bigger portion. The same line always gives the same number. If Slate can't recognise a line, it counts it as zero. It never guesses.
- **Visual:** a static replica of the "How we got this" sheet as a card:
  - Title: "2 roti" · "220 cals"
  - Connected macro bar (teal, turmeric, plum) and "Protein 7 g · Carbs 40 g · Fat 4 g"
  - "How we got this"
  - Whole wheat flour (atta) · 60 g
  - Your roti: 8 inches
  - Ghee on top: none
  - Small grey line: Estimated from IFCT 2017 values
- Caption: Tap any number in the app to see exactly how it was worked out.

(Illustrative values only. Keep them internally consistent: 60 g atta ≈ 200 cals, plus a little for dry flour. Do not reuse competitor sample numbers.)

### 8.7 Instruments, not instructions (`#body`)

- **Heading:** Instruments, not instructions.
- **Lede:** Slate shows you the numbers. You decide what to do with them.
- Three cards:
  - **Your baseline.** Your BMR and the calories you'd use on a quiet day, worked out from your body. They update as your weight trend moves, and Slate tells you when they've changed.
  - **Your goal.** One number you type yourself. Slate never suggests one, and never praises you for eating less.
  - **Measured maintenance** (Plus badge). After about three weeks of logging and a few weigh-ins, Slate works out what your body has actually been using each day. Example inside the card in large tabular type: "about 2,180 cals a day", and below it in small grey: Based on what you've logged and your weight trend.
- Below: a simple static weight chart (SVG): about 30 grey dots for weigh-ins and one smooth ink trend line through them, no axes labels except "kg" values at start and end. Caption: One salty dinner isn't a change. The trend line shows what is.

### 8.8 Works with what you wear (`#health`)

- **Heading:** Works with what you wear.
- **Lede:** Slate reads Apple Health, so anything that writes to Health works with Slate.
- A simple text row (no logos): Apple Watch · Garmin Connect · Strava · Nike Run Club · Fitbit · most gym apps
- Two short points:
  - **Measured, when it can be.** If your watch measured a workout, Slate uses the watch's number. If not, it estimates from minutes and your weight, and tells you which.
  - **Never counted twice.** Steps use Apple Health's combined total, and a walk logged alongside steps counts once.
- Plus badge next to the heading.
- Footnote, tiny grey: Apple Watch and Apple Health are trademarks of Apple Inc. Other names are trademarks of their owners. Slate is not affiliated with them.

### 8.9 The rest of the app (`#more`)

- **Heading:** Everything else is small and quiet.
- A grid of 15 small tiles (3 columns desktop, 2 tablet, 1 mobile). Each tile: line icon, title, one sentence, and a Plus badge where relevant.
  - **Voice logging** (Plus). Say what you ate. Slate writes the line, you press return. (Icon: microphone.)
  - **Delivery orders** (Plus). Share a Swiggy or Zomato order. Fees and totals are dropped, each dish counts as outside food. (Icon: receipt.)
  - **Photo logging** (Plus). Take a photo of your plate. Slate spots each dish, you confirm the portions. The photo isn't kept.
  - **Chat about your day** (Plus). Ask where your calories came from. It answers from your own Slate, nothing else.
  - **Scan a packet.** Barcode or nutrition label. Labels are read on your phone.
  - **Water.** One line a day that grows with each glass, and a thin blue bar.
  - **Reminders.** A nudge to write on Slate, and one to weigh in, at the times you pick. Skipped on days you've already logged. (Free. Icon: bell.)
  - **Widgets** (Plus). Today's number on your home screen, and a one-tap button for chai, water or any food you choose.
  - **Siri.** "Log a chai in Slate."
  - **Stats** (Plus). Calories, macros, weight trend, water and movement, by week, month or year.
  - **Custom dishes** (Plus). Mummy's dal, with your recipe and your katori.
  - **Hide calorie counts.** Keep your Slate and the macros, without a single calorie number.
  - **Streak.** Days in a row. Breaking it is silent.
  - **Light and dark.** Follows your phone.
  - **Export and delete.** All of it, any time, from Settings.

### 8.10 What Slate won't do (`#promise`)

- **Heading:** What Slate won't do
- The four promises, word for word, as large rows (display weight, around 32 to 40 px) separated by hairlines, numbered 1 to 4 in muted tabular figures:
  1. Show you ads.
  2. Move anything that's free today behind Plus.
  3. Sell or share your data.
  4. Call you, coach you, or sell you a plan.
- Signature, italic or muted: Nirmal and Nehal, Sonal Systems, Vadodara
- Supporting line: No login. Your Slate is stored in India, and you can export or delete all of it from Settings, any time.

### 8.11 Pricing (`#pricing`)

- **Heading:** Free forever. Plus if you want it.
- Two cards side by side (stacked on mobile), equal height:
  - **Slate**: "Free" in large type, "Forever" small under it. List exactly as §5.2.
  - **Slate Plus**: "₹399 a month" and "or ₹2,999 a year" in large type. Small grey: "about ₹92 a week, or ₹58 a week yearly". Badge: "7 days free on yearly". List exactly as §5.3. Above the list: "Everything in Slate, plus:".
- Both cards stay equal height. The Plus list keeps the exact order of §5.3.
- No "most popular" ribbon, no strike-through prices, no countdown.
- Note under the cards: Purchases and refunds go through Apple. Cancel any time from your iPhone's Settings. If Plus ends, nothing is deleted.

### 8.12 FAQ (`#faq`)

Use native `<details>`/`<summary>` accordions. All closed by default. Heading: "Things people ask". The FAQPage JSON-LD must match this copy word for word. Exact copy:

1. **Is Slate really free?** Yes. Your Slate, your kitchen, scanning, macros and How we got this are free forever, and we've promised never to move a free feature behind Plus. Slate Plus adds photo and voice logging, delivery orders, chat, stats, measured maintenance, Apple Health, widgets and more.
2. **Do I need an account?** No. There's no login, email or phone number. Slate creates an anonymous account on your phone.
3. **Where is my data stored?** In Mumbai, India. Nobody else can see your Slate, and you can export or delete all of it from Settings.
4. **How accurate are the numbers?** They're estimates, like every calorie number. Slate uses Indian food composition data and adjusts for your katori, roti, oil and chai, so the numbers are consistent. Tap any number to see how it was worked out.
5. **Is Slate a calorie counter for Indian food?** Yes, written as a journal. You type what you ate the way you'd say it, in English or Hinglish, and Slate counts the calories, protein, carbs and fat for each line using Indian food composition data.
6. **Does Slate use AI?** Only to read lines it doesn't recognise, to spot dishes in a photo, and for chat. The AI never produces a calorie number. Your Slate isn't used to train AI models.
7. **Will Slate tell me what my goal should be?** No. Slate shows your BMR, your baseline and, with Plus, your measured maintenance. The goal is yours to set.
8. **Does it work with Apple Watch, Garmin or Strava?** Yes, with Slate Plus, through Apple Health. If an app writes to Apple Health, Slate can read it.
9. **Can I write in Hinglish or Gujarati?** Yes. "2 roti aur ek katori dal", "kam tel", "bina cheeni" and Gujarati spellings all work. The app itself is in English for now.
10. **Can I speak instead of typing?** Yes, with Slate Plus. Tap the mic, say the line in English or Hinglish, check it and press return. Slate doesn't keep any audio.
11. **Can I log a Swiggy or Zomato order?** Yes, with Slate Plus. Share or paste the order to Slate, check the list, and each dish is added as outside food. Slate only reads what you share. It never connects to those apps.
12. **Is there an Android version?** No. Slate is made for iPhone.
13. **How do I cancel Slate Plus?** In your iPhone's Settings, under your name, then Subscriptions. Cancel at least 24 hours before it renews. Nothing on your Slate is deleted.
14. **Will Slate send me notifications?** Only if you turn them on. You can choose a daily nudge to write on Slate and one to weigh in, each at a time you pick. Nothing else, and no marketing.
15. **Who can use Slate?** Anyone 18 or older. Slate isn't built for under-18s.
16. **Is Slate medical advice?** No. If you have a medical condition, or your relationship with food feels hard, talk to a doctor. In India, Tele-MANAS is free and available any time on 14416.

### 8.13 Who makes Slate (`#about`)

- **Heading:** Made in Vadodara.
- **Body:** Slate is made by Sonal Systems, a small company in Vadodara. We built it because every calorie app we tried knew a lot about bagels and very little about a katori of dal. We don't run ads, we don't sell data, and we don't have a sales team.
- Signature: Nirmal and Nehal
- Contact line: Write to us at support@writeonslate.com. A person reads every email.

### 8.14 Closing call to action

- Large centred line: Open it. Write a line. Close it.
- Button: same as the hero primary button.
- Small note: Free forever. iPhone, in India.

### 8.15 Footer

- Left: wordmark "Slate", then "Sonal Systems Private Limited", "A-3, Mehsana Nagar, Nizampura, Vadodara 390002, Gujarat, India", "CIN U62099GJ2026PTC179785".
- Right, links: Food calories · Who Slate is for · Compare · Blog · Privacy policy · Terms · Support · support@writeonslate.com. The build keeps this list the same on every page, from data/site.json (§24.6).
- Bottom line, small: © 2026 Sonal Systems Private Limited. Apple, the Apple logo, iPhone and Apple Watch are trademarks of Apple Inc. Swiggy and Zomato are trademarks of their owners. Slate is not affiliated with them. (Text only, no logos.)

---

## 9. The interactive journal demo

A card (`surface` colour, radius 24, the one card shadow) in the hero that behaves like the app's journal. It must work with no network calls and no API keys.

### 9.1 Layout

- Top: "Today" (title weight).
- Total in large tabular type with a small "cals" suffix. Right side, one line in muted text: "X left" or "X over" against a demo goal of 2,000.
- A thin ink progress bar (eaten ÷ goal, capped at full, same colour when over).
- A connected macro bar: three segments side by side with 3 px gaps, widths proportional to the goal in calories (protein 90 g × 4, carbs 250 g × 4, fat 60 g × 9). Each segment fills toward its goal. Labels under the segments: "Protein 12 of 90 g" and so on, small and muted. Over goal stays the same colour, shown full.
- A thin water row under it: 4 px bar in water blue, with "0 of 2,500 ml" in small muted text. It always matches the water line.
- Then the lines, then the input.

### 9.2 Starting state

| Line | Number |
|---|---|
| 1 plate poha | 270 |
| 1 cup chai | 72 |
| 30 min jog | −250 (muted, leading minus) |

Water starts at 0 ml, with no water line.

### 9.3 Input and chips

- Input with placeholder "What did you have?" and a visually hidden label "Write a line".
- On Enter: split the text on " aur ", " and ", ",", "+" into separate lines. A piece after a comma that holds only modifiers or outside words ("kam cheeni", "less oil", "from swiggy") stays on the line before it, so "chai, kam cheeni" is one line. Each new line shows the shimmer for about 650 ms, then the number settles (fades in, rises 4 px).
- A leading quantity word of 1 or more is written back as a digit, the way the app does: "ek katori dal" shows as "1 katori dal". "half" and "aadha" stay as written.
- Below the input, small muted text "Try one, then press return:" and chips: "2 roti aur ek katori dal", "vada pav from swiggy", "chai, kam cheeni", "9000 steps", "2 glass water". Tapping a chip puts its text into the input and submits it, then removes the chip.
- Every line can be deleted, including the starting lines, with a small × that appears on hover/focus (and is always visible on touch). No confirmation.
- Max 12 lines; after that, the oldest user line is removed.

### 9.4 The demo dictionary (illustrative, keep it small)

Per one unit:

| Item and aliases | Unit | Cals | P / C / F (g) |
|---|---|---|---|
| roti, chapati, phulka | 1 roti | 110 | 3.5 / 20 / 2 |
| dal | 1 katori | 160 | 9 / 22 / 4 |
| rice, chawal | 1 katori | 200 | 4 / 44 / 0.5 |
| rajma | 1 katori | 210 | 10 / 28 / 6 |
| poha | 1 plate | 270 | 5 / 45 / 8 |
| upma | 1 plate | 250 | 6 / 38 / 8 |
| idli | 1 idli | 60 | 2 / 12 / 0.3 |
| dosa, masala dosa | 1 dosa | 360 | 7 / 50 / 14 |
| vada pav | 1 | 300 | 7 / 40 / 13 |
| samosa | 1 | 260 | 4 / 26 / 16 |
| dhokla | 1 plate (4 pcs) | 160 | 6 / 26 / 4 |
| thepla | 1 | 120 | 3 / 16 / 5 |
| khichdi | 1 katori | 220 | 7 / 36 / 5 |
| pav bhaji | 1 plate | 400 | 9 / 50 / 18 |
| biryani | 1 plate | 450 | 15 / 55 / 18 |
| paneer, paneer sabzi | 1 katori | 280 | 12 / 10 / 21 |
| egg, anda | 1 | 78 | 6 / 0.6 / 5 |
| banana, kela | 1 | 105 | 1.3 / 27 / 0.4 |
| chaas, buttermilk | 1 glass | 40 | 2 / 5 / 1 |
| chai | 1 cup | 72 | 2 / 9 / 3 |
| coffee | 1 cup | 90 | 3 / 10 / 4 |

- **Quantity words:** a number, or ek/one 1, do/two 2, teen/three 3, char/four 4, half/aadha 0.5, dedh 1.5. Default 1.
- **Units in text** ("katori", "plate", "cup", "glass", "piece", "pcs") are accepted and ignored for the maths.
- **Outside keywords** (swiggy, zomato, restaurant, canteen, dhaba, cafe, outside, ordered, hotel): multiply cals and fat by 1.25 and show the number. In the line, nothing else changes.
- **Modifiers:** "less oil", "kam tel" multiply fat by 0.6 (recompute cals as P×4 + C×4 + F×9, rounded); "no sugar", "bina cheeni" on chai or coffee subtract 32; "kam cheeni", "less sugar" subtract 8 (so "chai, less sugar" is 64, matching §8.4); "half plate" multiplies by 0.5.
- **Exercise per minute:** jog/run 8.34 (so 30 minutes reads 250), walk 4.5, yoga 3, gym/weights 4.2, cycling 7, badminton 5.5, cricket 5. Parse "30 min", "45 minutes", "1 hour", "1 hr". An exercise line without a duration ("jog") shows ↻ and counts as 0; the demo never guesses minutes. Show as a muted negative number. Exercise doesn't change macros.
- **Steps:** "9000 steps" → −round((steps − 3,000) × 0.045), minimum 0.
- **Water:** "glass" = 250 ml, "litre/liter" = 1,000 ml, "ml" as given; aliases water, paani, pani. Like the app, all water goes on one line per day: the first water entry creates "Water 500 ml" (for "2 glass water"), and every later entry adds to that same line ("Water 1,000 ml") instead of making a new one. The line shows ✓, briefly shimmers when it grows, and the water bar stays in sync with it. Deleting the line removes all water.
- **Weight:** "weight 72", "72 kg" → ✓.
- **Unknown:** grey ↻ and 0. Never guess.
- Round all displayed numbers to whole numbers. Use tabular figures and Indian grouping (1,234).

### 9.5 Maths

- Eaten = sum of food lines.
- Burn = sum of exercise and steps lines.
- Left = goal − eaten + burn. If negative, show "N over" in the same muted colour. Never red.
- Progress bar uses eaten ÷ goal.

### 9.6 Behaviour

- `aria-live="polite"` region announces each added line as one sentence: "2 roti, 220 calories."
- `prefers-reduced-motion`: no shimmer movement (a static faint fill instead), numbers appear instantly.
- No storage, cookies or network requests. Reloading resets the demo.

---

## 10. Privacy policy page (`/privacy/`)

Long-form reading layout (max width about 680 px), H1 "Privacy policy", "Effective 8 October 2026" (update to the real launch date), then a short-version summary card, then numbered sections. Same header and footer as the home page.

### 10.1 Short version card (exact copy)

- No login. We don't collect your name, phone number, email, contacts or location.
- Your Slate is stored in Mumbai, India.
- No ads, no tracking, and we never sell or share your data.
- AI reads only what it needs to (unrecognised lines, photos you take, chat) and isn't trained on your Slate.
- You can export or delete everything from Settings, any time.

### 10.2 Sections the policy must cover

1. **Who we are.** Sonal Systems Private Limited, CIN, address. We are the Data Fiduciary under India's Digital Personal Data Protection Act 2023 (DPDP Act).
2. **What we collect.**
   - Your body: age or date of birth, sex, height, weight.
   - Goals: calorie and macro goals.
   - Your kitchen and About you: katori, roti, oil, chai and coffee settings; optional answers on diet, foods avoided, fasting days, where you eat outside, your day, sleep, what you'd like to keep an eye on; the How you cook note. Note that diet and fasting answers can reveal beliefs or practices, are optional, and are used only to read your lines and as context in chat.
   - Your Slate: every line you write and the numbers Slate calculated, water, steps, exercise, weight, sleep.
   - Things Slate works out: BMR, baseline, weight trend, measured maintenance.
   - Saved foods and custom dishes.
   - Chat messages (Plus).
   - Photos (Plus): processed to identify dishes and not stored.
   - Voice logging (Slate Plus): your speech is turned into text on your iPhone, or by Apple's speech service where on-device recognition isn't available. Slate never receives or stores audio, only the text line you choose to add.
   - Delivery orders (Slate Plus): order text you share or paste is read on your iPhone to make lines. Only the lines you add are stored, like any other line.
   - Apple Health (Plus, only if you allow it): steps, weight, workouts, and the name of the app that recorded them.
   - An anonymous account ID, subscription status, AI usage counts, and technical logs (errors, timestamps).
   - Reminders: add a short paragraph at the end of this section: "Reminders are scheduled on your iPhone as local notifications. Slate doesn't use a push service and doesn't send marketing notifications."
3. **What we don't collect.** Name, phone, email (unless you write to us), contacts, location, advertising ID, browsing data. Label scanning happens on your phone. Barcode scanning sends only the barcode number to Open Food Facts.
4. **Why we use it.** To calculate and show your numbers, sync your Slate, read your lines, run Plus features, enforce fair-use limits, keep the service working and secure, and answer support emails. Nothing else.
5. **Consent and withdrawing it.** Given at onboarding; withdraw by deleting your data in Settings. Apple Health access can be turned off any time in iPhone Settings.
6. **What we never do.** No ads, no selling, no sharing for marketing, no profiling for third parties, no training AI models on your Slate.
7. **Processors and where data goes.** Table:

| Processor | Purpose | Location |
|---|---|---|
| Supabase | Database, storage, server functions | Mumbai, India |
| Anthropic | Reading unrecognised lines, photo dish recognition, chat (not used for training) | USA |
| RevenueCat | Subscription status | USA |
| Apple | Payments, Apple Health, Siri | As per Apple |
| Apple | Speech recognition for voice logging, where on-device isn't available | As per Apple |
| Open Food Facts | Barcode lookup (barcode number only) | France |

   Cross-border transfer note: limited, purpose-bound transfers to the USA for the services above, as permitted under the DPDP Act.
8. **How long we keep it.** As in §6. Deletion is immediate; backups cleared within 30 days; inactive 24 months → deleted; chat until you clear it; photos not kept; logs up to 1 year; subscription records stay with your Apple ID.
9. **Your rights.** Access and export, correction, erasure, withdrawing consent, nominating someone, grievance redressal, and complaining to the Data Protection Board of India. How to use each (most are in Settings; otherwise email privacy@writeonslate.com). We reply within 30 days.
10. **Children.** Slate is for people 18 and older. If we learn an account belongs to someone under 18, we delete it.
11. **Security.** Encryption in transit, row-level security, least access, breach notification to you and the Board as the law requires.
12. **Changes to this policy.** Posted here with a new effective date; material changes shown in the app.
13. **Grievance Officer and contact.** Nirmal Amin (placeholder), privacy@writeonslate.com, postal address.

Not yet published: under "What we don't collect", keep this paragraph as an HTML comment only, marked `<!-- TODO(launch): publish when the shared packet list ships -->`: "If you scan a packet Slate doesn't know, the product's nutrition facts (barcode, name, brand and values per 100 g, never anything about you) are added to Slate's shared packet list so the next scan works."

Counsel must review before launch. Add an HTML comment at the top of the page: `<!-- Draft. Counsel review required before launch. -->`

---

## 11. Terms of use page (`/terms/`)

Same layout as the privacy page. H1 "Terms of use", effective date, short summary card, numbered sections.

### 11.1 Short version card

- You must be 18 or older.
- Slate gives estimates, not medical advice.
- Slate is free. Slate Plus is an optional Apple subscription you can cancel any time.
- Free features will never move behind Plus.

### 11.2 Sections

1. **Who we are.** Company name, CIN, address, contact.
2. **Who can use Slate.** 18+. One person per account.
3. **Not medical advice.** Every number is an estimate. Not for diagnosing or treating anything. Talk to a doctor for medical conditions, pregnancy, or if eating feels hard. Tele-MANAS 14416.
4. **Your account.** Anonymous, tied to your phone. If you delete the app without exporting your Slate first, it may not be recoverable. Export advice.
5. **Slate Plus.** Prices (₹399 a month, ₹2,999 a year), 7-day free trial on yearly for eligible new subscribers, auto-renewal, cancel at least 24 hours before renewal in iPhone Settings, refunds by Apple under Apple's policies, prices may change with notice through Apple, free features never move behind Plus, what happens when Plus ends, fair-use daily limits on AI features (unrecognised lines 300, photos 25, chat 40 a day).
6. **AI features.** Can be wrong. Always check what's added to your Slate. The AI never sets calorie values.
7. **Acceptable use.** No abuse, scraping, reverse engineering, overloading, or misuse of AI features.
8. **Third-party services.** Apple, Apple Health, Open Food Facts, connected apps; their own terms apply.
9. **Your content and our IP.** You own your Slate. You give us a licence only to process it to run Slate. We own the app, the name and the data tables.
10. **Apple terms.** Apple-required EULA terms: these terms are between you and Sonal Systems, not Apple; Apple isn't responsible for the app or support; Apple has no warranty obligation beyond refunding the price; Apple isn't responsible for claims; Apple and its subsidiaries are third-party beneficiaries; you confirm you're not in an embargoed country or on a prohibited list.
11. **Disclaimers.** Provided as is, to the extent the law allows.
12. **Limit of liability.** Capped at fees you paid in the last 12 months. Consumer rights under Indian law are not affected.
13. **Ending use.** You can stop and delete your data any time. We may suspend accounts that break these terms.
14. **Changes.** Posted here with notice in the app for material changes.
15. **Law and courts.** Indian law; courts at Vadodara, Gujarat.
16. **Contact.** support@writeonslate.com, postal address.

Counsel review comment at the top, as for privacy.

---

## 12. Support page (`/support/`)

Apple needs a support URL. Keep it short.

- H1: Support
- Lede: Write to support@writeonslate.com. A person reads every email, usually within two working days.
- Then the same FAQ as §8.12, plus:
  - **How do I restore Slate Plus on a new phone?** Open the paywall from Settings and tap Restore purchases, signed in with the same Apple ID.
  - **How do I export my Slate?** Settings, Your data, Export your data. You get JSON and CSV files.
  - **How do I delete everything?** Settings, Your data, Delete my data. It's immediate.
  - **A line shows ↻.** Slate didn't recognise it and counted it as zero. Tap the line to rewrite it, or tap ↻ to try again.
  - **How do I log a delivery order?** In the Swiggy or Zomato app, share the order details and pick Slate, or copy them and paste into a new line. Check the list and tap Add. This needs Slate Plus.
  - **Why isn't the mic working?** Slate needs microphone and speech recognition access. Turn them on for Slate in your iPhone's Settings. Voice logging needs Slate Plus.
  - **How do I set reminders?** Settings, Notifications. Turn on either reminder and pick a time. If nothing arrives, check that notifications are allowed for Slate in your iPhone's Settings.
- Privacy questions: privacy@writeonslate.com.

---

## 13. 404 page

- Centred. Large display text: Nothing written here.
- Below: a link "Back to Slate" → `/`.
- Same header and footer.

---

## 14. Design system

Use these tokens exactly, as CSS custom properties on `:root`, with dark values under `@media (prefers-color-scheme: dark)`. Set an explicit `background` on `body`.

### 14.1 Colours

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F7F7F5` | `#0E0F11` | Page background |
| `--surface` | `#FFFFFF` | `#191A1D` | Cards, demo |
| `--fill` | `#EFEFEC` | `#232428` | Tracks, chips, secondary buttons |
| `--ink` | `#111214` | `#F5F5F3` | Text, primary buttons, progress bar |
| `--ink-mute` | `#6E6F74` | `#9A9BA1` | Secondary text on the web (meets 4.5:1) |
| `--hairline` | `#E3E3DF` | `#2B2C30` | Dividers, card borders |
| `--accent` | `#3E5C9E` | `#7C97D6` | Plus badge, focus rings, shimmer only |
| `--protein` | `#2E7D72` | `#4FA596` | Protein segment |
| `--carbs` | `#C9962B` | `#DDB04F` | Carbs segment |
| `--fat` | `#7B4B8A` | `#A77BB6` | Fat segment |
| `--water` | `#3B82C4` | `#6AA8E0` | Water bar |

Rules: no colour splashed across sections. No gradients except the shimmer. Over goal never changes colour. Accent is used only for the Plus badge, focus rings and the shimmer.

### 14.2 Typography

- **Inter Tight**, self-hosted (`/assets/fonts/`, latin and latin-ext subsets so ₹ renders), `font-display: swap`. Weights 400, 500, 700, 800. No Google Fonts request.
- `font-feature-settings: "tnum"` on `body`, so every number is tabular.
- Display (H1): clamp(44px, 7vw, 84px), weight 800, letter-spacing −0.035em, line-height 1.02.
- Section headings (H2): clamp(32px, 4.5vw, 56px), weight 800, letter-spacing −0.03em, line-height 1.05.
- H3: 22 to 24 px, weight 700.
- Body: 18 px, line-height 1.55. Small: 15 px. Labels: 13 px, weight 500.
- Max line length for body text: about 62 characters.

### 14.3 Spacing, radius, shadow

- Base unit 4 px. Side gutters 24 px on mobile, 40 px on desktop.
- Radius: cards 24 px, small tiles 20 px, chips and buttons 999 px (pills).
- One shadow, cards only: `0 2px 24px rgba(17,18,20,0.06)` (dark mode: none, use a hairline border instead).

---

## 15. Components

- **Primary button:** pill, `--ink` fill, `--bg` text, 56 px tall, 500 weight, 17 px. One per view.
- **Secondary button:** pill, `--fill` background, `--ink` text.
- **Disabled "Coming soon" button:** primary style at 100% opacity with a small muted note; not visually broken.
- **App Store badge:** Apple's official black badge (and white for dark mode) once live, from Apple's marketing guidelines, unmodified.
- **Plus badge:** small pill, "Plus", accent text on accent at 10% opacity, 12 px, weight 500.
- **Card:** `--surface`, radius 24, padding 28 to 32 px, the one shadow.
- **Hairline divider:** 1 px `--hairline`, full content width.
- **Journal line:** text left, number right, tabular, rows at least 48 px, hairline between rows. Exercise and steps in `--ink-mute` with a leading "−". ✓ for water and weight. ↻ in muted for unknown.
- **Connected macro bar:** three segments, 3 px gaps, 6 px tall, rounded ends on the outer edges only, `--fill` tracks.
- **Icons:** simple line icons, 1.5 px stroke, 24 px grid, rounded caps, `currentColor`. Inline SVG. Needed: katori (bowl), roti (circle with texture), oil bottle, cup, camera, chat bubble, barcode, water drop, widget square, microphone, chart, recipe card, eye-off, flame-free streak (use a calendar), sun/moon, download.
- **Accordion (FAQ):** native `<details>`, summary 20 px weight 500, a plus that rotates to a cross, hairline between items.

---

## 16. Motion

Three animations, no more:

1. **Shimmer** under a demo line that's resolving: a gradient sweep `transparent → #7FBFA8 at 12% opacity → #3E5C9E at 18% → transparent`, about 650 ms, ease-out.
2. **Number settle:** fade in and rise 4 px, about 180 ms.
3. **Accordion open:** height and opacity, about 200 ms.

No scroll-triggered animations, no parallax, no auto-playing anything, no carousels. Respect `prefers-reduced-motion` everywhere.

---

## 17. Accessibility

- WCAG 2.1 AA. Contrast at least 4.5:1 for body text, 3:1 for large text and UI.
- Semantic landmarks: `header`, `nav`, `main`, `section` with headings, `footer`.
- One H1 per page. Logical heading order.
- Every interactive element reachable by keyboard, with a visible focus ring (2 px `--accent`, 2 px offset).
- Tap targets at least 44 × 44 px.
- Demo input has a label; additions announced via `aria-live`.
- Icons decorative (`aria-hidden="true"`) unless they carry meaning.
- Text resizes to 200% without loss.
- Language: `<html lang="en-IN">`.

---

## 18. SEO, metadata and structured data

### 18.1 Per page

| Page | `<title>` | Meta description |
|---|---|---|
| Home | Slate: a calorie journal for Indian food, on iPhone | Type or say what you ate, the way you'd say it. Slate knows your katori, roti, oil and chai. Free forever, no login, stored in India. For iPhone. |
| Privacy | Privacy policy · Slate | How Slate handles your data: no login, stored in India, no ads, never sold. |
| Terms | Terms of use · Slate | The terms for using Slate and Slate Plus. |
| Support | Support · Slate | Help with Slate and Slate Plus. Write to support@writeonslate.com. |

### 18.2 Every page

- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Canonical URL.
- Open Graph and Twitter card: title, description, `og:image` (1200 × 630, see §20), `og:locale` `en_IN`, `og:site_name` Slate.
- `<meta name="theme-color">` for light (`#F7F7F5`) and dark (`#0E0F11`).
- Favicon (32 px PNG and SVG) and `apple-touch-icon` (180 px) from the app icon.
- Once live: `<meta name="apple-itunes-app" content="app-id=XXXXXXXXXX">` for the Smart App Banner.

### 18.3 Structured data (JSON-LD on the home page)

- `Organization`: name, legal name, url, email, address, founders.
- `SoftwareApplication` (or `MobileApplication`): name "Slate: Calorie Journal", operatingSystem "iOS 17 or later", applicationCategory "HealthApplication", offers: free (price 0, INR) and Slate Plus monthly 399 INR, yearly 2999 INR.
- `FAQPage` built from §8.12.

### 18.4 Other

- `robots.txt` allowing all, pointing to `sitemap.xml`.
- `sitemap.xml` with every page. `node scripts/build.mjs` regenerates the /calories/, /for/, /compare/ and /blog/ entries with their lastmod dates.
- Natural keyword use in copy (not stuffed): calorie counter for Indian food, calorie journal, Indian food calories, katori, roti, dal, Hinglish.

---

## 19. Technical requirements and hosting

- **Stack:** static site. Plain HTML, CSS and a small amount of vanilla JavaScript is preferred. Astro with static output is acceptable. No framework runtime shipped to the browser unless needed for the demo, and the demo shouldn't need one.
- **No backend, no forms, no cookies, no local storage, no third-party requests** (fonts, scripts, analytics, embeds). Everything is self-hosted.
- **Performance:** Lighthouse 95+ on Performance, Accessibility, Best Practices and SEO, on mobile. Total page weight under about 400 KB for the home page. Inline critical CSS if useful. Preload the 400 and 800 weight fonts.
- **Responsive:** mobile-first. No horizontal scroll at 360 px. Test at 360, 390, 768, 1024, 1440 px.
- **Browsers:** latest Safari (iOS and macOS), Chrome, Firefox, Edge.
- **Analytics:** none at launch. If added later, only cookieless and privacy-respecting, and the privacy policy is updated first.
- **Security headers** (via host config): `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` disabling camera, microphone, geolocation, and a Content-Security-Policy allowing only `'self'` (plus `'unsafe-inline'` for styles only if needed).
- **Hosting:** Vercel (or Cloudflare Pages) from a private GitHub repo named `slate-website`. Production domain `writeonslate.com` with HTTPS; `www` redirects to the apex.
- **Email:** support@ and privacy@writeonslate.com forwarded to the founders' inbox (Cloudflare Email Routing or ImprovMX). The site only shows these addresses as `mailto:` links.
- **Repo layout suggestion:**

```
/index.html
/privacy/index.html
/terms/index.html
/support/index.html
/404.html
/assets/style.css
/assets/demo.js
/assets/fonts/  (Inter Tight woff2, latin + latin-ext, OFL.txt)
/assets/icons/  (inline SVGs can live in HTML instead)
/assets/og.png
/assets/favicon.png, favicon.svg, apple-touch-icon.png
/robots.txt
/sitemap.xml
/vercel.json   (headers and redirects)
```

---

## 20. Assets

- **App icon:** `slate-app-icon-1024.png`: a white "S" (Inter Tight 700, `#F5F5F3`) on graphite `#111214`. Derive favicon and apple-touch-icon from it.
- **Wordmark:** text "Slate" in Inter Tight 700, tracking −0.03em. Never on a photo, never a gradient, never animated.
- **Open Graph image (1200 × 630):** `--bg` background, wordmark top-left, the H1 "A calorie journal that gets out of the way." large, and a small journal snippet (two lines with numbers) on the right. Make both a light version (default).
- **Fonts:** Inter Tight woff2 files and OFL licence are in `slate-website/assets/fonts/`.
- **Photography:** none on the site. No stock photos, no illustrations beyond line icons, no app screenshots until real App Store screenshots exist.

---

## 21. Things the site must never do

- Pop-ups, modals, email capture, newsletter sign-up, chat widgets, cookie banners.
- Countdown timers, "limited offer", fake scarcity, strike-through prices.
- Testimonials, star ratings, user counts or press logos that aren't real and verifiable. (At launch there are none, so there are none on the site.)
- Before/after photos, body images, weight-loss claims, "results".
- Red or warning colours for over goal.
- Competitor names, logos or copy (§3.3).
- Logos of Apple Watch, Garmin, Strava, Nike or Fitbit. Text names only.
- The founder's personal email address.
- Any third-party request (fonts, analytics, embeds, CDNs).

---

## 22. Placeholders to fill before launch

Mark these in code with `TODO(launch):` comments:

1. App Store URL and app ID: replace "Coming soon to iPhone" with the official badge, add the Smart App Banner meta tag.
2. Effective dates on privacy and terms: set to the launch date.
3. Grievance Officer name: confirm (currently Nirmal Amin).
4. Counsel review of privacy and terms: remove the draft comments after.
5. Real App Store screenshots: optional new section after the hero, only once they exist.
6. Email forwarding for support@ and privacy@: confirm it works before the site goes live.

---

## 23. Acceptance checklist

The site is done when all of these are true:

- [ ] Every section in §8 exists, in order, with the exact copy given.
- [ ] Free and Plus lists on the pricing section match §5.2 and §5.3 exactly.
- [ ] Prices: ₹399 a month, ₹2,999 a year, about ₹92 and ₹58 a week, 7 days free on yearly.
- [ ] The four promises are word for word, with the signature.
- [ ] The demo works offline with the starting state in §9.2, splits "2 roti aur ek katori dal" into two lines, handles every chip, shows ↻ for unknown text, never shows red, and updates "left" or "over".
- [ ] The water bar fills for water lines in the demo.
- [ ] `/privacy/`, `/terms/`, `/support/` and the 404 page exist and link from the footer.
- [ ] Light and dark mode both look right; no hard-coded colours outside the tokens.
- [ ] No horizontal scroll at 360 px; tap targets at least 44 px.
- [ ] Keyboard-only navigation works; focus is always visible.
- [ ] Lighthouse mobile 95+ in all four categories.
- [ ] No network requests to any other domain (check the browser's network tab).
- [ ] No cookies or storage set.
- [ ] No banned words, exclamation marks, em dashes or emoji in visible copy (search the built HTML for "just", "healthy", "journey", "!", "—").
- [ ] JSON-LD validates (Organization, SoftwareApplication, FAQPage).
- [ ] `robots.txt` and `sitemap.xml` present.
- [ ] All `TODO(launch):` placeholders listed in the README.
- [ ] `node scripts/check.mjs` passes, and `node scripts/build.mjs` leaves no uncommitted changes.

---

## 24. Content pages: /calories/, /for/, /compare/, /blog/

Added in October 2026. These pages answer what people search about Indian food and calories, and show how Slate counts. They follow §3 (voice) and §21 (things the site must never do), with the extra rules below.

### 24.1 How they're built

- Generated, never edited by hand. `node scripts/build.mjs` writes every page from `data/foods.json` (dishes), `data/ingredients.json` (values per 100 g), `data/pages.json` (the /for/, /compare/ and /blog/ copy) and `data/site.json` (call to action, footer links, hub copy, author). To change a page, change the data and rebuild.
- `node scripts/check.mjs` must pass before every push. It checks banned words, exclamation marks (the trademark "Lose It!" is allowed), em dashes, emoji, titles of 60 characters or fewer, descriptions of 155 or fewer, one h1, `lang="en-IN"`, broken internal links, valid JSON-LD, and FAQPage questions that match the visible FAQ word for word.
- `data/`, `research/` and `scripts/` are not deployed (`.vercelignore`).
- Every number traces to research: `research/food-sources.md` (generated: each dish's recipe, arithmetic, cross-checks, judgement calls and sources), `research/content-sources.md` (numbers on the /for/, /compare/ and /blog/ pages), `research/competitors.md` (competitor facts with the date checked) and `research/search-queries-*.json` (the searches the FAQs answer).
- Prose holds numbers as tokens, such as `{{kcal:k200}}`, `{{kcal@roti:medium}}`, `{{outLo@samosa}}`, `{{ing:paneer}}` and `{{sum:2*roti:medium+dal-tadka:k200}}`, so fixing one value updates every page that quotes it.
- The iPhone app's bundled food data comes from the same data. `node scripts/export-app.mjs <rork-slate-591 checkout>` writes the app's `dishes.json`, `ingredients.json` and `supabase/seed_catalogue.sql`, using `data/app-map.json` (which portion makes one of the app's units, and the app's ingredient ids) and `data/app-foods.json` (dishes the app has and the site has no page for, worked out and checked the same way, logged in `research/app-food-sources.md`). It checks every dish against its page and lists the result in `research/app-export.md`. After changing food data, rebuild, export and commit the app's files too, so the app and the site never disagree.

### 24.2 Food pages (/calories/)

- **Hub:** every dish, grouped as breads, dals and curries, rice, sabzis, breakfast, street food and snacks, sweets, drinks, fasting food and restaurant dishes, with a search box that filters on the page (`assets/hub.js`, no network calls). JSON-LD: CollectionPage with an ItemList.
- **Dish page, in order:** H1 "<Dish> calories"; a one-sentence answer; a short intro; the note "Typical values for a home kitchen. Your own katori, roti and oil change the number; Slate adjusts for them."; a portions table (calories rounded to the nearest 5, grams to whole numbers); Home or outside, as a range; What changes the number; How these numbers were worked out (the recipe in grams, where each value comes from, and the sources); 3 to 5 questions people search, with FAQPage JSON-LD; related dishes and one /for/ page; the call to action.
- **Numbers:** recipes in grams from standard Indian textbooks via the Indian Nutrient Databank where they exist (The Art & Science of Cooking, Basic Food Preparation); values from IFCT 2017, with USDA FoodData Central only where IFCT 2017 has no entry. Frying oil and syrup taken up are set from lab measurements or USDA composition, never from the databank's totals, which count all the frying oil as eaten. Where a credible source differs by more than 15%, the page shows a range and says why; the build refuses to publish otherwise. Dishes without any analysed source say so (jalebi is marked as an estimate).
- No Recipe schema and no photos (owner decision, October 2026). JSON-LD: WebPage, BreadcrumbList, FAQPage.

### 24.3 Use-case pages (/for/)

Eight pages: indian-food, vegetarians, home-cooking, eating-out, hinglish, no-login, fasting, office-canteen-tiffin, with a hub. Each explains the problem honestly, how to count better, and where Slate helps, using only the facts in §4 to §6. No overselling, no goals, no weight-loss or medical claims.

### 24.4 Comparison pages (/compare/)

- Four pages, healthifyme, myfitnesspal, cal-ai and lose-it, with a hub. Never Mist.
- Each page: "Checked on <date>" at the top; a one-paragraph summary; a side-by-side table (how you log food, Indian home food, restaurant food, free tier, price in India, login required, ads, where data is stored, coaching or sales calls, platforms); "Where Slate is different"; "Where <app> is a better fit"; FAQ; the call to action; and the line "<App> is a trademark of its owner. Slate is not affiliated with it. Details checked on <date> and may have changed."
- Every fact about another app comes from its own website, help pages, privacy policy or App Store India listing, or from a reputable publication, and is linked on the page and logged with its date in `research/competitors.md`. Prices are shown as listed for India; where a fact couldn't be confirmed, the page says so. No logos, no screenshots, no imitation of their design, nothing disparaging.
- Slate's own facts on these pages must match §5 and §6 exactly. Re-check the competitor facts before editing a page, and at least every three months.

### 24.5 Blog (/blog/)

- Six articles: katori-size-calories, home-dal-vs-restaurant-dal, chai-calories, count-thali-calories, fasting-day-calories, maintenance-calories, with an index.
- Each: byline "By Nirmal Amin, Sonal Systems" with the published date; a key takeaways box; sources linked in the text; BlogPosting JSON-LD (author, datePublished, dateModified); `og:type` article.
- No medical advice. Where a reader's situation needs it, the article suggests a doctor or dietitian, and for distress about food, Tele-MANAS (14416).

### 24.6 Shared by every content page

- Breadcrumbs (Home / Section / Page) with BreadcrumbList JSON-LD.
- The call to action: "Slate works this out for your own katori and oil. Free, no login, iPhone." with the App Store button, or "Coming soon to iPhone" until `appStoreUrl` is set in `data/site.json`.
- Footer links on every page, including the hand-written ones: Food calories · Who Slate is for · Compare · Blog · Privacy policy · Terms · Support · support@writeonslate.com. The build keeps them in sync from `data/site.json`.
- Canonical host writeonslate.com (apex), trailing-slash URLs, `<html lang="en-IN">`, light and dark mode.
- Lighthouse mobile 95+ and no horizontal scroll at 360 px, as for the rest of the site.
