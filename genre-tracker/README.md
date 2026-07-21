# 🎛️ Genre Explorer

A tiny, mobile-first web app for tracking electronic music genre exploration —
branching out from an anchor artist (**Maribou State**) into genre branches,
logging what you listen to, and planning what to explore next week.

## How it works

- **Branches** — genre branches (e.g. "Downtempo/Chillout", "UK Bass/2-Step"),
  each with seed artists and a parent/anchor it branches from. The list is
  color-coded by the best rating logged so far:
  🟢 loving it · 🟡 it's ok · 🔴 not for me · ⚪ unexplored.
- **Log** — record a track or artist under a branch with a 👍 / 😐 / 👎
  verdict and an optional note.
- **This Week** — pick the 2 branches you're exploring this week; past weeks
  are kept as a history.
- **Next Week** — suggests 👍 branches to go deeper on, unexplored branches to
  sample, and 😐 branches worth another chance.

## Data

Everything lives in `localStorage` on your device — no account, no backend,
works offline. Use **Export JSON** / **Import JSON** on the Branches tab to
back up or move your data between devices.

## Running it

It's a single self-contained file: open `index.html` in any browser, or serve
the folder statically, e.g.:

```sh
npx serve genre-tracker
```

For phone use, host it anywhere static (GitHub Pages, Vercel, Netlify) and
"Add to Home Screen".
