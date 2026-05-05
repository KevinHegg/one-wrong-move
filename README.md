# One Wrong Move

One Wrong Move is a daily mobile-first visual logic puzzle:

> One board. One rule. One move. Survive until your first wrong move.

Each board contains a compact visual rule system. The player infers the rule and either taps the one violating symbol, chooses the one best move, selects the exact set of required squares, or commits a precise two-step move.

The app is plain HTML, CSS, and JavaScript. It runs directly from `public/index.html`, deploys as a static Netlify site from `public`, and can also be tested from the repository root on GitHub Pages.

## Ladder Run

The primary mode is **Ladder Run**. A run starts from the intro screen, then generates a deterministic stream of daily levels from `YYYY-MM-DD` plus the same-session attempt number.

Before each level, a paused briefing card shows the level number, puzzle type, source world, answer mode, symbol chips, and a tiny non-spoiler example. The real board stays hidden until the player presses **Start Level**.

The run continues indefinitely in practice, up to the generated level cap, until the player makes one wrong committed move or the per-level countdown expires. Correct answers pause the timers, show an explanation, and reveal **Next Level**. Wrong moves and timeouts end the run immediately.

## Three-Set Free Play

**Three-Set Free Play** is the lower-stakes companion mode. It plays exactly three puzzles, keeps the paused briefing flow, and lets the player keep solving after a wrong attempt.

Wrong taps or wrong submissions add a mistake and show a hint instead of ending the game. After three solved puzzles, Free Play uses the legacy lower-is-better time score:

```text
baseSeconds = Math.ceil(totalActiveMs / 1000)
mistakePenaltySeconds = mistakes * 10
scoreSeconds = baseSeconds + mistakePenaltySeconds
```

The result screen shows active time, base time, mistakes, the `10s` mistake penalty, final score in seconds, and "Lower is better." Free Play can be opened directly with `?mode=freeplay`; Ladder can be forced with `?mode=ladder`.

## Timers And Ranking

The run timer measures active solving time only. It does not run during the intro, briefings, correct feedback, transitions, or the run-over screen. Each level also has a countdown timer.

Default level limit:

```text
60 seconds per level
```

Testing overrides are available with `?limit=30`, `?limit=45`, or `?limit=90`. Valid override values are clamped to the supported range of 15 to 180 seconds.

Ladder ranking is intentionally direct:

```text
More completed levels is better.
If tied, faster total active time is better.
```

The result screen shows levels completed, total active time, the level where the run ended, the end reason, and a share result such as `12 levels in 4:18`.

## Answer Modes

- `identifyOne`: tap exactly one symbol that breaks the board rule.
- `chooseOne`: tap exactly one best move square, such as the Go move that captures the most stones.
- `multiSelect`: select one or more squares, then press **Submit Move**. The submitted set must exactly match the answer set.
- `twoStep`: make two tentative selections, then press **Submit Move**. This supports puzzles such as key/exit routes and word-tile placement.

All active puzzle cells are native buttons with keyboard support and ARIA labels.

## Target Clarity

Every puzzle declares targeting metadata so the instruction and click behavior agree.

- Exact-cell puzzles say to tap the wrong tile, symbol, card, output, or move.
- Row-level puzzles say to tap the broken row, and any cell in that row is accepted.
- Column-level puzzles say to tap the broken column, and any cell in that column is accepted.
- Output-only puzzles, such as Logic Gate Row, make only output cells clickable.
- Equation puzzles, such as Dice Sum, enable only the wrong kind of target: dice when the die is wrong, totals when the total is wrong.
- Disabled cells are skipped by keyboard navigation and cannot accidentally end a Ladder run.

The lab displays target type, clickable target count, disabled target count, and accepted row/column/set behavior.

## Symbol System

The app uses a local curated symbol catalog in `public/symbols.js`. Player-facing puzzle symbols use actual glyphs plus readable labels instead of unexplained two-letter codes. Animal Food Web now shows objects such as `🌱 Plant`, `🐛 Insect`, `🐸 Frog`, `🐍 Snake`, and `🦅 Hawk`; Pair Pact shows real pairs such as `🐝 Bee` and `🌸 Flower`.

