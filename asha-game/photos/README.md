# Photos

Drop image files straight into this folder — the names below are what the game
looks for. JPG and PNG both work.

The game **runs fine with photos missing**: anything absent shows a "not
uploaded yet" placeholder instead, so nothing breaks.

## Where each photo appears

One photo per question. A few questions swap one photo for another when she
answers correctly.

| Chapter | Question | Photo |
|---|---|---|
| 1 · The Early Days | The High Heel Race | `ch1-c.jpg` |
| | The chicken in La Palma | `ch1-a.jpg` |
| 2 · The Wedding | The rehearsal dinner | `ch2-b.jpg` → **swaps to** `ch2-a.jpg` |
| | The pelican | `ch2-c.jpg` |
| 3 · The House | What color before Todd | `ch3-b.jpg` → **swaps to** `ch3-a.jpg` |
| | The neighbor's bathrobe | `ch3-c.jpg` — hidden until correct |
| 4 · Naomi Arrives | Naomi's birth weight | `ch4-a.jpg` |
| | The dodo | `ch4-b.jpg` |
| 5 · The Arboretum | The smallest tree | `ch5-a.jpg` — hidden until correct |
| | The praying mantis | `ch5-c.jpg` → **swaps to** `ch5-d.jpg` |
| 6 · Germany | The sailing capital | `ch6-a.jpg` |
| | The red panda | `ch6-b.jpg` — hidden until correct |
| 7 · Costa Rica | Pura vida | `ch7-a.jpg` |
| | The capuchin | `ch7-b.jpg` |
| **The ending** | The group photo she unlocks | **`family.jpg`** |

## Spares

These are uploaded but not currently shown anywhere. They are kept in case a
question changes — point any question at them in `../src/data.js`.

- `ch5-b.jpg` — the three of us in the meadow

## Tips

- Quiz photos are shown in a **square box, cropped to fill**. Faces near the
  centre survive the crop best. The final group photo is never cropped.
- Photos are resized to 1200px on the long edge before being committed, which
  keeps each one around 150–300 KB so they load quickly on mobile data.
- Rotation is applied on import rather than left to the browser, so nothing
  turns up sideways on her phone.
- To move a photo somewhere else, edit the `photos:` (or `showFirst:`) line for
  that question in `../src/data.js`. No rebuild needed.
