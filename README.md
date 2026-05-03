# One Wrong Move

One Wrong Move is a daily mobile-first visual logic puzzle:

> One board. One rule. One move — or one precise set of moves.

Each board contains a compact visual rule system. The player infers the rule and either taps the one violating symbol, chooses the one best move, or selects the exact set of required squares. The game does not use memory previews, trivial color spotting, React, Vite, TypeScript, canvas, or external frontend libraries.

The app is plain HTML, CSS, and JavaScript. It runs directly from `public/index.html`, deploys as a static Netlify site from `public`, and can also be tested from the repository root on GitHub Pages.

## How A Game Works

Each daily puzzle has three rounds. The board is hidden until a round starts. Before every round, a paused briefing card shows the round name, source world, one-sentence goal, symbol chips, and a tiny non-spoiler example.

The player presses **Start Round** to reveal the board. The timer runs only while the player is actively solving. It pauses during the intro, briefings, correct-answer feedback, transitions, and completion screen. Wrong taps or wrong submissions add mistakes but keep the timer running.

After a correct answer, the game highlights the answer, explains the rule, and waits for **Next Round**. After round 3, the final screen shows solved rounds, active solving time, mistakes, a lower-is-better time score, share text, **Play another mix**, and restart.

## Answer Modes

- `identifyOne`: tap exactly one symbol that breaks the board rule.
- `chooseOne`: tap exactly one best move square, such as the Go move that captures the most stones.
- `multiSelect`: select one or more squares, then press **Submit**. The submitted set must exactly match the answer set.

All active puzzle cells are native buttons with keyboard support and ARIA labels.

## Scoring

One Wrong Move uses a lower-is-better time score:

```text
baseSeconds = Math.ceil(totalActiveMs / 1000)
mistakePenaltySeconds = mistakes * 10
scoreSeconds = baseSeconds + mistakePenaltySeconds
```

Example: solving in 18.2 active seconds with 2 mistakes gives a base score of 19 seconds, a 20-second mistake penalty, and a final score of 39 seconds.

Mistakes add time because they should matter without turning the game into abstract points. The current penalty is 10 seconds per mistake: clear, memorable, and easy to explain in the share result.

## Puzzle Pool

The daily game selects three active production puzzle types from a deterministic pool, with difficulty escalating by round. Current active types include:

- Card Straight
- Suit Cycle
- Poker Hand Trap
- Chess Attack
- Go Capture Max
- Go Liberties
- Logic Gate Row
- Domino Chain
- Dice Sum
- Train Route
- Mirror Trap
- Pair Pact
- Rotation Logic
- Latin Trap
- Checkers Jump
- Animal Food Web
- Compass Rose

Rule Rows, Conveyor Shift, and Knight Path remain in the lab as retired/backlog puzzle types, but they are no longer selected for the daily mix. They were too easy or less satisfying than the richer source-world puzzles.

Puzzle selection and board generation use a deterministic seed based on `YYYY-MM-DD`, so everyone gets the same daily puzzle. The daily mix avoids duplicate puzzle types, prefers source-world diversity, avoids duplicate card/Go/movement families when possible, and escalates difficulty across the three rounds.

## Same-Session Variants

Restarting or choosing **Play another mix** increments a same-session attempt counter in `sessionStorage`. Puzzle generators receive that attempt number plus previously used break signatures. A signature includes the puzzle type, break mode, answer location, and wrong symbol or move.

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

The lab renders production puzzle types separately from retired lab-only types. Each card shows source world, difficulty, answer mode, symbol bank, sample board, hidden answer toggle, break signature, evidence string, and validator status.

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
node --check public/scoring.js
node --check public/puzzles.js
node --check public/game.js
node --check public/lab.js
node scripts/validate-scoring.js
node scripts/validate-puzzles.js
node scripts/validate-pattern-systems.js
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

- The daily puzzle uses the browser's local date.
- There is no daily archive, leaderboard, cloud save, or practice mode yet.
- Puzzle generation uses curated deterministic templates rather than a full procedural search engine.
- Some validators compare against generated expected boards; the strongest validators now independently compute Go liberties, Go captures, and chess attacks.
- Same-session variation is stored locally in the current browser session only.
- Share text copies to the clipboard when the browser allows it; otherwise it appears in an alert and selectable text area.
