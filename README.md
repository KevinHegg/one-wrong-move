# One Wrong Move

One Wrong Move is a daily mobile-first visual logic puzzle:

> One board. One visual rule system. One symbol breaks it.

Each round asks the player to infer a compact symbolic rule and tap the single violating symbol. The game no longer depends on memorizing a previous board, and it no longer uses plain colored-square odd-one-out mechanics.

The app is plain HTML, CSS, and JavaScript. It runs as a static site and does not use React, Vite, TypeScript, canvas, or external frontend libraries.

## Current Rounds

- Round 1: Rule Rows. Rows use the same five-symbol recipe, shifted one place. One glyph breaks the row grammar.
- Round 2: Rotation Logic. Arrows rotate in a predictable sequence. One arrow misses its turn.
- Round 3: Mirror Trap. The right side mirrors the left with transformed symbol pairs. One mirrored symbol uses the wrong counterpart.

## Run Locally

Open `public/index.html` directly in a browser.

You can also serve the folder with Python:

```sh
python3 -m http.server 8080 -d public
```

Then visit `http://localhost:8080`.

## Netlify Deploy Settings

- Build command: leave blank
- Publish directory: `public`

The same settings are captured in `netlify.toml`.

## Current Limitations

- The daily puzzle uses the browser's local date.
- There is no daily archive, leaderboard, or practice mode yet.
- The puzzle generator uses deterministic templates rather than a large procedural puzzle search.
- Share text copies to the clipboard when the browser allows it; otherwise it appears in an alert and selectable text area.
- The game state resets when the page reloads.
