# Symbol System

## Principle

Symbols are rule carriers, not decoration.

One Wrong Move should show the player the thing the rule is about. Internal IDs can be terse, but active boards, briefings, examples, lab cards, and share/evidence copy should use real glyphs and readable labels whenever possible.

## Banned Player-Facing Abbreviations

The following legacy animal/relationship codes are banned as primary visible symbols:

```text
PL IN FR SN HW FI BR RB FX BE FL
```

Replacement map:

| Legacy | Replacement |
| --- | --- |
| PL | 🌱 Plant |
| IN | 🐛 Insect |
| FR | 🐸 Frog |
| SN | 🐍 Snake |
| HW | 🦅 Hawk |
| FI | 🐟 Fish |
| BR | 🐻 Bear |
| RB | 🐇 Rabbit |
| FX | 🦊 Fox |
| BE | 🐝 Bee |
| FL | 🌸 Flower |

Allowed compact text remains limited to domain-standard tokens such as logic gates (`AND`, `OR`, `XOR`, `NAND`), playing-card ranks, chess numbers, and simple maze labels.

## Symbol Record Shape

`public/symbols.js` exposes `window.OWM_SYMBOLS`. Each symbol record supports:

```js
{
  id,
  glyph,
  emoji,
  label,
  shortLabel,
  ariaLabel,
  category,
  theme,
  tags,
  displayKind,
  fallback,
  difficulty,
  sourceNote
}
```

The renderer uses the glyph as the main visual and the label for chips, compact sublabels, tooltips, and screen-reader text.

## Packs

Production packs include ecology, food and ingredients, kitchen tools, animals by habitat, plants/fruits/vegetables, music, weather/space, sports/games, workshop tools, household objects, relationship pairs, cards, chess, dice, dominoes, Go, logic, and maze labels.

Theme packs group symbols into fair category rows:

- Kitchen Tools
- Workshop Tools
- Forest Animals
- Musical Instruments
- Weather
- Space
- Sports Balls
- Salad Ingredients
- Pizza Ingredients
- Taco Ingredients
- Breakfast Foods
- Household Pairs
- Farm Animals
- Board Games

The lab shows both symbol packs and theme packs so puzzle authors can inspect readability before adding new puzzles.

## Object Puzzle Rules

Object Row Imposter asks for one object outside a clean category row.

Category Swap asks for exactly two objects swapped between category rows.

Dish Ingredient Imposter asks for one ingredient that does not belong with a familiar dish.

Recipe Swap asks for exactly two ingredients swapped between dish rows.

Object Rack Complete asks for a blank square and a rack object that completes the row category.

All of these use curated obvious categories. Normal Ladder play avoids botanical gotchas, culturally narrow recipe assumptions, and trivia-only categories.

## Accessibility Rules

- Every symbol needs a readable `label` or `ariaLabel`.
- Emoji tiles keep a text label in chips and ARIA labels because emoji rendering varies by platform.
- Active cells remain native buttons when interactive.
- Disabled cells are not keyboard targets.
- Multi-select and two-step selections use text, selected state, and button commitment rather than color alone.

## Validation

`scripts/validate-symbol-display.js` generates active puzzle types across many seeds and attempts. It fails if banned abbreviations appear as primary visible symbols, if active ecology symbols lack readable labels, if Animal Food Web regresses to codes, or if Pair Pact exposes legacy `BE`/`FL` tokens.
