# Photos go here

Drop the image files straight into this folder. No resizing or renaming tools
needed — just match the file names below. JPG or PNG both work.

The game **runs fine with photos missing**: any photo that isn't here yet shows
a "not uploaded yet" placeholder instead, so you can add them one at a time.

## File names

Two photos per checkpoint, two checkpoints per chapter — so four per chapter.

| Chapter | Checkpoint 1 | Checkpoint 2 |
|---|---|---|
| 1. Where It Started (DC, 2011) | `ch1-a.jpg`, `ch1-b.jpg` | `ch1-c.jpg`, `ch1-d.jpg` |
| 2. The Wedding (Tulum, 2015) | `ch2-a.jpg`, `ch2-b.jpg` | `ch2-c.jpg`, `ch2-d.jpg` |
| 3. The House (DC, 2016) | `ch3-a.jpg`, `ch3-b.jpg` | `ch3-c.jpg`, `ch3-d.jpg` |
| 4. Naomi Arrives (DC, 2017) | `ch4-a.jpg`, `ch4-b.jpg` | `ch4-c.jpg`, `ch4-d.jpg` |
| 5. The Arboretum (2020) | `ch5-a.jpg`, `ch5-b.jpg` | `ch5-c.jpg`, `ch5-d.jpg` |
| 6. Papa's Germany | `ch6-a.jpg`, `ch6-b.jpg` | `ch6-c.jpg`, `ch6-d.jpg` |
| 7. Pura Vida (Costa Rica) | `ch7-a.jpg`, `ch7-b.jpg` | `ch7-c.jpg`, `ch7-d.jpg` |

Plus the last one:

| The ending | `family.jpg` — the group photo she unlocks |
|---|---|

## Tips

- Photos are shown in a **4:3 box, cropped to fill**. Faces near the centre
  survive the crop best.
- Anything from a phone camera is already plenty sharp. If a file is over
  ~3 MB it's worth shrinking, just so it loads fast on mobile data.
- Want a different photo somewhere? Change the file name in
  `../src/data.js` — each checkpoint has a `photos: [...]` line.

## For the character art

Separately from the game photos, send us **1–2 clear, well-lit face photos of
each of the three of you**. Those don't go in this folder — they're only for
tuning the pixel characters' hair and skin colours in `../src/sprites.js`.