Internal IDs may stay short, but active boards, briefings, symbol chips, examples, lab cards, and accessibility labels should never use cryptic abbreviations as the primary visible symbol when an object glyph or readable label exists. The validation suite includes `scripts/validate-symbol-display.js` to catch regressions.

## Time Score Utility

The lower-is-better time score remains available in `public/scoring.js` for validation and historical reports:

```text
baseSeconds = Math.ceil(totalActiveMs / 1000)
mistakePenaltySeconds = mistakes * 10
scoreSeconds = baseSeconds + mistakePenaltySeconds
```

Ladder Run does not accumulate mistakes or show time-penalty scoring. One wrong move ends the run. Three-Set Free Play uses this formula because mistakes are recoverable there.

## Puzzle Pool

The survival stream selects active production puzzle types from a deterministic pool. Difficulty escalates gradually: approachable levels first, medium levels next, harder levels after level 9. Current active types include:

- Card Straight
- Suit Cycle
- Poker Hand Trap
- Chess Attack
- Go Capture Max
- Go Liberties
- Othello Best Flip
- Othello Mark All Flips
- Logic Gate Row
- Domino Chain
- Dice Sum
- Sudoku Conflict
- Mini Sudoku Swap
- Minesweeper Forced Mine
- Minesweeper Mark All
- Yahtzee Fix
- Maze Key Exit
- Scrabble Cross
- Mini Crossword Fill
- Crossword Pair
- Circuit Switch Pair
- Tetris Fit
- Maze Bridge Repair
- Train Route
- Mirror Trap
- Pair Pact
- Object Row Imposter
- Category Swap
- Dish Ingredient Imposter
- Recipe Swap
- Object Rack Complete
- Rotation Logic
- Latin Trap
- Checkers Jump
- Animal Food Web
- Compass Rose

Rule Rows, Conveyor Shift, Knight Path, and Maze Exit remain in the lab as retired/backlog puzzle types, but they are no longer selected for Ladder Run or Three-Set Free Play. Rule Rows and Conveyor Shift were too scan-heavy, Knight Path was less satisfying than Chess Attack, and Maze Exit was too obvious to carry normal play.

Puzzle selection and board generation use a deterministic seed based on `YYYY-MM-DD`, so everyone gets the same daily stream for the same attempt. The selector avoids immediate repeats, rotates source worlds, avoids back-to-back card/Go/Othello/movement families when possible, and keeps retired puzzles out of the main run.

## Mini Go And Othello

The board-game capture family now has two mini Go puzzles and two mini Othello/Reversi puzzles.

**Go Capture Max** asks Black to play the empty point that captures the most white stones. **Go Liberties** asks for every liberty of a marked group.

**Othello Best Flip** asks Black to choose the legal move that flips the most white discs. **Othello Mark All Flips** marks Black's move and asks the player to select every white disc that would flip. The Othello validator computes legal straight-line sandwich captures in all eight directions.

## Sudoku And Minesweeper

The app uses compact number-grid logic rather than full desktop-sized puzzles.

**Sudoku Conflict** is a one-tap mini-Sudoku puzzle. A 4x4 grid uses digits 1-4, and every row, column, and 2x2 box must contain each digit once. One digit is wrong.

**Mini Sudoku Swap** is a multi-select repair puzzle. Two digits have been swapped; select both cells and press **Submit Swap**. The validator brute-forces every two-cell swap to prove the repair is unique.

**Minesweeper Forced Mine** asks for the one hidden square that must be a mine under the clue numbers.

**Minesweeper Mark All** asks the player to flag every mine and press **Submit Flags**. The validator enumerates every clue-consistent mine layout and accepts only unique layouts.

