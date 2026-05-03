# Pattern Systems Catalog

## Design Principle

Symbols are rule carriers, not decoration.

The player should never be asked to scan for a rare icon just because it is rare. A symbol earns its place when it brings structure: rank, suit, movement, adjacency, pairing, sequence, count, direction, input/output, or another inferable relation.

## Why Abstract Glyphs Are Not Enough

The abstract glyph pool improved the original memory MVP, but it still risked feeling arbitrary. A moon, crown, eye, and diamond can form rows and pairs, but they do not carry much built-in meaning. That makes the player ask, "What convention did the generator invent?" instead of, "What rule can I infer?"

Real-world systems give the puzzle a shared vocabulary. Cards suggest rank and suit. Chess suggests movement. Go suggests liberties. Logic gates suggest truth tables. Dominoes suggest matching. These systems make the solve more memorable and let difficulty come from reasoning instead of visual clutter.

## 5x5 Constraints

A 5x5 board is small enough for phones and large enough for evidence. It can show five rows of examples, five columns of constraints, a compact path, or a source/copy split. The constraint is also unforgiving:

- The rule must be learnable from very few examples.
- The answer must fit in one tap target or one exact selected set.
- Symbols must remain readable at phone size.
- The board cannot depend on tiny annotations.
- Any source-world knowledge must be taught in the briefing if it is not obvious.

## Production Puzzle Inventory

| Type | Source world | Answer mode | Difficulty | Rule mechanic | Validator |
| --- | --- | --- | --- | --- | --- |
| Suit Cycle | Playing cards | identifyOne | 1 | Suit cycle shifts across rows | Expected-board mismatch |
| Pair Pact | Relationships | identifyOne | 1 | Established partner pairs | Expected-board mismatch |
| Domino Chain | Dominoes | identifyOne | 1 | Neighboring halves match | Expected-board mismatch |
| Dice Sum | Dice | identifyOne | 1 | Row target sums | Expected-board mismatch |
| Card Straight | Playing cards | identifyOne | 2 | Rank progressions plus suit rhythm | Expected-board mismatch |
| Logic Gate Row | Digital logic | identifyOne | 2 | Tap the wrong output in 0/1 gate truth rows | Output-target validator |
| Mirror Trap | Relationships | identifyOne | 2 | Mirror plus transformed partner | Expected-board mismatch |
| Rotation Logic | Compass | identifyOne | 2 | Directions rotate by fixed turns | Expected-board mismatch |
| Latin Trap | Latin square | identifyOne | 2 | One of each symbol per row/column | Expected-board mismatch |
| Animal Food Web | Ecology | identifyOne | 2 | Obvious food-chain order | Expected-board mismatch |
| Compass Rose | Compass | identifyOne | 2 | Bearing rotation sequence | Expected-board mismatch |
| Chess Attack | Chess | identifyOne | 3 | Numbered piece attacks next piece | Independent chess attack validator |
| Poker Hand Trap | Playing cards | identifyOne | 3 | Row declares hand class | Expected-board mismatch |
| Train Route | Routes | identifyOne | 3 | Continuous route from S to F | Expected-board mismatch |
| Checkers Jump | Checkers | identifyOne | 3 | Numbered diagonal movement | Movement validator |
| Go Capture Max | Go / baduk | chooseOne | 4 | Best move captures most white stones | Independent capture validator |
| Go Liberties | Go / baduk | multiSelect | 4 | Select all liberties of marked group | Independent liberty validator |
| Yahtzee Fix | Yahtzee / dice | multiSelect | 3 | Select two dice that break a visible category | Exact answer-set validator |
| Maze Exit | Maze / map | chooseOne | 2 | Trace from S to the one reachable exit | Reachability validator |
| Maze Key Exit | Maze / map | twoStep | 3 | Choose the reachable key and matching exit | Two-step answer validator |
| Scrabble Cross | Word tiles | twoStep | 3 | Place one rack tile to form valid crossing words | Two-step answer validator |
| Mini Crossword Fill | Crossword / words | twoStep | 2 | Place one rack letter into one blank crossing | Word uniqueness validator |
| Crossword Pair | Crossword / words | multiSelect | 3 | Select two blanks and two rack letters that repair crossings | Word-set validator |
| Tetris Fit | Polyominoes | multiSelect | 3 | Select the exact tetromino placement cells | Exact answer-set validator |
| Circuit Switch Pair | Circuits | multiSelect | 3 | Select two switches that turn on the target light | Switch-pair validator |
| Maze Bridge Repair | Maze / map | multiSelect | 3 | Repair two broken bridge tiles to connect S to E | Reachability pair validator |
| Row Rhythm | Logic grid | identifyOne | 2 | Tap the row that breaks a row grammar | Row-target validator |

