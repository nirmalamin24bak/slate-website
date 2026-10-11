# Sources for numbers on the /for/, /compare/ and /blog/ pages

Numbers written as `{{tokens}}` in data/pages.json are filled in by `node scripts/build.mjs` from the food pages, so they trace to research/food-sources.md. This file lists every other number on those pages and where it comes from.

## /for/ pages

| Number on the page | Source or arithmetic |
|---|---|
| A teaspoon of oil is about 40 calories, of ghee about 45 | Oil: USDA teaspoon of oil 4.5 g x 8.84 kcal per g (IFCT 2017 fat factor, 37 kJ per g) = 39.8. Ghee: 5 g (NIN teaspoon, 5 ml) x 8.84 = 44.2. |
| Katoris range from 150 to 250 ml | Slate's own kitchen settings (docs/WEBSITE-SPEC.md 4.4); the food pages show all three sizes. |
| 250 ml against 150 ml changes a katori by two thirds | 250 / 150 = 1.67. |
| A 50 g dough ball is roughly 30 g of atta | Roti page recipe: 100 g atta with 70 g water, so dough is 1.7 times the atta; 30 x 1.7 = 51 g. |
| A 1 litre bottle lasting 30 days for 4 people is about 7.7 g, or 68 calories, per person per day | Oil density from USDA's tablespoon of oil, 13.6 g per 14.79 ml = 0.92 g per ml. 1,000 ml x 0.92 = 920 g; / 30 days / 4 people = 7.7 g; x 8.84 = 68 kcal. |
| ICMR-NIN's standard pulse serving is 30 g of dry dal | ICMR-NIN, Dietary Guidelines for Indians (2011), Annexure 14, Portion size of foods (raw), PDF page 128: pulses 30 g, 100 kcal, 6 g protein. The same table gives fats and oils as 5 g, 45 kcal. |
| Raw toor dal: 21.7 g protein per 100 g | IFCT 2017 B021. |
| Paneer: 18.9 g protein and 14.8 g fat per 100 g | IFCT 2017 L003 (18.86 g, 14.78 g). |
| 25 g of onion is about 12 calories | IFCT 2017 G017, 48 kcal per 100 g; 25 g = 12 kcal. |
| Dried dates about 317 calories per 100 g; fresh dates about 144 | ICMR-NIN, Dietary Guidelines for Indians (2011), Annexure 7 (from Nutritive Value of Indian Foods, 1989). |
| Slate's settings, features and privacy facts (katori 150/200/250 ml, roti 6/8/10 inches, oil sentence, Mumbai storage, Anthropic, RevenueCat, Open Food Facts, DPDP Act, backups within 30 days) | docs/WEBSITE-SPEC.md sections 4 to 6. |
| Delhi street samosas and kachoris held far more fat than home versions | Gupta et al. 2016, Journal of Nutrition Education and Behavior, PMC4826272, Tables 1 and 2; see the samosa and kachori pages. |
| A large restaurant naan is about three times a home naan | USDA FNDDS naan: 10-inch naan 177 g; the naan page's home naan is about 59 g. |

## /blog/ pages

| Number on the page | Source or arithmetic |
|---|---|
| Cooked rice is about 0.67 g per ml; a 200 ml katori holds about 134 g | USDA FDC 168878, cooked white rice, 158 g per cup (236.6 ml): 158 / 236.6 = 0.668; 200 x 0.668 = 134 g. |
| Thin dal is about 1 g per ml | Stated assumption on the dal pages (thin dal treated like water). |
| ICMR-NIN's pulse portion is 30 g raw, about 100 calories | ICMR-NIN, Dietary Guidelines for Indians (2011), Annexure 14, PDF page 128. |
| A teaspoon of ghee about 45 calories, of butter about 35 | Ghee 5 g x 8.84 (IFCT fat factor) = 44; butter 5 g x 7.17 (USDA FDC 173430) = 36. |
| A restaurant-style dal tadka recipe uses about the same fat per gram of dal as the textbook one | Dal tadka page, outside basis: Swasthi's dal tadka (0.24 to 0.27 g fat per g dal) against the textbook (0.33). |
| An open recipe uses 3 tablespoons of butter and 2.5 of cream for 180 g of dal (dal makhani) | Indian Nutrient Databank, open-source recipe OSR139 (140 g whole black gram + 40 g rajma). |
| ICMR-NIN counts a cup of tea with 50 ml toned milk and 2 teaspoons of sugar at 75 calories | ICMR-NIN, Dietary Guidelines for Indians (2011), Annexure 8. |
| A level teaspoon of sugar is about 4.2 g and 16 calories | USDA FDC 169655: 1 tsp = 4.2 g, 387 kcal per 100 g. |
| Jaggery about 354 per 100 g; sugar 387 | IFCT 2017 I001; USDA FDC 169655. |
| Toned milk about 58 per 100 ml; whole cow's milk about 73; buffalo milk about 107 | Amul Taaza label; IFCT 2017 L002 (72.9) and L001 (107.3). |
| Each extra 100 ml of toned milk adds about 58 calories | Amul Taaza label, 58 kcal per 100 ml. |
| 2 tbsp coconut, groundnut or til chutney about 120; 1 tbsp tamarind chutney with jaggery about 60; 1 tbsp tomato chutney about 10 | ICMR-NIN, Dietary Guidelines for Indians (2011), Annexure 8. |
| Dried dates about 317 per 100 g; fresh dates about 144 | ICMR-NIN, Dietary Guidelines for Indians (2011), Annexure 7. |
| Mifflin-St Jeor equations | Mifflin MD, St Jeor ST et al., American Journal of Clinical Nutrition 1990;51:241-7 (PubMed 2305711): men 10W + 6.25H - 5A + 5; women 10W + 6.25H - 5A - 161. |
| Weight, height, age and sex explained about 71% of differences in resting energy use | Same paper, R squared = 0.71. |
| PAL 1.40 to 1.69 sedentary or light; 1.70 to 1.99 active; 2.00 to 2.40 vigorous | FAO/WHO/UNU, Human energy requirements (2004), Table 5.3. |
| Worked examples: 1,289 kcal at rest, 1,800 to 2,180 a day; 1,699 at rest, 2,380 to 2,870 a day | Woman 30 y, 160 cm, 60 kg: 600 + 1,000 - 150 - 161 = 1,289; x 1.40 = 1,805, x 1.69 = 2,178. Man 30 y, 175 cm, 75 kg: 750 + 1,093.75 - 150 + 5 = 1,698.75; x 1.40 = 2,378, x 1.69 = 2,871. |
| Weight response to a change in intake has a half-time of about a year | Hall KD et al., Quantification of the effect of energy imbalance on bodyweight, The Lancet 2011 (PMC3880593), abstract. |
| Tele-MANAS on 14416 | Government of India's mental health helpline, as in docs/WEBSITE-SPEC.md FAQ 16. |
