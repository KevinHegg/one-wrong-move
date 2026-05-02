# One Wrong Move

One Wrong Move is a daily mobile-first visual logic puzzle:

> One board. One rule. One wrong move.

Each board contains a small visual rule system. Exactly one symbol breaks that system, and the player taps the violating symbol. The game does not use memory previews, plain color spotting, React, Vite, TypeScript, canvas, or external frontend libraries.

The app is plain HTML, CSS, and JavaScript. It runs directly from `public/index.html` and deploys as a static Netlify site from the `public` folder.

## How A Game Works

Each daily puzzle has three rounds. The board is hidden until a round starts. Before every round, a paused briefing card shows the round name, source world, one-sentence goal, symbol chips, and a tiny non-spoiler example.

The player presses **Start Round** to reveal the board. The timer runs only while the player is actively solving. It pauses during the intro, round briefings, correct-answer feedback, transitions, and completion screen. Wrong taps add mistakes but keep the timer running.

After a correct tap, the game highlights the answer, explains the rule violation, and waits for **Next Round**. After round 3, the final screen shows solved rounds, active solving time, mistakes, a lower-is-better time score, share text, **Play another mix**, and restart.

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

The daily game selects three puzzle types from a deterministic pool, with difficulty escalating by round. The current production pool includes 18 types:

- Rule Rows
- Conveyor Shift
- Rotation Logic
- Latin Trap
- Pair Pact
- Path Rhythm
- Mirror Trap
- Card Straight
- Suit Cycle
- Knight Path
- Chess Attack
- Go Liberties
- Logic Gate Row
- Domino Chain
- Dice Sum
- Checkers Jump
- Animal Food Web
- Compass Rose

The newer source-world puzzles borrow logic from playing cards, chess, Go, digital logic, dominoes, dice, checkers, ecology, and compass systems. Symbols are treated as rule carriers, not decoration.

Puzzle selection and board generation use a deterministic seed based on `YYYY-MM-DD`, so everyone gets the same daily puzzle. The daily mix avoids duplicate puzzle types, prefers source-world diversity, limits abstract glyph puzzles, and escalates difficulty across the three rounds.

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

The lab renders every registered puzzle type with a seed/date input, session attempt input, sample board, hidden answer toggle, break signature, evidence string, and validator status.

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

## Current Limitations

- The daily puzzle uses the browser's local date.
- There is no daily archive, leaderboard, cloud save, or practice mode yet.
- Puzzle generation uses curated deterministic templates rather than a full procedural search engine.
- Some validators compare against generated expected boards; future validators can encode more independent domain logic.
- Same-session variation is stored locally in the current browser session only.
- Share text copies to the clipboard when the browser allows it; otherwise it appears in an alert and selectable text area.
