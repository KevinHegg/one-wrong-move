# One Wrong Move Game Design

## Why Prior Versions Failed

The first MVP was a memory test: players briefly saw a perfect board, then had to remember which cell changed. That made success depend on recall instead of reasoning.

The next one-board versions improved the premise, but some puzzle types still felt too easy. Rule Rows and Conveyor Shift could often be solved by diagonal scanning rather than by understanding the rule. Knight Path was logically valid, but a single repeated knight-move path was less fun than a richer chess position.

Those three types are now retired from normal daily play. They remain in the puzzle lab as reference and backlog material, but the daily mix favors source-world systems with stronger intrinsic rules.

## Expanded Product Promise

The product principle is:

> One board. One rule. One move — or one precise set of moves.

Every active board must be self-contained. The player should be able to infer the rule from the visible symbols, prove that the answer is unique, and understand the answer after feedback. The game should reward pattern reasoning, not short-term memory, visual rarity, or childish odd-one-out scanning.

Symbols are rule carriers, not decoration. A card is useful because rank and suit can progress. A chess piece is useful because it has legal attacks. A Go stone is useful because liberties use orthogonal adjacency. A domino is useful because halves match. Arbitrary glyphs still have a place, but they should not dominate the daily experience.

## Answer Modes

The puzzle model supports three answer modes:

- `identifyOne`: tap exactly one symbol that breaks the board rule.
- `chooseOne`: tap exactly one best move square.
- `multiSelect`: select one or more squares, then submit the exact set.

Single-answer puzzles preserve the original tap flow. Multi-select puzzles keep the timer running through wrong submissions, then pause only when the selected set is exactly correct. This makes Go Liberties possible without turning the whole app into a different game.

## State Flow

The game uses five explicit states:

- **intro**: explains the daily puzzle, keeps the board hidden, and shows the main start action.
- **briefing**: pauses before each round with source world, round name, one-sentence goal, symbol chips, and a tiny non-spoiler example.
- **active**: reveals the real board and runs the timer while the player solves.
- **feedback**: pauses the timer after a correct answer, highlights the answer, and explains the rule.
- **complete**: keeps the timer stopped and shows results, score, sharing, replay, and restart actions.

The board is hidden during intro and briefing. It appears only after **Start Round**, stays visible during feedback, and never reveals the next puzzle before the next briefing is started.

## Timer And Score

The timer measures active solving time only. It does not run during the intro, briefings, correct feedback, transitions, or completion. Wrong taps and wrong multi-select submissions keep the timer running because they are part of the solve.

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

Real-world systems make puzzles more memorable because the player can bring prior intuition to the board. Cards have rank and suit. Chess pieces have attacks. Go groups have liberties. Logic gates have truth tables. Dominoes have matching halves. Train routes have connectivity. These systems make the rule feel discovered rather than invented.

The daily selector uses deterministic randomness from the date and session attempt. It chooses three puzzle types while preferring:

- no duplicate puzzle type
- no duplicate source world when alternatives exist
- no Rule Rows, Conveyor Shift, or Knight Path in daily play
- no more than one abstract glyph puzzle
- no more than one movement-path puzzle when alternatives exist
- no duplicate card or Go family when alternatives exist
- at least one real-world source-world puzzle
- difficulty escalation: round 1 is easier, round 2 is medium, round 3 is strongest

## Current Production Types

| Type | Source world | Answer mode | Difficulty | Skill | Rule |
| --- | --- | --- | --- | --- | --- |
| Suit Cycle | Cards | identifyOne | 1 | Cyclic attributes | Suits cycle across rows and shift each row. |
| Pair Pact | Relationships | identifyOne | 1 | Pair inference | Symbols belong in established partner pairs. |
| Domino Chain | Dominoes | identifyOne | 1 | Matching chain | Neighboring domino halves must match. |
| Dice Sum | Dice | identifyOne | 1 | Small arithmetic | Dice rows must add to the target. |
| Card Straight | Cards | identifyOne | 2 | Rank progression | Rows form rank straights with suit logic. |
| Logic Gate Row | Logic | identifyOne | 2 | Boolean logic | Inputs and gates must produce the shown output. |
| Mirror Trap | Relationships | identifyOne | 2 | Mapping inference | The right side mirrors with transformed partners. |
| Rotation Logic | Compass | identifyOne | 2 | Rotation sequence | Directions rotate by a fixed amount. |
| Latin Trap | Symbol Grammar | identifyOne | 2 | Row-column constraints | Rows and columns each need one of every symbol. |
| Animal Food Web | Ecology | identifyOne | 2 | Relationship ordering | Rows show an obvious food chain. |
| Compass Rose | Compass | identifyOne | 2 | Rotation sequence | Compass bearings rotate by a fixed step. |
| Chess Attack | Chess | identifyOne | 3 | Attack sequence | Each numbered piece must legally attack the next piece. |
| Poker Hand Trap | Cards | identifyOne | 3 | Hand classification | Each row names a tiny poker pattern. |
| Train Route | Routes | identifyOne | 3 | Connection tracing | Track tiles form one continuous route from S to F. |
| Checkers Jump | Checkers | identifyOne | 3 | Diagonal movement | Numbered checkers must move diagonally. |
| Go Capture Max | Go | chooseOne | 4 | Capture counting | Black to play; choose the move that captures the most white stones. |
| Go Liberties | Go | multiSelect | 4 | Orthogonal adjacency | Select every liberty of the marked group. |

