# Snake

A simple browser-based Snake game. Pure HTML/CSS/JS, no build step or dependencies.

## Play

Open `index.html` in any browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Controls

- Arrow keys or WASD to move
- Space to start / pause / resume
- On-screen arrow buttons for touch devices

## Stats

Your high score is saved automatically in the browser's `localStorage`, so it persists between visits on the same device/browser. Use the "Reset High Score" button to clear it.

## Deploying with GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings, go to **Pages**, set the source branch to `main` and folder to `/ (root)`.
3. Your game will be live at `https://<username>.github.io/<repo-name>/`.
