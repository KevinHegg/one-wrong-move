# One Wrong Move Game Design

## Why Prior Versions Failed

The first MVP was a memory test: players briefly saw a perfect board, then had to remember which cell changed. That made success depend on recall instead of reasoning.

The next one-board versions improved the premise, but some puzzle types still felt too easy. Rule Rows and Conveyor Shift could often be solved by diagonal scanning rather than by understanding the rule. Knight Path was logically valid, but a single repeated knight-move path was less fun than a richer chess position.

Those three types are now retired from normal daily play. They remain in the puzzle lab as reference and backlog material, but the daily mix favors source-world systems with stronger intrinsic rules.

## Survival Product Promise

The product principle is:

> One board. One rule. One move. Survive until your first wrong move.

Every active board must be self-contained. The player should be able to infer the rule from the visible symbols, prove that the answer is unique, and understand the answer after feedback. The game should reward pattern reasoning, not short-term memory, visual rarity, or childish odd-one-out scanning.

Symbols are rule carriers, not decoration. A card is useful because rank and suit can progress. A chess piece is useful because it has legal attacks. A Go stone is useful because liberties use orthogonal adjacency. A domino is useful because halves match. Arbitrary glyphs still have a place, but they should not dominate the daily experience.

The same principle applies to object puzzles. Internal IDs can be short, but player-facing tiles should show the thing itself: plant, insect, frog, snake, hawk, bee, flower, key, lock, tool, ingredient, dish. The earlier Animal Food Web briefing exposed internal abbreviations such as `PL`, `IN`, and `FR`; that made the puzzle feel coded instead of visual. Those codes are now banned from active player-facing displays.

## Why Survival Replaced Three Rounds

The old three-round daily format was clean, but it made the title less meaningful. The player could make mistakes, absorb a time penalty, and still finish. Survival Run makes the product promise literal: one wrong committed move ends the run.

This changes the emotional shape of the game. A correct answer is not just progress through a fixed checklist; it is survival. The score also becomes easier to understand: completed levels are the primary achievement, and total active time breaks ties.

## Ladder And Free Play

The main high-stakes mode is now labeled **Ladder Run** in the player UI. It keeps the Survival rule: one wrong committed move or a timeout ends the run.

Three-Set Free Play exists because some of the better puzzle types are hard enough that players need a place to learn them without immediate failure. Free Play plays exactly three puzzles, keeps briefings paused, and lets wrong attempts add mistakes instead of ending the session. Its score reuses the earlier lower-is-better formula:

```text
scoreSeconds = Math.ceil(totalActiveMs / 1000) + mistakes * 10
```

This gives the product two useful rhythms: Ladder for tension and Free Play for learning.

## Answer Modes

The puzzle model supports four answer modes:

- `identifyOne`: tap exactly one symbol that breaks the board rule.
- `chooseOne`: tap exactly one best move square.
- `multiSelect`: select one or more squares, then submit the exact set.
- `twoStep`: make two tentative selections, then submit the move.

Single-answer and choose-one puzzles preserve the fast tap flow. Multi-select and two-step puzzles treat selection clicks as planning, not final moves. The run ends only when the player presses **Submit Move** with a wrong set. That extra commit step prevents accidental finger taps from killing a run on puzzles that require multiple precise selections.

## Target Clarity

The latest revision adds explicit target metadata because some good puzzles naturally describe a row, column, output, or equation rather than one ordinary cell. The rule is simple: instructions and click behavior must agree.

Supported target types:

- `cell`: tap the exact wrong cell or best move.
- `row`: tap the broken row; any cell in the answer row is accepted.
- `column`: tap the broken column; any cell in the answer column is accepted.
- `outputCell`: tap the wrong output; only output cells are enabled.
- `multiSelect`: select the exact set, then submit.
- `twoStep`: make the planned two-step move, then submit.

Logic Gate Row now prefers output targeting: inputs, gates, and equals signs are visibly disabled, skipped by keyboard navigation, and cannot accidentally end a Ladder run. Dice Sum targets either the wrong die or the wrong total, and the instruction changes to match. A new Row Rhythm puzzle proves that whole-row targeting accepts any cell in the answer row while giving the row a subtle affordance.

## State Flow

The game uses five explicit states:

- **intro**: explains Survival Run, keeps the board hidden, and shows the main start action.
- **briefing**: pauses before each level with source world, puzzle name, answer mode, symbol chips, and a tiny non-spoiler example.
- **active**: reveals the real board and runs the timer while the player solves.
- **feedback**: pauses timers after a correct answer, highlights the answer, and explains the rule.
- **complete**: keeps timers stopped and shows the Run Over result, sharing, and replay actions.

The board is hidden during intro and briefing. It appears only after **Start Level**, stays visible during correct feedback, and never reveals the next puzzle before the next briefing is started.