## Retired / Lab-Only Inventory

| Type | Source world | Status | Reason |
| --- | --- | --- | --- |
| Rule Rows | Abstract grammar | Retired from daily | Too easy to solve by diagonal scanning and missing-symbol completion. |
| Conveyor Shift | Abstract grammar | Retired from daily | Too easy to solve by phase scanning rather than deeper reasoning. |
| Knight Path | Chess | Retired from daily | Valid but narrow; Chess Attack gives piece variety and better texture. |

## Candidate Pattern Systems

| Candidate | Source world | Symbol set | Rule mechanic | Possible break modes | Difficulty | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Rule Rows | Abstract grammar | Moon, crown, diamond, eye | Shifted row recipe | Wrong next symbol, duplicate, outside symbol | 1 | Retired/lab |
| Conveyor Shift | Abstract grammar | Five glyph tiles | Row-to-row shift | Wrong position, duplicate, neighboring-column symbol | 2 | Retired/lab |
| Rotation Logic | Compass | N, E, S, W, diagonals | Fixed rotation step | Wrong turn, opposite, skipped bearing | 2 | Implemented |
| Latin Trap | Latin square | Five glyphs | One of each symbol per row/column | Row duplicate, column duplicate, missing-symbol trap | 2 | Implemented |
| Pair Pact | Relationships | Moon/sun, key/lock, bee/flower | Stable partner pairs | Wrong partner, repeated leader, outsider | 1 | Implemented |
| Mirror Trap | Mirror mapping | Source/copy symbol pairs | Mirror plus transformation | Unchanged, wrong paired symbol, swapped partner | 2 | Implemented |
| Card Straight | Playing cards | Ranks and suits | Rank progression with suit rhythm | Wrong rank, wrong suit, duplicate rank, skipped rank | 2 | Implemented |
| Suit Cycle | Playing cards | Card ranks and suits | Suit cycle shifts by row | Wrong cycle position, duplicate suit, rank/suit mismatch | 1 | Implemented |
| Poker Hand Trap | Playing cards | Pair/flush/run/trips rows | Each row forms a named hand class | Broken pair, broken flush, broken straight, wrong trips | 3 | Implemented |
| Knight Path | Chess | Numbered knights | Legal knight L-moves | Orthogonal move, diagonal move, wrong L distance | 3 | Retired/lab |
| Chess Attack | Chess | Rook, bishop, knight, king, queen | Piece attacks next numbered piece | Bishop/rook swap, knight one-step, king too far, queen crooked | 3 | Implemented |
| Checkmate Net | Chess | Kings, guards, targets | Every target square controlled | Uncovered escape, illegal guard, blocked line | 5 | Backlog |
| Checkers Jump | Checkers | Numbered checkers | Diagonal movement | Orthogonal step, wrong diagonal direction, fake jump | 3 | Implemented |
| Go Capture Max | Go / baduk | Black stones, white stones, empty points | Best move captures most stones | Tie trap, non-capture, wrong last liberty | 4 | Implemented |
| Go Liberties | Go / baduk | Marked group and empty points | Select all orthogonal liberties | Missing liberty, diagonal false liberty, extra non-liberty | 4 | Implemented |
| Go Save Group | Go / baduk | Atari group and liberties | Choose saving move or capture threat | Self-atari, wrong liberty, false capture | 4 | Backlog |
| Logic Gate Row | Digital logic | 0, 1, AND, OR, XOR, NAND | Input/gate/output truth row | Wrong AND, OR, XOR, NAND output | 2 | Implemented |
| Circuit Trace | Electronics | Wires, gates, outputs | Signals flow through a tiny circuit | Broken wire, inverted output, impossible gate | 4 | Backlog |
| Domino Chain | Dominoes | Domino numeric halves | Neighbor halves match | Left mismatch, right mismatch, swapped domino | 1 | Implemented |
| Dice Sum | Dice | Die faces 1-6, sum target | Small arithmetic totals | Sum high, sum low, wrong die | 1 | Implemented |
| Yahtzee Fix | Yahtzee / dice | Five dice and category labels | Select the two dice that prevent the category | Ambiguous pair, wrong category, near-full-house decoy | 3 | Implemented |
| Train Route | Transit maps | S, F, track straights and curves | One continuous connected route | Broken turn, dead end, wrong straight, bad station exit | 3 | Implemented |
| Maze Exit | Maze / maps | Start, walls, paths, exits | Trace reachable route | Unreachable exit, blocked bridge, wrong branch | 2 | Implemented |
| Maze Key Exit | Maze / maps | Start, keys, exits, walls | Choose reachable key plus opened exit | Wrong key, wrong exit, unreachable pair | 3 | Implemented |
| Scrabble Cross | Word tiles | Board letters, blank square, rack letters | One tile makes crossing words | Bad horizontal word, bad vertical word, wrong square | 3 | Implemented |
| Mini Crossword Fill | Crossword / words | Fixed letters, blank square, rack letters | One rack letter completes both crossing words | Wrong blank, wrong letter, one invalid crossing | 2 | Implemented |
| Crossword Pair | Crossword / words | Fixed letters, two blanks, rack letters | Two blanks and two letters complete all crossings | Wrong square set, wrong letter set, ambiguous assignment | 3 | Implemented |
| Tetris Fit | Polyominoes | Tetromino cells and target row | One piece placement completes the row | Shifted placement, wrong tetromino, incomplete line | 3 | Implemented |
| Circuit Switch Pair | Circuits | Switches, wires, target light | Exactly two switches flip the target on | One switch short, wrong pair, decoy switch | 3 | Implemented |
| Maze Bridge Repair | Maze / maps | Start, exit, walls, broken bridges | Exactly two repairs reconnect the route | Wrong bridge, alternate invalid pair, blocked shortcut | 3 | Implemented |
| Row Rhythm | Logic grid | Repeated row symbols | Each row follows a count-and-order grammar | Broken row, duplicate token, wrong row total | 2 | Implemented |
| Animal Food Web | Ecology | Plant, insect, frog, snake, hawk | Food-chain order | Wrong habitat, wrong chain position, predator/prey mismatch | 2 | Implemented |
| Compass Rose | Compass / clock | Cardinal and diagonal directions | Repeated bearing rotation | Wrong amount, opposite, skipped bearing | 2 | Implemented |
| Calendar Week | Calendar | Days and weekend markers | Day cycle and grouping | Skipped day, wrong weekend marker, impossible sequence | 2 | Backlog |
| Music Measure | Music | Notes, rests, beats | Measures have equal beat totals | Too many beats, too few beats, wrong rest value | 3 | Backlog |
| Chemistry Valence | Chemistry | H, O, C, N, bonds | Bond counts match valence | Overbonded atom, underbonded atom, wrong bond type | 4 | Backlog |
| Sports Formation | Sports | Player positions, lanes, ball | Formation symmetry or coverage | Offside-like placement, uncovered lane, illegal receiver | 3 | Backlog |
| Language Pattern | Linguistics | Prefix/root/suffix tokens | Words follow grammar slots | Bad suffix, wrong agreement, impossible order | 4 | Backlog |
| Map Compass Walk | Maps | Directions and landmarks | Path follows bearings to landmarks | Wrong turn, impossible crossing, missed landmark | 3 | Backlog |
| Set Attribute Grid | Set-style logic | Shape, fill, count, orientation | Rows control attributes | Wrong fill, wrong count, wrong orientation | 4 | Backlog |

