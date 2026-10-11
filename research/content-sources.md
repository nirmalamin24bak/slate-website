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
