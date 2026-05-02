# One Wrong Move Game Design

## Why Prior Versions Failed

The first MVP was a memory test: players briefly saw a perfect board, then had to remember which cell changed. That made the puzzle feel vague because success came from recall instead of reasoning.

The second version removed memory pressure but became too literal. A stray diagonal tile, a simple copy mismatch, and an illegal path were objectively solvable, but they felt closer to children's visual odd-one-out exercises than an adult daily puzzle.

The current redesign keeps the solvable board but raises the reasoning bar. The board now presents a symbolic system, and the player must infer the rule before identifying the one violation.

## Logic-First Principle

The product principle is:

> One board. One rule. One wrong move.

Every active board must be self-contained. The player should be able to infer the rule from the visible symbols, prove that exactly one symbol violates it, and understand the answer after feedback. The game should reward pattern reasoning, not short-term memory or trivial color scanning.

## State Flow

The game uses five explicit states:

- **intro**: explains the daily puzzle, keeps the board hidden, and shows the main start action.
- **briefing**: pauses before each round with the round name, one-sentence goal, symbol list, and a tiny non-spoiler example.
- **active**: reveals the real board and runs the timer while the player solves.
- **feedback**: pauses the timer after a correct tap, highlights the answer, and explains the rule violation.
- **complete**: keeps the timer stopped and shows results, score, sharing, replay, and restart actions.

The board is hidden during intro and briefing. It appears only after **Start Round**, stays visible during feedback, and never reveals the next puzzle before the next briefing is started.

## Timer Design

The timer measures active solving time only. It does not run during the intro, round briefings, correct-answer feedback, round transitions, or the completion screen. Wrong taps keep the timer running because they are part of the solving attempt.

The score is a lower-is-better time score:

```text
baseSeconds = Math.ceil(totalActiveMs / 1000)
mistakePenaltySeconds = mistakes * 10
scoreSeconds = baseSeconds + mistakePenaltySeconds
```

For example, 18.2 active seconds and 2 mistakes becomes:

- Base time: 19s
- Mistake penalty: 2 × 10s = +20s
- Final score: 39s

Mistakes add time because the game should reward clean solving without using an abstract ranking. The 10-second penalty is intentionally blunt and legible: one mistake is costly, but a fast solve can still recover.

## Puzzle-Type Pool

The daily game chooses three puzzle types from a deterministic pool, preferring no duplicates and escalating by difficulty.

| Type | Difficulty | Rule System | Break Variations |
| --- | --- | --- | --- |
| Rule Rows | Easy | Rows follow a shifted symbol recipe. | Wrong next symbol, duplicate symbol, outside symbol. |
| Conveyor Shift | Easy | Each row shifts from the previous row. | Wrong shifted position, duplicate from previous row, neighboring-column symbol. |
| Rotation Logic | Medium | Arrows rotate by a consistent rule. | Rotates backward, skips a quarter turn, becomes opposite. |
| Latin Trap | Medium | Each row and column contains one of each symbol. | Row/column duplicate, swapped symbol, missing-symbol trap. |
| Pair Pact | Medium | Symbols belong in partner pairs or groups. | Wrong partner, lonely symbol, borrowed partner. |
| Path Rhythm | Hard | Numbered moves follow a movement rhythm. | Horizontal/vertical break, turn break, jump break. |
| Mirror Trap | Hard | The right side mirrors the left through symbol transformations. | Unchanged symbol, wrong paired symbol, swapped partner. |

Each generator returns a board, answer index, explanation, break signature, briefing text, symbol bank, and example data. Validation helpers check that each generated puzzle has exactly one objectively correct answer.

## Session Variation

The first play of the day uses the canonical daily seed. Restarting or choosing **Play another mix** increments a same-session attempt counter stored in `sessionStorage`.

Every generated break has a signature containing:

- puzzle type id
- break mode
- answer index
- wrong symbol or movement

Previously used signatures are also kept in `sessionStorage`. When a puzzle type repeats during the same browser session, the generator avoids the stale signature, so the break changes by mode, location, or wrong symbol. If every available variant is exhausted, the generator falls back to the least recently used signature and marks that fallback internally.

## Mobile-First Design

The app is designed as a phone puzzle first. The header is compact and includes the title, puzzle number, round indicator, timer, mistakes, and daily/variant label. The rule card and primary button stay close to the board, and every active puzzle cell is a native button sized for touch.

The visual style is restrained: serif title, monochrome glyph badges, high-contrast text, subtle dividers, and direct feedback. It aims for premium and minimal rather than flashy or toy-like.

## Laptop Phone Frame

On laptop and desktop screens, the app is constrained to a centered smartphone-sized frame with rounded corners, subtle shadow, fixed phone-like height where possible, and internal scrolling. The layout intentionally never stretches wide because the puzzle rhythm depends on a compact handheld board.

## Accessibility Decisions

- Puzzle cells are native buttons during active play.
- ARIA labels describe row, column, and symbol identity.
- The answer never depends on color alone.
- Feedback uses text, border treatment, symbols, and explanations.
- Keyboard and pointer activation share the same code path.
- Round briefings teach the mechanic before the timer starts.

## Future Opportunities

- Daily archive with replayable previous puzzles.
- Leaderboard using score, time, mistakes, and variant status.
- Practice mode with unlimited non-daily boards.
- Larger puzzle families such as Set-style attributes, grammar grids, paired operators, graph constraints, and hidden alphabets.
- Local solve history so refreshing does not erase today's result.
- A puzzle authoring harness for tuning generated difficulty and catching ambiguous boards.