## Survival Run Selection

Survival Run replaces the fixed three-round daily format. The stream is deterministic from the local date and session attempt, but it is long enough for practical play. The selector keeps retired puzzles out of the main run, avoids immediate puzzle-type repeats, rotates source worlds, and avoids back-to-back card, Go, or movement/path families when alternatives exist.

Difficulty ramps by level:

- Levels 1-3: approachable but not trivial.
- Levels 4-8: medium reasoning.
- Levels 9+: harder source-world puzzles and denser variants.

The stream still uses break signatures, so a replay attempt changes the break mode, answer location, or required answer set instead of merely reshuffling the same board.

## Three-Set Free Play Selection

Three-Set Free Play uses the same deterministic date and session-attempt inputs, but selects exactly three approachable puzzles instead of an open-ended ladder. It avoids retired puzzle types, prefers difficulty 1-3, and includes multi-click or word puzzles often enough to teach the broader action model without turning every Free Play set into a gauntlet.

Free Play wrong attempts add mistakes and keep the current puzzle active. Its score is:

```text
Math.ceil(totalActiveMs / 1000) + mistakes * 10
```

This lets players practice hard source-world mechanics while still caring about clean solves.

## Targeting Model

Targeting metadata prevents instruction/click mismatch:

| Target type | Player instruction | Accepted answer |
| --- | --- | --- |
| `cell` | Tap the wrong tile, symbol, card, or move. | One exact candidate cell. |
| `row` | Tap the row that breaks the rule. | Any cell in the answer row. |
| `column` | Tap the column that breaks the rule. | Any cell in the answer column. |
| `outputCell` | Tap the wrong output. | One enabled output cell; inputs and gates are disabled. |
| `multiSelect` | Select exact squares, then submit. | One exact answer set. |
| `twoStep` | Make a planned two-step move, then submit. | One exact ordered role/token pair. |