## Retired From Daily Play

| Type | Why retired |
| --- | --- |
| Rule Rows | Too easy to solve by diagonal scanning; often felt like filling a missing symbol. |
| Conveyor Shift | Also rewarded visual phase-scanning more than satisfying reasoning. |
| Knight Path | Valid but narrow; Chess Attack gives chess movement more variety and texture. |

## Chess Attack

Chess Attack replaces generic Knight Path in the daily mix. Numbered pieces sit on their own squares, such as a rook with a small `1` badge or bishop with a small `3` badge. The player follows the pieces in order. Each piece must legally attack the next numbered piece:

- Rook: row or column line.
- Bishop: diagonal line.
- Queen: rook or bishop line.
- Knight: L-shape.
- King: one square in any direction.

The answer is the first numbered piece that cannot legally attack the next numbered piece. The validator computes those movement rules directly and rejects pawns.

## Go Puzzles

Go uses simplified rules:

- Stones occupy grid points.
- Orthogonal adjacency connects stones into groups.
- Empty orthogonally adjacent points are liberties.
- Diagonal points do not count.
- A move captures an opponent group when it fills that group's last liberty.
- Ko and full-life-and-death concepts are intentionally out of scope.

**Go Capture Max** is a `chooseOne` puzzle. Black to play, and exactly one empty point captures the most white stones. The validator computes capture scores from the rendered board.

**Go Liberties** is a `multiSelect` puzzle. A group is marked, and the player selects every empty orthogonal liberty. The correct submission must exactly match the liberty set.

## Validators And Uniqueness

Every puzzle type has a generator and validator. The validator checks that:

- the board is no larger than 5x5
- the board is not empty
- the answer mode is valid
- single-answer puzzles have exactly one answer
- multi-select puzzles have exactly one required answer set
- the answer matches `answerIndex` or `answerIndices`
- the puzzle has briefing copy, example data, symbols, explanation, hint, evidence, and break signature
- retired types are not selected for the daily mix

The validation scripts test all registered types directly, 300 date seeds, and five same-session attempts. Go Capture Max, Go Liberties, and Chess Attack have independent domain validators that compute captures, liberties, and legal attacks from board data.

## Session Variation

The first play of the day uses the canonical daily seed. Restarting or choosing **Play another mix** increments a same-session attempt counter stored in `sessionStorage`.

Every break has a signature containing:

- puzzle type id
- break mode
- answer index or answer set
- wrong symbol, value, or movement

Previously used signatures are also kept in `sessionStorage`. When a puzzle type repeats during the same browser session, the generator avoids stale signatures, so the break changes by mode, location, or wrong symbol. If every available variant is exhausted, the generator falls back to the least recently used signature.

## Mobile And Desktop Presentation

The app is a phone puzzle first. The header is compact and includes title, puzzle number, round indicator, timer, mistakes, and daily/variant label. The rule card and primary button stay close to the board, and every active puzzle cell is a native button sized for touch.

On laptop and desktop screens, the game is constrained to a centered smartphone-sized frame with rounded corners, subtle shadow, fixed phone-like height where possible, and internal scrolling. The layout intentionally never stretches wide because the puzzle rhythm depends on a compact handheld board.

## Accessibility Decisions

- Puzzle cells are native buttons during active play.
- ARIA labels describe row, column, and symbol identity.
- Compound symbols such as cards, dominoes, numbered chess pieces, Go stones, and logic gates have readable labels.
- Multi-select cells expose selected state with `aria-pressed`.
- Answers never rely on color alone.
- Feedback uses text, border treatment, symbols, and explanations.
- Keyboard and pointer activation share the same code path.
- Round briefings teach the mechanic before the timer starts.

## Future Opportunities

- Daily archive with replayable previous puzzles.
- Leaderboard using score, active time, mistakes, and variant status.
- Practice mode with unlimited non-daily boards.
- A full puzzle authoring harness with per-type difficulty tuning.
- More Go source worlds: snapback, ladder-shape recognition, saving moves, and capture races.
- Stronger independent validators for card hand inference, train connectivity, and ecology.
- Additional source worlds: music notation, sports formations, chemistry valence, language grammar, calendars, maps, and clock arithmetic.
- Local solve history so refreshing does not erase today's result.
