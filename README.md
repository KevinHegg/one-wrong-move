# One Wrong Move

One Wrong Move is a daily mobile-first visual logic survival puzzle:

> One board. One rule. One move. Survive until your first wrong move.

Each board contains a compact visual rule system. The player infers the rule and either taps the one violating symbol, chooses the one best move, selects the exact set of required squares, or commits a precise two-step move. One wrong committed move ends the run.

The app is plain HTML, CSS, and JavaScript. It runs directly from `public/index.html`, deploys as a static Netlify site from `public`, and can also be tested from the repository root on GitHub Pages.

## Survival Run

The main mode is **Survival Run**. A run starts from the intro screen, then generates a deterministic stream of daily levels from `YYYY-MM-DD` plus the same-session attempt number.

Before each level, a paused briefing card shows the level number, puzzle type, source world, answer mode, symbol chips, and a tiny non-spoiler example. The real board stays hidden until the player presses **Start Level**.

The run continues indefinitely in practice, up to the generated level cap, until the player makes one wrong committed move or the per-level countdown expires. Correct answers pause the timers, show an explanation, and reveal **Next Level**. Wrong moves and timeouts end the run immediately.

## Timers And Ranking

The run timer measures active solving time only. It does not run during the intro, briefings, correct feedback, transitions, or the run-over screen. Each level also has a countdown timer.

Default level limit:

```text
60 seconds per level
```

Testing overrides are available with `?limit=30`, `?limit=45`, or `?limit=90`. Valid override values are clamped to the supported range of 15 to 180 seconds.

Survival ranking is intentionally direct:

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

## Legacy Time Score

The lower-is-better time score remains available in `public/scoring.js` for validation and historical reports:

```text
baseSeconds = Math.ceil(totalActiveMs / 1000)
mistakePenaltySeconds = mistakes * 10
scoreSeconds = baseSeconds + mistakePenaltySeconds
```

The main Survival Run no longer accumulates mistakes or shows time-penalty scoring. One wrong move ends the run.

## Puzzle Pool

The survival stream selects active production puzzle types from a deterministic pool. Difficulty escalates gradually: approachable levels first, medium levels next, harder levels after level 9. Current active types include:

- Card Straight
- Suit Cycle
- Poker Hand Trap
- Chess Attack
- Go Capture Max
- Go Liberties
- Logic Gate Row
- Domino Chain
- Dice Sum
- Yahtzee Fix
- Maze Exit
- Maze Key Exit
- Scrabble Cross
- Tetris Fit
- Train Route
- Mirror Trap
- Pair Pact
- Rotation Logic
- Latin Trap
- Checkers Jump
- Animal Food Web
- Compass Rose

Rule Rows, Conveyor Shift, and Knight Path remain in the lab as retired/backlog puzzle types, but they are no longer selected for Survival Run. They were too easy or less satisfying than the richer source-world puzzles.

Puzzle selection and board generation use a deterministic seed based on `YYYY-MM-DD`, so everyone gets the same daily stream for the same attempt. The selector avoids immediate repeats, rotates source worlds, avoids back-to-back card/Go/movement families when possible, and keeps retired puzzles out of the main run.

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

The lab renders production puzzle types separately from retired lab-only types. Each card shows source world, difficulty, answer mode, symbol bank, sample board, hidden answer toggle, break signature, evidence string, and validator status. It also includes a Survival Run stream preview for the first 20 generated levels.

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
- Some validators compare against generated expected boards; the strongest validators independently compute Go liberties, Go captures, chess attacks, maze reachability, and survival stream rules.
- Same-session variation is stored locally in the current browser session only.
- Share text copies to the clipboard when the browser allows it; otherwise it appears in an alert and selectable text area.