## Timer And Survival Ranking

The run timer measures active solving time only. It does not run during the intro, briefings, correct feedback, transitions, or completion. Each active level also has a configurable countdown, defaulting to 60 seconds. The countdown becomes visually urgent in the final 10 seconds.

Survival results use this ranking rule:

```text
More completed levels is better.
If tied, faster active time is better.
```

The previous lower-is-better time score remains in the scoring utility for validation history, but the main mode no longer accumulates mistake penalties. Mistakes no longer stack; the first wrong committed move ends the run.

## Source-World Diversity

Real-world systems make puzzles more memorable because the player can bring prior intuition to the board. Cards have rank and suit. Chess pieces have attacks. Go groups have liberties. Logic gates have truth tables. Dominoes have matching halves. Train routes have connectivity. These systems make the rule feel discovered rather than invented.

The survival selector uses deterministic randomness from the date and session attempt. It generates at least 100 practical levels while preferring:

- no duplicate puzzle type
- no duplicate source world when alternatives exist
- no Rule Rows, Conveyor Shift, or Knight Path in daily play
- no more than one abstract glyph puzzle
- no more than one movement-path puzzle when alternatives exist
- no duplicate card or Go family when alternatives exist
- at least one real-world source-world puzzle
- difficulty escalation: levels 1-3 are approachable, levels 4-8 are medium, and levels 9+ lean harder

## Current Production Types

| Type | Source world | Answer mode | Difficulty | Skill | Rule |
| --- | --- | --- | --- | --- | --- |
| Suit Cycle | Cards | identifyOne | 1 | Cyclic attributes | Suits cycle across rows and shift each row. |
| Pair Pact | Relationships | identifyOne | 1 | Pair inference | Symbols belong in established partner pairs. |
| Domino Chain | Dominoes | identifyOne | 1 | Matching chain | Neighboring domino halves must match. |
| Dice Sum | Dice | identifyOne | 1 | Small arithmetic | Dice rows must add to the target. |
| Sudoku Conflict | Sudoku | identifyOne | 2 | Constraint repair | One digit breaks a mini-Sudoku row, column, or box. |
| Mini Sudoku Swap | Sudoku | multiSelect | 3 | Constraint repair | Select the two swapped digits that restore the grid. |
| Minesweeper Forced Mine | Minesweeper | chooseOne | 3 | Mine inference | Tap the one hidden square that must be a mine. |
| Minesweeper Mark All | Minesweeper | multiSelect | 4 | Complete mine deduction | Flag every mine in the unique clue-consistent layout. |
| Card Straight | Cards | identifyOne | 2 | Rank progression | Rows form rank straights with suit logic. |
| Logic Gate Row | Logic | identifyOne | 2 | Boolean logic | Tap the wrong output; inputs and gates are disabled. |
| Mirror Trap | Relationships | identifyOne | 2 | Mapping inference | The right side mirrors with transformed partners. |
| Rotation Logic | Compass | identifyOne | 2 | Rotation sequence | Directions rotate by a fixed amount. |
| Latin Trap | Symbol Grammar | identifyOne | 2 | Row-column constraints | Rows and columns each need one of every symbol. |
| Animal Food Web | Ecology | identifyOne | 2 | Relationship ordering | Rows show an obvious food chain. |
| Object Row Imposter | Objects | identifyOne | 1 | Category grouping | One object does not belong in its category row. |
| Category Swap | Objects | multiSelect | 2 | Category repair | Two objects were swapped between two theme rows. |
| Dish Ingredient Imposter | Food | identifyOne | 1 | Recipe grouping | One ingredient does not belong with its dish. |
| Recipe Swap | Food | multiSelect | 2 | Recipe repair | Two ingredients were swapped between dishes. |
| Object Rack Complete | Objects | twoStep | 2 | Category completion | Choose a blank and a rack object that completes the row. |
| Compass Rose | Compass | identifyOne | 2 | Rotation sequence | Compass bearings rotate by a fixed step. |
| Chess Attack | Chess | identifyOne | 3 | Attack sequence | Each numbered piece must legally attack the next piece. |
| Poker Hand Trap | Cards | identifyOne | 3 | Hand classification | Each row names a tiny poker pattern. |
| Train Route | Routes | identifyOne | 3 | Connection tracing | Track tiles form one continuous route from S to F. |
| Checkers Jump | Checkers | identifyOne | 3 | Diagonal movement | Numbered checkers must move diagonally. |
| Go Capture Max | Go | chooseOne | 4 | Capture counting | Black to play; choose the move that captures the most white stones. |
| Go Liberties | Go | multiSelect | 4 | Orthogonal adjacency | Select every liberty of the marked group. |
| Yahtzee Fix | Yahtzee | multiSelect | 3 | Category repair | Select the exact two dice that break a five-dice category. |
| Maze Exit | Maze | chooseOne | 2 | Reachability | Trace from S and choose the reachable exit. |
| Maze Key Exit | Maze | twoStep | 3 | Key-route pairing | Choose the reachable key and the exit it opens. |
| Scrabble Cross | Words | twoStep | 3 | Word crossing | Choose the square and rack tile that make valid crossing words. |
| Mini Crossword Fill | Words | twoStep | 2 | Crossing words | Choose the blank and rack letter that complete both words. |
| Crossword Pair | Words | multiSelect | 3 | Paired blanks | Select the two blanks and two rack letters that complete the crosses. |
| Tetris Fit | Tetris | multiSelect | 3 | Shape placement | Select the exact tetromino cells that complete the target line. |
| Circuit Switch Pair | Circuits | multiSelect | 3 | Switch repair | Select the two switches that turn the target light on. |
| Maze Bridge Repair | Maze | multiSelect | 3 | Route repair | Select the two broken bridge tiles that connect S to E. |
| Row Rhythm | Logic Grid | identifyOne | 2 | Row targeting | Tap the row that breaks its count-and-order rhythm. |