Sudoku and Minesweeper are placed carefully in Ladder Run so the earliest levels stay approachable. Free Play can include one number-grid puzzle, but avoids turning a three-puzzle set into a pure number-grid gauntlet.

## Same-Session Variants

Restarting or choosing **Play again** increments a same-session attempt counter in `sessionStorage`. Puzzle generators receive that attempt number plus previously used break signatures. A signature includes the puzzle type, break mode, answer location, and wrong symbol or move.

When a type appears again in the same browser session, the generator avoids stale signatures so the repeated puzzle breaks in a new way. If all variants are exhausted, it falls back to the least recently used signature.

## Puzzle Lab

The development lab is available at:

```text
public/lab.html
```

When served locally, visit:

```text
http://localhost:8080/lab.html
```

The lab renders production puzzle types separately from retired lab-only types. Each card shows source world, difficulty, answer mode, target type, clickable/disabled target counts, symbol bank, sample board, hidden answer toggle, break signature, evidence string, and validator status. It also includes a Ladder stream preview, a Three-Set Free Play preview, symbol pack inventory, and theme pack inventory.

The lab also works as a local playtesting notebook. It stores feedback only in browser `localStorage` under `oneWrongMove.labFeedback.v1`; there is no backend, analytics, account, or personal data flow.

Lab feedback tools include:

- Explore filters for puzzle name, source world, answer mode, target type, active/retired status, reviewed state, decision, tag, and sort order.
- Review Queue presets for all active puzzles, the current Ladder stream, the current Free Play set, hard puzzles, confusing puzzles, object/theme puzzles, board-game puzzles, word puzzles, and number puzzles.
- Try Blind mode for sandbox solving without affecting Ladder or Free Play scores.
- Ratings for fun, felt difficulty, clarity, and fairness.
- Decisions: Keep, Tweak, Cut, and Needs more testing.
- Quick tags such as too easy, too hard, confusing, boring, unfair, ambiguous target, visually excellent, great for Ladder, great for Free Play, and lab only.
- Export tools for JSON, CSV, Markdown summary, and a ChatGPT-ready feedback prompt.

More detail lives in `docs/lab-feedback.md`.

## Run Locally

Open `public/index.html` directly in a browser.

You can also serve the folder with Python:

```sh
python3 -m http.server 8080 -d public
```

Then visit:

```text
http://localhost:8080
```

Validation commands:

```sh
node --check public/symbols.js
node --check public/config.js
node --check public/scoring.js
node --check public/puzzles.js
node --check public/game.js
node --check public/lab.js
node scripts/validate-scoring.js
node scripts/validate-puzzles.js
node scripts/validate-pattern-systems.js
node scripts/validate-survival.js
node scripts/validate-targeting.js
node scripts/validate-freeplay.js
node scripts/validate-word-puzzles.js
node scripts/validate-symbol-display.js
node scripts/validate-sudoku-minesweeper.js
node scripts/validate-othello.js
```

## Netlify Deploy Settings

- Build command: leave blank
- Publish directory: `public`

The same settings are captured in `netlify.toml`.

## GitHub Pages

GitHub Pages serves this repo from the repository root at:

```text
https://kevinhegg.github.io/one-wrong-move/
```

The root `index.html` loads the same app files from `public/` so the game can be tested there while Netlify still publishes `public`.

## Current Limitations

- The daily survival stream uses the browser's local date.
- There is no daily archive, leaderboard, cloud save, or practice mode yet.
- Puzzle generation uses curated deterministic templates rather than a full procedural search engine.
- Sudoku is intentionally mini-Sudoku, not full 9x9; Minesweeper uses compact inferred mine layouts for phone-sized timed play.
- Object and recipe theme packs are curated to avoid ambiguous trivia, but they are not a full knowledge graph.
- Some validators compare against generated expected boards; the strongest validators independently compute Go liberties, Go captures, chess attacks, maze reachability, and survival stream rules.
- Same-session variation is stored locally in the current browser session only.
- Share text copies to the clipboard when the browser allows it; otherwise it appears in an alert and selectable text area.
