# One Wrong Move Game Design

## Why Prior Versions Failed

The first MVP was a memory test: players briefly saw a perfect board, then had to remember which cell changed. That made the puzzle feel vague because success came from recall, not reasoning.

The second version fixed the memory problem but became too literal. A stray diagonal tile, a simple copy mismatch, and an illegal path were objectively solvable, but they felt closer to children's odd-one-out exercises than an adult daily puzzle.

## New Logic-First Principle

The current design principle is:

> One board. One visual rule system. One symbol breaks it.

The active board must contain enough information to infer the rule. The answer must be unique, but it should require pattern reasoning rather than visual scanning. Symbols are used as meaningful puzzle tokens, not decoration.

## Round Types

### Round 1: Rule Rows

Rows use a five-symbol recipe made from moons, diamonds, crowns, lightning, and eyes. Each row is the same cycle shifted one place. Exactly one glyph is replaced, breaking that row's grammar.

This round introduces the player to symbolic sequence logic without needing numbers or color.

### Round 2: Rotation Logic

Arrows rotate by a fixed amount as the player reads across each row. Each row also starts one arrow later than the row before it. Exactly one arrow misses the rotation.

This round asks the player to reason about transformation and position at the same time.

### Round 3: Mirror Trap

The right side mirrors the left, but every source symbol transforms into a paired counterpart. The board repeats those pairings enough times to infer the mapping. Exactly one right-side symbol uses the wrong partner.

This round is higher-order because the player must infer a mapping first, then apply the mirror rule.

## Mobile-First Design

The app is designed as a phone puzzle first. The header is compact, the rule card sits close to the board, and all cells are button elements large enough for touch and keyboard activation.

The visual style is restrained: serif title, monochrome glyph badges, muted dividers, and direct feedback. It aims for premium and minimal rather than toy-like.

## Laptop Phone Frame

On laptop and desktop screens, the app is constrained to a centered smartphone-sized frame with rounded corners, a subtle shadow, and internal scrolling. The layout should never stretch wide, because the puzzle rhythm depends on a tight handheld board.

## Accessibility Decisions

- Cells are native buttons.
- ARIA labels describe row, column, and symbol identity.
- The answer never depends on color alone.
- Feedback uses text, border treatment, and symbols.
- Keyboard and pointer activation share the same code path.

## Future Opportunities

- Daily archive with replayable previous puzzles.
- Leaderboard using score, time, and mistakes.
- Practice mode with unlimited non-daily boards.
- More adult symbolic systems: Set-style attributes, grammar grids, paired operators, graph constraints, and hidden alphabets.
- Local solve history so refreshing does not erase today's result.