## Retired From Daily Play

| Type | Why retired |
| --- | --- |
| Rule Rows | Too easy to solve by diagonal scanning; often felt like filling a missing symbol. |
| Conveyor Shift | Also rewarded visual phase-scanning more than satisfying reasoning. |
| Knight Path | Valid but narrow; Chess Attack gives chess movement more variety and texture. |

## Chess Attack

Chess Attack replaces generic Knight Path in the daily mix. It is now denser and more satisfying: each board aims for 9-10 numbered pieces on the 5x5 grid, and each generated board uses all five non-pawn piece types when possible.

Numbered pieces sit on their own squares, such as a rook with a small `1` badge or bishop with a small `3` badge. The player follows the pieces in order. Each piece must legally attack the next numbered piece:

- Rook: row or column line.
- Bishop: diagonal line.
- Queen: rook or bishop line.
- Knight: L-shape.
- King: one square in any direction.

The answer is the first numbered piece that cannot legally attack the next numbered piece. The validator computes those movement rules directly, checks that piece and number live on the same square, rejects pawns, and verifies the first illegal attacker.

## Go Puzzles

Go uses simplified rules:

- Stones occupy grid points.
- Orthogonal adjacency connects stones into groups.
- Empty orthogonally adjacent points are liberties.
- Diagonal points do not count.
- A move captures an opponent group when it fills that group's last liberty.
- Ko and full-life-and-death concepts are intentionally out of scope.

**Go Capture Max** is a `chooseOne` puzzle. Black to play, and exactly one empty point captures the most white stones. The board is denser than before, with multiple white groups and decoy capture moves. The validator computes capture scores from the rendered board and requires one unique best capture.

**Go Liberties** is a `multiSelect` puzzle. A group of 2-4 stones is marked, and the player selects every empty orthogonal liberty. The board includes diagonal decoys because diagonals do not count. The correct submission must exactly match the liberty set.

Go rendering now uses a board-grid treatment rather than generic tiles. Black stones are filled circles, white stones are hollow circles with strong outlines, and marked groups receive a visible ring. Empty intersections remain clearly tappable without pre-marking active liberties.

## Sudoku Puzzles

Sudoku is implemented as a compact mini-Sudoku family, not full 9x9 Sudoku. A full grid would be too large and slow for a phone-first timed game. The production puzzles use a 4x4 board with digits 1-4 and visible 2x2 box boundaries, which keeps the constraint system readable inside the app shell.

**Sudoku Conflict** is `identifyOne`: one digit breaks the row, column, and box constraints. The validator brute-forces every one-cell change and requires exactly one repair cell.

**Mini Sudoku Swap** is `multiSelect`: two digits were swapped. Selection clicks are planning clicks, and **Submit Swap** commits the move. The validator brute-forces every possible two-cell swap and proves that exactly one pair restores all rows, columns, and 2x2 boxes.

These puzzles are number-grid logic, so the selector avoids placing them back-to-back with Minesweeper when alternatives exist. Mini Sudoku Swap does not appear before Level 4 in Ladder Run.

## Minesweeper Puzzles

Minesweeper uses a 5x5 board with revealed clue numbers and hidden candidate squares. Clues count mines in the eight surrounding cells. Clue cells are disabled, hidden cells are selectable, and mines are never shown during active play.

**Minesweeper Forced Mine** is `chooseOne`: enumerate every mine layout consistent with the clues and tap the hidden square that is a mine in all valid layouts.

**Minesweeper Mark All** is `multiSelect`: select every mine and press **Submit Flags**. The validator enumerates clue-consistent mine layouts and accepts only boards with one unique mine set.

