# One Wrong Move

One Wrong Move is a daily browser puzzle game. You briefly study a perfect 5x5 pattern, then one cell changes. Tap or click the single wrong cell across three increasingly difficult rounds.

The MVP is plain HTML, CSS, and JavaScript. It runs as a static site and does not use React, Vite, TypeScript, canvas, or external frontend libraries.

## Run Locally

Open `public/index.html` directly in a browser.

You can also serve the folder with any static server:

```sh
python3 -m http.server 8080 --directory public
```

Then visit `http://localhost:8080`.

## Netlify Deploy Settings

- Build command: leave blank
- Publish directory: `public`

The same settings are captured in `netlify.toml`.

## MVP Limitations

- The daily puzzle uses the browser's local date.
- Share text copies to the clipboard when the browser allows it; otherwise the result appears in an alert.
- There is no archive of previous daily puzzles.
- Scoring is intentionally simple: faster solves and fewer mistakes produce a higher score.
- The game state resets when the page reloads.
