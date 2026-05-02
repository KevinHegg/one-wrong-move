# Pattern Systems Catalog

## Design Principle

Symbols are rule carriers, not decoration.

The player should never be asked to scan for a rare icon just because it is rare. A symbol earns its place when it brings structure: rank, suit, movement, adjacency, pairing, sequence, count, direction, habitat, input/output, or another inferable relation.

## Why Abstract Glyphs Are Not Enough

The abstract glyph pool improved the original memory MVP, but it still risked feeling arbitrary. A moon, crown, eye, and diamond can form rows and pairs, but they do not carry much built-in meaning. That makes the player ask, "What convention did the generator invent?" instead of, "What rule can I infer?"

Real-world systems give the puzzle a shared vocabulary. Cards suggest rank and suit. Chess suggests movement. Go suggests liberties. Logic gates suggest truth tables. These systems make the solve more memorable and let difficulty come from reasoning instead of visual clutter.

## 5x5 Constraints

A 5x5 board is small enough for phones and large enough for evidence. It can show five rows of examples, five columns of constraints, a compact path, or a source/copy split. The constraint is also unforgiving:

- The rule must be learnable from very few examples.
- The answer must fit in one tap target.
- Symbols must remain readable at phone size.
- The board cannot depend on tiny annotations.
- Any source-world knowledge must be taught in the briefing if it is not obvious.

## Candidate Pattern Systems

| Candidate | Source world | Symbol set | Rule mechanic | Possible break modes | Difficulty | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Rule Rows | Abstract grammar | Moon, crown, diamond, eye | Shifted row recipe | Wrong next symbol, duplicate, outside symbol | 1 | Implemented |
| Conveyor Shift | Abstract grammar | Five glyph tiles | Row-to-row shift | Wrong position, duplicate, neighboring-column symbol | 2 | Implemented |
| Rotation Logic | Compass | N, E, S, W, diagonals | Fixed rotation step | Wrong turn, opposite, skipped bearing | 2 | Implemented |
| Latin Trap | Latin square | Five glyphs | One of each symbol per row/column | Row duplicate, column duplicate, missing-symbol trap | 2 | Implemented |
| Pair Pact | Pair grammar | Moon/sun, key/lock, etc. | Stable partner pairs | Wrong partner, unchanged leader, outsider | 2 | Implemented |
| Path Rhythm | Map path | Numbered moves | Alternating movement rhythm | Wrong turn, repeated axis, diagonal slip | 3 | Implemented |
| Mirror Trap | Mirror mapping | Source/copy symbol pairs | Mirror plus transformation | Unchanged, wrong paired symbol, swapped partner | 3 | Implemented |
| Card Straight | Playing cards | Ranks and suits | Rank progression with suit rhythm | Wrong rank, wrong suit, duplicate rank, skipped rank | 1 | Implemented |
| Suit Cycle | Playing cards | Card ranks and suits | Suit cycle shifts by row | Wrong cycle position, duplicate suit, rank/suit mismatch | 2 | Implemented |
| Knight Path | Chess | Numbered knights | Legal knight L-moves | Orthogonal move, diagonal move, wrong L distance | 3 | Implemented |
| Chess Attack | Chess | Rook, bishop, knight, king, queen | Piece attacks target vector | Bishop/rook swap, knight one-step, king too far | 4 | Implemented |
| Go Liberties | Go / baduk | Black stones, white stones, liberties | Orthogonal liberty count | Too few liberties, too many liberties, suicide-like fill | 4 | Implemented |
| Logic Gate Row | Digital logic | 0, 1, AND, OR, XOR, NAND | Input/gate/output truth row | Wrong AND, OR, XOR, NAND output | 2 | Implemented |
| Domino Chain | Dominoes | Domino pairs | Neighbor halves match | Left mismatch, right mismatch, swapped domino | 2 | Implemented |
| Dice Sum | Dice | Die faces 1-6, sum target | Small arithmetic totals | Sum high, sum low, wrong die | 2 | Implemented |
| Checkers Jump | Checkers | Numbered checkers | Diagonal movement | Orthogonal step, wrong diagonal direction, fake jump | 3 | Implemented |
| Animal Food Web | Ecology | Plant, insect, frog, snake, hawk | Food-chain order | Wrong habitat, wrong chain position, predator/prey mismatch | 2 | Implemented |
| Compass Rose | Compass / clock | Cardinal and diagonal directions | Repeated bearing rotation | Wrong amount, opposite, skipped bearing | 2 | Implemented |
| Poker Hand Grid | Playing cards | Five-card hands | Each row forms a hand class | Broken pair, broken flush, broken straight | 4 | Backlog |
| Checkmate Net | Chess | Kings, guards, targets | Every target square controlled | Uncovered escape, illegal guard, blocked line | 5 | Backlog |
| Go Capture Race | Go / baduk | Stones and liberties | Groups should be in atari or safe | Wrong capture status, false liberty, disconnected group | 5 | Backlog |
| Circuit Trace | Electronics | Wires, gates, outputs | Signals flow through a tiny circuit | Broken wire, inverted output, impossible gate | 4 | Backlog |
| Train Routes | Transit maps | Stations, colored lines, transfers | Routes must connect by shared line | Bad transfer, dead end, wrong line color | 3 | Backlog |
| Music Measure | Music | Notes, rests, beats | Measures have equal beat totals | Too many beats, too few beats, wrong rest value | 3 | Backlog |
| Chemistry Valence | Chemistry | H, O, C, N, bonds | Bond counts match valence | Overbonded atom, underbonded atom, wrong bond type | 4 | Backlog |
| Sports Formation | Sports | Player positions, lanes, ball | Formation symmetry or coverage | Offside-like placement, uncovered lane, illegal receiver | 3 | Backlog |
| Calendar Week | Calendar | Days and weekend markers | Day cycle and grouping | Skipped day, wrong weekend marker, impossible sequence | 2 | Backlog |
| Language Pattern | Linguistics | Prefix/root/suffix tokens | Words follow grammar slots | Bad suffix, wrong agreement, impossible order | 4 | Backlog |
| Map Compass Walk | Maps | Directions and landmarks | Path follows bearings to landmarks | Wrong turn, impossible crossing, missed landmark | 3 | Backlog |
| Set Attribute Grid | Set-style logic | Shape, fill, count, orientation | Each row controls attributes | Wrong fill, wrong count, wrong orientation | 4 | Backlog |

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

## Independent Validators

Every generated board needs a validator because procedural puzzles fail in quiet ways. A generator can accidentally create two valid answers, hide the rule, reuse a stale break, or choose a break that creates an earlier consequence.

Validators enforce the product promise. They check board size, required metadata, active cells, unique answer, answer index agreement, difficulty ranges, source-world diversity, and session variation. The current system validates 300 dates, five session attempts, and all registered puzzle types directly.

The ideal next step is to make each validator encode domain logic independently. For example, the Go validator should count liberties from the board, the chess validator should compute legal attacks, and the card validator should infer rank and suit progressions.

## Why Real-World Systems Help

Real-world systems make puzzles stickier because the symbols have consequences. A knight invites movement reasoning. A domino invites matching. A logic gate invites evaluation. A food chain invites ordering. These systems create a small act of recognition before the solve, which makes the violation feel clever instead of arbitrary.

The goal is not trivia. The briefing must teach any needed rule, and the board must prove the answer. The source world gives the rule flavor and memory; the validator gives it rigor.
