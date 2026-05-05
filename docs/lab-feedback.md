# One Wrong Move Lab Feedback

The puzzle lab is a local-only playtesting tool for deciding which puzzle types should be kept, tuned, cut, or moved to Free Play or lab-only status.

Open it locally at:

```text
http://localhost:8080/lab.html
```

## Privacy

Feedback is stored only in the current browser's `localStorage` under:

```text
oneWrongMove.labFeedback.v1
```

There is no server, analytics service, account, or personal data collection.

## Review Workflow

Use the lab in four passes:

1. Explore the puzzle inventory with filters for source world, answer mode, target type, status, review state, decision, tag, and search.
2. Build a Review Queue from all active types, the current Ladder stream, the current Free Play set, unreviewed puzzles, hard puzzles, confusing puzzles, object/theme puzzles, board-game puzzles, word puzzles, or number puzzles.
3. Try samples blind, reveal answers, regenerate variants, and save a rating.
4. Export JSON, CSV, Markdown, or a ChatGPT-ready prompt for the next tuning pass.

Direct links are supported:

```text
lab.html?type=othello-best-flip&seed=2026-05-03&attempt=2&showAnswer=0
```

## Rating Meanings

- **Fun**: `1` boring, `3` okay, `5` excellent.
- **Difficulty felt**: `1` trivial, `3` right, `5` brutal.
- **Clarity**: `1` confusing, `3` okay, `5` crystal clear.
- **Fairness**: `1` arbitrary, `3` okay, `5` elegant.

## Decisions

- **Keep**: strong enough for current production use.
- **Tweak**: basically promising, but needs UI, copy, generation, or difficulty tuning.
- **Cut**: should leave normal play.
- **Needs more testing**: not enough evidence yet.

## Tags

The controlled tag list is intentionally practical:

- too easy
- too hard
- confusing
- boring
- fun
- unfair
- ambiguous target
- unclear instructions
- symbol unclear
- too much trivia
- too much arithmetic
- visually noisy
- visually excellent
- satisfying
- needs better example
- answer felt arbitrary
- great for Ladder
- great for Free Play
- lab only

## Export Formats

**Download JSON** includes the version, export time, records, schema, and summary by puzzle type.

**Download CSV** writes one row per feedback record for spreadsheet review.

**Copy Markdown Summary** groups feedback into Keep, Tweak, Cut, Too Easy, Too Hard, Confusing, Best Puzzles, and Worst Puzzles.

**Copy ChatGPT Feedback Prompt** wraps the Markdown summary in a prompt asking Codex to propose the next tuning pass.

## Clearing Feedback

Use **Clear all lab feedback** in the Export section. The lab confirms before deleting records from localStorage.