Minesweeper selection clicks are planning clicks for multi-select puzzles. In Ladder Run, a wrong submitted flag set ends the run; in Free Play, it adds a mistake and keeps the puzzle active.

## New Puzzle Types

**Object Row Imposter** uses theme rows such as kitchen tools, music instruments, weather, sports balls, forest animals, and workshop tools. Four objects establish the row's theme, and one object breaks it. This is an approachable object puzzle, but Ladder selection avoids stacking multiple object-row puzzles back to back.

**Category Swap** is a multi-select object puzzle. Two objects have traded rows, such as a tomato in tools and a wrench in ingredients. The player must select exactly both swapped objects before submitting.

**Dish Ingredient Imposter** shows a dish in the first cell and common ingredients beside it. One ingredient does not belong. The dish set is deliberately familiar and curated to avoid subjective recipe trivia.

**Recipe Swap** asks the player to select two ingredients that were swapped between two dish rows. The explanation names where each selected ingredient belongs.

**Object Rack Complete** is a two-step category puzzle. The player chooses a blank in a theme row and then chooses the object from a separate rack that completes that row.

**Yahtzee Fix** asks the player to repair a visible five-dice category by selecting exactly two wrong dice. It supports categories such as full house, four of a kind, and large straight while keeping the dice values small and readable.

**Maze Exit** turns the 5x5 board into a tiny route map. The player traces from `S` through open paths and chooses the one reachable exit.

**Maze Key Exit** is a two-step puzzle: choose the reachable key, then choose the exit it opens. Selection is tentative until the player commits the move.

**Scrabble Cross** uses a tiny curated vocabulary. The player chooses one empty square and one rack tile that create valid crossing words.

**Mini Crossword Fill** is a smaller, cleaner word puzzle for Free Play. One blank square and one rack letter complete both a horizontal and a vertical word.

**Crossword Pair** extends the word system into multi-select: the player chooses two blank board squares and two rack letters, then submits the exact planned repair.

**Tetris Fit** asks for the exact four cells of the tetromino placement that completes the target row. It uses familiar piece shapes but avoids a full falling-block simulation.

**Circuit Switch Pair** asks for the exact two switches that turn the target light on. The circuit is intentionally tiny, using 0/1 switch states and a visible target, so the challenge is pair reasoning rather than electrical notation.

**Maze Bridge Repair** asks for the two broken route tiles that reconnect `S` to `E`. The validator proves that no other broken-tile pair creates a valid route.

## Validators And Uniqueness

Every puzzle type has a generator and validator. The validator checks that:

- the board is no larger than 5x5
- the board is not empty
- the answer mode is valid
- single-answer puzzles have exactly one answer
- multi-select puzzles have exactly one required answer set
- row and column target puzzles accept the whole declared row or column
- output target puzzles disable every non-output candidate
- the answer matches `answerIndex` or `answerIndices`
- the puzzle has briefing copy, example data, symbols, explanation, hint, evidence, and break signature
- retired types are not selected for the daily mix

The validation scripts test all registered types directly, 300 date seeds, five same-session attempts, the first 50 Ladder levels per date/attempt pair, and the Three-Set Free Play selector. Go Capture Max, Go Liberties, Chess Attack, Maze Exit, targeting behavior, word puzzles, and the Ladder stream have independent domain or stream validators.

## Session Variation

The first play of the day uses the canonical daily seed. Restarting or choosing **Play again** increments a same-session attempt counter stored in `sessionStorage`.

Every break has a signature containing:

- puzzle type id
- break mode
- answer index or answer set
- wrong symbol, value, or movement

Previously used signatures are also kept in `sessionStorage`. When a puzzle type repeats during the same browser session, the generator avoids stale signatures, so the break changes by mode, location, or wrong symbol. If every available variant is exhausted, the generator falls back to the least recently used signature.

## Mobile And Desktop Presentation

The app is a phone puzzle first. The header is compact and includes title, puzzle number, level indicator, run timer, level countdown, lives, and daily/variant label. The rule card and primary button stay close to the board, and every active puzzle cell is a native button sized for touch.

On laptop and desktop screens, the game is constrained to a centered smartphone-sized frame with rounded corners, subtle shadow, fixed phone-like height where possible, and internal scrolling. The layout intentionally never stretches wide because the puzzle rhythm depends on a compact handheld board.

## Accessibility Decisions

- Puzzle cells are native buttons during active play.
- ARIA labels describe row, column, and symbol identity.
- Compound symbols such as cards, dominoes, numbered chess pieces, Go stones, logic gates, animal icons, dish icons, and object tiles have readable labels.
- Symbol chips include a glyph and readable label so emoji rendering differences do not make briefings cryptic.
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
