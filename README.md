# One Wrong Move

One Wrong Move is a daily mobile-first visual logic puzzle:

> One board. One rule. One wrong move.

Each board contains a compact visual rule system. Exactly one symbol breaks the rule, and the player taps that violating symbol. The game does not use memory previews, plain colored-square spotting, or external frontend libraries.

The app is plain HTML, CSS, and JavaScript. It runs directly from `public/index.html` and deploys as a static Netlify site from the `public` folder.

## How A Game Works

Each daily puzzle has three rounds. Before every round, the game pauses on a briefing card that explains the round goal, shows the symbol set, and gives a tiny teaching example that does not reveal the real board.

The player presses **Start Round** to reveal the board. The timer runs only while the player is actively solving. It pauses during the intro, round briefings, correct-answer feedback, transitions, and completion screen. Wrong taps add mistakes but keep the timer running.

After a correct tap, the game highlights the answer, explains the rule violation, and waits for **Next Round**. After round 3, the final screen shows solved rounds, active solving time, mistakes, score, and share controls.

## Puzzle Pool

The daily game selects three puzzle types from a larger deterministic pool, with difficulty escalating by round:

- **Rule Rows**: each row follows a shifted symbol recipe; one glyph breaks the grammar.
- **Conveyor Shift**: each row is the previous row shifted left or right; one tile breaks the conveyor movement.
- **Rotation Logic**: arrows rotate by a consistent rule; one arrow misses its turn.
- **Latin Trap**: rows and columns should contain exactly one of each symbol; one cell creates the trap.
- **Pair Pact**: partner symbols must appear as balanced pairs; one symbol breaks the pact.
- **Path Rhythm**: numbered moves follow a movement rhythm; the answer is the first illegal move.
- **Mirror Trap**: the right side mirrors the left using transformed symbol partners; one partner is wrong.

Puzzle selection and board generation use a deterministic seed based on `YYYY-MM-DD`, so everyone gets the same daily puzzle.

## Same-Session Variants

Restarting or choosing **Play another mix** increments a same-session attempt counter in `sessionStorage`. Puzzle generators receive that attempt number plus previously used break signatures. A signature includes the puzzle type, break mode, answer location, and wrong symbol or move.

When a type appears again in the same browser session, the generator avoids stale signatures so the repeated puzzle breaks in a new way. If all variants are exhausted, it falls back to the least recently used signature.

## Run Locally

Open `public/index.html` directly in a browser.

You can also serve the folder with Python:

```sh
python3 -m http.server 8080 -d public
```

Then visit `http://localhost:8080`.

To validate generated puzzles:

```sh
node scripts/validate-puzzles.js
```

## Netlify Deploy Settings

- Build command: leave blank
- Publish directory: `public`

The same settings are captured in `netlify.toml`.

## Current Limitations

- The daily puzzle uses the browser's local date.
- There is no daily archive, leaderboard, cloud save, or practice mode yet.
- Puzzle generation uses curated deterministic templates rather than a full procedural search engine.
- Same-session variation is stored locally in the current browser session only.
- Share text copies to the clipboard when the browser allows it; otherwise it appears in an alert and selectable text area.