Logic Gate Row now uses output-only targeting by default. Dice Sum switches between wrong-die and wrong-total targeting so the instruction names the enabled targets. Row Rhythm exists partly as a validation fixture for whole-row behavior.

## Two-Click And Multi-Answer Design

Some source worlds need more than one selected square. Go Liberties, Yahtzee Fix, Tetris Fit, Maze Key Exit, and Scrabble Cross would be awkward if every tap immediately counted as a final move.

The rule is:

- Taps are planning when the puzzle uses `multiSelect` or `twoStep`.
- **Submit Move** is the committed move.
- A wrong committed move ends Survival Run.
- Correct submissions pause timers and show feedback.

This preserves the one-wrong-move tension while preventing accidental finger taps from ending a run during a multi-cell solve.

## Chess Attack Notes

Chess Attack uses all non-pawn chess pieces: king, queen, rook, bishop, and knight. Current production boards aim for 9-10 numbered pieces on the 5x5 board. The piece and number are rendered on the same square with a small corner badge. The rule is sequence-based: each numbered piece must legally attack the next numbered piece.

The validator computes:

- rook attacks along a row or column
- bishop attacks diagonally
- queen attacks as rook or bishop
- knight attacks in an L-shape
- king attacks one square in any direction

The correct answer is the first numbered attacker that fails. Later consequences do not create extra answers. Validators reject pawns, boards with too few numbered pieces, and boards where the first illegal attacker does not match the declared answer.

## Go Puzzle Notes

Go uses simplified 5x5 rules:

- Orthogonal adjacency connects groups.
- Empty orthogonal neighbors are liberties.
- Diagonal empty points are not liberties.
- A move captures a white group when it fills that group's last liberty.
- Ko and whole-board life-and-death are out of scope.

Go Capture Max is `chooseOne`: the player taps the empty point that captures the most white stones. The board is denser than the previous version, aiming for 12-18 stones, multiple white groups, and decoy captures. The board is valid only if one best move exists and captures at least two stones in medium/hard variants.

