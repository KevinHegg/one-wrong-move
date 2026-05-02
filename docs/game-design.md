# One Wrong Move Game Design

## Why Prior Versions Failed

The first MVP was a memory test: players briefly saw a perfect board, then had to remember which cell changed. That made success depend on recall instead of reasoning.

The second version was solvable from one board, but it leaned too hard on obvious visual odd-one-out mechanics. A stray tile, a simple copy mismatch, and an illegal path were clear, but they did not feel like an adult daily puzzle.

The current direction keeps the self-contained board and raises the reasoning bar. Each board now presents a visual system drawn from real-world pattern families: cards, chess, Go, logic gates, dominoes, dice, ecology, compasses, and other rule-bearing domains.

## Logic-First Principle

The product principle is:

> One board. One rule. One wrong move.

Every active board must be self-contained. The player should be able to infer the rule from the visible symbols, prove that exactly one symbol violates it, and understand the answer after feedback. The game should reward pattern reasoning, not short-term memory or trivial visual rarity.

Symbols are rule carriers, not decoration. A card is useful because rank and suit can progress. A knight is useful because it moves in L-shapes. A Go stone is useful because liberties use orthogonal adjacency. Arbitrary glyphs still have a place, but they should not dominate the daily experience.

## State Flow

The game uses five explicit states:

- **intro**: explains the daily puzzle, keeps the board hidden, and shows the main start action.
- **briefing**: pauses before each round with source world, round name, one-sentence goal, symbol chips, and a tiny non-spoiler example.
- **active**: reveals the real board and runs the timer while the player solves.
- **feedback**: pauses the timer after a correct tap, highlights the answer, and explains the rule violation.
- **complete**: keeps the timer stopped and shows results, score, sharing, replay, and restart actions.

The board is hidden during intro and briefing. It appears only after **Start Round**, stays visible during feedback, and never reveals the next puzzle before the next briefing is started.

## Timer And Score

The timer measures active solving time only. It does not run during the intro, briefings, correct feedback, transitions, or completion. Wrong taps keep the timer running because they are part of the solve.

The score is lower-is-better:

```text
baseSeconds = Math.ceil(totalActiveMs / 1000)
mistakePenaltySeconds = mistakes * 10
scoreSeconds = baseSeconds + mistakePenaltySeconds
```

Example: 18.2 active seconds and 2 mistakes becomes:

- Base time: 19s
- Mistake penalty: 2 x 10s = +20s
- Final score: 39s

The 10-second penalty is intentionally plain. It makes mistakes matter while keeping the score readable as time, not points.

## Source-World Diversity

Real-world systems make puzzles more memorable because the player can bring prior intuition to the board. Cards have rank and suit. Chess pieces have movement. Logic gates have truth tables. Dominoes have matching halves. Go uses orthogonal liberties. These systems make the rule feel discovered rather than invented.

The daily selector uses deterministic randomness from the date and session attempt. It chooses three puzzle types while preferring:

- no duplicate puzzle type
- no duplicate source world when alternatives exist
- no more than one abstract glyph puzzle
- no more than one movement-path puzzle
- at least one real-world source-world puzzle
- difficulty escalation: round 1 is easier, round 2 is medium, round 3 is hardest

## Current Production Types

| Type | Source world | Difficulty | Skill | Rule |
| --- | --- | --- | --- | --- |
| Rule Rows | Symbol Grammar | 1 | Sequence grammar | Rows follow shifted recipes. |
| Conveyor Shift | Symbol Grammar | 2 | Spatial transformation | Each row shifts from the previous row. |
| Rotation Logic | Compass | 2 | Rotation sequence | Directions rotate by a fixed amount. |
| Latin Trap | Symbol Grammar | 2 | Row-column constraints | Rows and columns each need one of every symbol. |
| Pair Pact | Symbol Grammar | 2 | Pair inference | Symbols belong in partner pairs. |
| Path Rhythm | Map | 3 | Movement rhythm | A numbered path follows a movement beat. |
| Mirror Trap | Symbol Grammar | 3 | Mapping inference | The right side mirrors with transformed partners. |
| Card Straight | Cards | 1 | Rank progression | Rows form rank straights with suit logic. |
| Suit Cycle | Cards | 2 | Cyclic attributes | Suits cycle across rows and shift each row. |
| Knight Path | Chess | 3 | Legal movement | Numbered knights must move in L-shapes. |
| Chess Attack | Chess | 4 | Movement classification | Each piece must legally attack a target vector. |
| Go Liberties | Go | 4 | Orthogonal adjacency | Stone groups have a specified liberty count. |
| Logic Gate Row | Logic | 2 | Boolean logic | Inputs and gates must produce the shown output. |
| Domino Chain | Dominoes | 2 | Matching chain | Neighboring domino halves must match. |
| Dice Sum | Dice | 2 | Small arithmetic | Dice rows must add to the target. |
| Checkers Jump | Checkers | 3 | Diagonal movement | Numbered checkers must move diagonally. |
| Animal Food Web | Ecology | 2 | Relationship ordering | Rows show an obvious food chain. |
| Compass Rose | Compass | 2 | Rotation sequence | Compass bearings rotate by a fixed step. |

## Validators And Uniqueness

Every puzzle type has a generator and validator. The validator checks that:

- the board is no larger than 5x5
- the board is not empty
- there is exactly one valid answer
- the answer matches `answerIndex`
- the puzzle has briefing copy, example data, symbols, explanation, hint, evidence, and break signature

The validation scripts test all registered types directly, 300 date seeds, and five same-session attempts. This protects the core promise: the puzzle may be tricky, but it cannot be ambiguous.

Future validators should move more domain knowledge into independent checks. For example, Go Liberties can eventually count liberties from the rendered board instead of comparing against an expected generated board.

## Session Variation

The first play of the day uses the canonical daily seed. Restarting or choosing **Play another mix** increments a same-session attempt counter stored in `sessionStorage`.

Every break has a signature containing:

- puzzle type id
- break mode
- answer index
- wrong symbol, value, or movement

Previously used signatures are also kept in `sessionStorage`. When a puzzle type repeats during the same browser session, the generator avoids stale signatures, so the break changes by mode, location, or wrong symbol. If every available variant is exhausted, the generator falls back to the least recently used signature.

## Mobile And Desktop Presentation

The app is a phone puzzle first. The header is compact and includes title, puzzle number, round indicator, timer, mistakes, and daily/variant label. The rule card and primary button stay close to the board, and every active puzzle cell is a native button sized for touch.

On laptop and desktop screens, the game is constrained to a centered smartphone-sized frame with rounded corners, subtle shadow, fixed phone-like height where possible, and internal scrolling. The layout intentionally never stretches wide because the puzzle rhythm depends on a compact handheld board.

## Accessibility Decisions

- Puzzle cells are native buttons during active play.
- ARIA labels describe row, column, and symbol identity.
- Compound symbols such as cards, dominoes, and logic gates have readable labels.
- Answers never rely on color alone.
- Feedback uses text, border treatment, symbols, and explanations.
- Keyboard and pointer activation share the same code path.
- Round briefings teach the mechanic before the timer starts.

## Future Opportunities

- Daily archive with replayable previous puzzles.
- Leaderboard using score, active time, mistakes, and variant status.
- Practice mode with unlimited non-daily boards.
- A full puzzle authoring harness with per-type difficulty tuning.
- Stronger independent validators for Go, chess, ecology, and card systems.
- Additional source worlds: music notation, train routes, sports formations, chemistry valence, language grammar, calendars, maps, and clock arithmetic.
- Local solve history so refreshing does not erase today's result.
