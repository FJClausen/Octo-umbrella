# 🎂 Asha's Adventure

A little pixel-art platformer for Asha's birthday. She plays herself, walks
back through fourteen years of family history, answers a question at every
checkpoint, jumps her way across each era, and meets Fabian and Naomi at the
end — where the group photo and the birthday song unlock.

- **Seven chapters** — The Early Days, The Wedding, The House, Naomi Arrives,
  The Arboretum, Germany, Costa Rica — then the reunion.
- **Two questions per chapter**, each with a family photo. Some photos stay
  hidden until she answers, and two of them *swap* on a correct answer — the
  house changes color, and a photo of the three of them becomes Naomi on her
  bike.
- **An animal per chapter**, won by answering that chapter's second question.
  Each one then follows her for the rest of the game, so a parade builds up
  behind her: chicken, pelican, raccoon, dodo, praying mantis, red panda,
  capuchin. The pelican flies; the rest walk.
- **A clock and a podium.** Falling costs ten seconds, and the ending shows her
  time against the three fastest runs saved on the device.
- **Forgiving on purpose** — unlimited lives, instant respawn at the last
  checkpoint, no enemies, and wrong answers only ever cost a retry (a hint
  appears after the second miss). Falling only costs time, never the run —
  though her hair does get bigger with every tumble.
- **Phone first** — on-screen left / right / jump under the thumbs. Keyboard
  (arrows + space) works too.
- **Saves automatically**, so she can close the tab and pick it back up.
- **No build step, no dependencies, no backend.** Plain HTML, CSS and ES
  modules. Sound and characters are generated in code, so the only files to
  upload are the photos.

---

## Running it locally

Any static file server works — it just needs to be served over HTTP, not
opened as a `file://` path, because the game uses ES modules.

```bash
cd asha-game
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to Vercel

1. Push this folder to GitHub.
2. In Vercel, **Add New → Project**, import the repo.
3. Set **Root Directory** to `asha-game`.
4. Framework preset: **Other**. No build command, no output directory.
5. Deploy — you get a link you can text to her.

If you'd rather it live in its own repository, this folder is completely
self-contained: copy it out, `git init`, and deploy exactly the same way.

## Making it private

The link is unguessable but public. If you want it locked down, the simplest
option is Vercel's built-in **Password Protection** (Project → Settings →
Deployment Protection). The game itself only asks for a name — it's a greeting,
not a login.

---

## The characters

All three are hand-drawn 12-wide pixel grids in `src/sprites.js`, coloured from
the family photos. The animals live in the same file:

- **Asha** — deep brown skin, cropped dark afro, orange top, teal shorts.
- **Naomi** — big caramel curls, warm tan skin, orange top, pink sandals, and a
  shorter body so she reads as a kid next to her parents.
- **Fabian** — blond hair, light stubble, black top, blue shorts.

Every colour is a single value at the top of the file, so any of them can be
re-dressed in seconds. The grids draw at exactly one pixel per cell — height
differences are built into the grids rather than scaled, because fractional
scaling turns crisp pixel art blurry on a phone.

## What to edit

| I want to change… | Edit this |
|---|---|
| Questions, answers, hints, chapter text | `src/data.js` |
| Which animal belongs to which chapter | `src/data.js` (`animal:`) |
| Whether a photo is hidden or swaps | `src/data.js` (`reveal:`, `showFirst:`) |
| Which photo shows where | `src/data.js` (`photos: [...]`) |
| The photos themselves | drop files into `photos/` — see `photos/README.md` |
| The final message and group photo | `src/data.js` (bottom, `finale`) |
| Hair / skin / clothing colours of the characters | `src/sprites.js` (top) |
| Jump feel, speed, gravity | `src/engine.js` (top) |
| The layout of a chapter's jumps | `src/levels.js` (`runs`) |
| Backgrounds and scenery | `src/levels.js` (`drawBackground`) |
| Music and sound effects | `src/audio.js` |

Everything is commented, and none of it needs rebuilding — save the file and
reload the page.

## How a chapter is put together

```
chapter card  →  checkpoint 1  →  question + photo  →  parcours
              →  checkpoint 2  →  question + photo  →  animal joins  →  parcours
              →  goal  →  chapter complete card  →  next chapter
```

And at the very end, she walks home, the three of them bounce around each other
with the whole parade while Happy Birthday plays, and only then does the card
with the group photo, the message and her time come up.

Falling into a gap respawns her at the last checkpoint she reached, with the
question already answered — she never has to redo a quiz.

## Files

```
asha-game/
├── index.html        screens and layout
├── styles.css        all styling, phone-first
├── vercel.json       static hosting config
├── photos/           your uploaded photos (+ naming guide)
└── src/
    ├── data.js       ← the story: chapters, questions, photos
    ├── main.js       game flow, saving, input
    ├── engine.js     physics, collision, rendering
    ├── levels.js     level layouts + painted backgrounds
    ├── sprites.js    the pixel characters and the animals
    └── audio.js      chiptune music, sound effects, birthday song
```