Go Liberties is `multiSelect`: the player selects every liberty of the marked group and submits. Marked groups are usually size 2-4, and the correct liberty set is exact. Diagonal empty points are intentionally used as decoys because they are not liberties.

## Yahtzee Notes

Yahtzee Fix uses five-dice rows with a visible category. The implemented version asks for exactly two dice that prevent a category such as a full house or large straight. This creates a compact multi-select reasoning task without requiring poker-like card knowledge or long arithmetic.

## Maze Notes

Maze Exit uses a 5x5 route map with a start, walls, paths, and multiple exits. The player chooses the single exit reachable by open paths.

Maze Key Exit adds a second committed choice: choose the reachable key, then choose the exit it opens. The two-step answer mode keeps this legible in the main game and in the lab.

## Word And Tetris Notes

Scrabble Cross uses a curated word list so the solve is about crossing-word logic, not obscure vocabulary. The player chooses one blank square and one rack tile.

Mini Crossword Fill is a tighter two-step word puzzle with one blank and one rack letter. Crossword Pair expands that into a planned multi-select repair: choose two blanks plus the two rack letters that complete the small crossing system. Rack tiles are visually separate from the 5x5 board so players do not confuse board squares with candidate letters.

Tetris Fit asks the player to choose the exact four cells for a tetromino placement that completes a target row. The renderer uses compact colored cells and letters rather than animated pieces, keeping the static-site implementation simple and accessible.

## Circuit And Repair Notes

Circuit Switch Pair is a small multi-select logic puzzle. The player selects exactly two switches to flip so the target light turns on. The validator checks the declared solution pair, switch metadata, and answer set uniqueness.

Maze Bridge Repair is a route-repair puzzle. Broken bridges are candidate cells; exactly one pair reconnects `S` to `E`. Its validator computes reachability with and without the selected repairs so it stays a maze puzzle instead of a decorative path grid.

## Avoiding Ambiguity

Every generated board should satisfy these constraints:

- The rule has enough evidence on the board.
- The answer is not the only visually rare symbol.
- The wrong cell is not made unique by color alone.
- Pair systems show correct pairs more than once when possible.
- Movement systems are traceable by visible numbers.
- Math and logic systems use small values.
- Real-world knowledge is taught in the briefing.
- Feedback names the specific reason the tapped cell breaks the rule.
- Multi-select puzzles require an exact set, not a vague region.

## Independent Validators

Every generated board needs a validator because procedural puzzles fail in quiet ways. A generator can accidentally create two valid answers, hide the rule, reuse a stale break, or choose a break that creates an earlier consequence.

Validators enforce the product promise. They check board size, required metadata, active cells, answer mode, unique single answer or exact multi-answer/two-step set, answer agreement, difficulty ranges, source-world diversity, retired-type exclusion, session variation, and survival stream rules.

The current strongest validators encode domain logic independently:

- Chess Attack computes legal attacks from piece positions.
- Go Capture Max computes capture scores from the board.
- Go Liberties computes the marked group's liberties from the board.
- Maze Exit computes reachability from the visible walls and paths.
- Targeting validation checks that row, column, output, exact-cell, multi-select, and two-step instructions match enabled click targets.
- Free Play validation checks the three-puzzle selector, mistake behavior, and lower-is-better scoring formula.
- Word-puzzle validation checks curated vocabulary, rack separation, and unique square/letter or blank/letter solutions.
- Survival validation tests the first 50 levels across 300 dates and five session attempts.

Expected-board validators remain useful for controlled pattern systems, but more production puzzle types should graduate to independent domain validators over time.

## Why Real-World Systems Help

Real-world systems make puzzles stickier because the symbols have consequences. A knight invites movement reasoning. A domino invites matching. A logic gate invites evaluation. A Go stone invites liberty counting. A food chain invites ordering. These systems create a small act of recognition before the solve, which makes the violation feel clever instead of arbitrary.

The goal is not trivia. The briefing must teach any needed rule, and the board must prove the answer. The source world gives the rule flavor and memory; the validator gives it rigor.
