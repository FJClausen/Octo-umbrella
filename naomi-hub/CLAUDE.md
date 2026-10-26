# Naomi's Activity Hub

iPad app for Naomi (9). A hub of activities she picks when bored. Goal: get her off the screen to think, create, and go outside. Every activity ends away from the iPad.

Full spec: https://claude.ai/artifact/YE5pcUibaX39yqBufHsMzE

> This project lives in `naomi-hub/` inside the `Octo-umbrella` monorepo. Paths below are relative to `naomi-hub/`. GitHub Actions workflows live at the repo root in `.github/workflows/naomi-hub*.yml`.

## Hard constraints

- No Mac. The owner only has a corporate laptop. Install nothing on it. All iOS builds run on EAS (Expo cloud). Delivery is through TestFlight.
- iPad first (landscape and portrait). iPhone layout is not needed.
- Secrets (Anthropic key, Supabase service key) live only in Vercel environment variables. Never put them in the app bundle or in git.
- Printer: HP, AirPrint, black and white only. Pick the printer once, then print with one tap and no dialog (`expo-print`: `selectPrinterAsync` + `printerUrl`).
- Offline first: chess, code-generated puzzles, and species cards must work with no network.
- Audience: a 9-year-old who reads about 2 years ahead and is strong at math and chess. Pitch content at ages 11–12.
- Languages: English by default, German (advanced), Spanish (intermediate). A "Misión" switch shows any activity's instructions in German or Spanish.

## Stack

| Piece | Role |
| --- | --- |
| Expo (React Native, TypeScript, expo-router) | App |
| EAS Build / Submit / Update | Cloud iOS builds, TestFlight upload, over-the-air updates for JavaScript-only changes |
| GitHub | Repo; push to `main` triggers an EAS build |
| Vercel (Node, TypeScript API routes) | `/api/generate`, `/api/feedback`, `/api/talk`, `/api/upload-url`, `/api/sync`, plus the parent spot page `/spots` |
| Supabase | Postgres (progress, badges, sightings, spots, content cache) + private Storage bucket `artwork` |
| Claude API | Content generation (JSON), drawing feedback (vision), speaking partner |

App → Vercel only. The app never talks to Supabase or Anthropic directly. Requests carry an `x-app-secret` header. Rate-limit each route.

## Activities (9)

1. **Puzzle Printer**: code-generated Sudoku (6×6, 9×9), KenKen, Kakuro, logic grids, magic squares, number pyramids, each solver-verified to have exactly one solution. Claude supplies word lists, clues and word problems; code builds the crossword and word-search grids. Chess diagram sheet. Answer key on page 2.
2. **Geo Quest**: Backyard solo (riddle hints, find the object, draw it, Claude feedback). Neighborhood Expedition (parent PIN, spots from Supabase, 3 hints per spot, GPS geofence of about 25 m or a parent-confirm fallback). AirTag treasure mode (clues only; the app cannot read the AirTag).
3. **Chess Puzzles**: about 3,000 puzzles from the Lichess puzzle DB (CC0), rated 400–1800, bundled as JSON. Her puzzle rating starts at 600 and adjusts with an Elo-style update. Themes, daily puzzle, 5-puzzle rounds. Use `chess.js` for move validation.
4. **Language Lab**: German and Spanish reading and writing tasks; speaking partner (iOS speech recognition → `/api/talk` → iOS text-to-speech), 5-minute cap, corrections at the end; printable sheets.
5. **Animal Detective** (backyard, DC area, no bird feeder): observation missions with a timer, squirrel census (named residents with their markings), species tally, field guide, learn cards. Species facts are curated and bundled, never generated live.
6. **Math in the Wild**: estimate-then-measure, recipe scaling, nature patterns, probability.
7. **Inventor's Challenge**: build with limits, timer, photo, reflection question, gallery.
8. **Art Studio**: Claude creative prompts, technique challenges, printable templates, Claude feedback on a photo of the drawing.
9. **Geography Quiz**: 10-question rounds that get harder (tap the country on the map, flags, capitals, US states), themed sets, printable blank maps. Map shapes from Natural Earth (public domain).

## Claude guardrails (every system prompt)

- Age-appropriate topics; steer off-topic requests back to the activity.
- Never ask for or repeat personal details.
- Drawing feedback: 2 specific strengths, 1 technique tip, 1 follow-up challenge. No scores, no comparisons to other kids.
- Content routes return strict JSON, validated with zod. If validation fails, fall back to bundled content.
- Cache good generated items in Supabase (up to 50 per theme and language).

## Rewards

Points: Expedition 50, backyard 30, desk or house 20, iPad 10, Misión bonus +10. Daily streak (an off-screen activity keeps it going) with 1 rest day per week. Badges and levels: Scout → Explorer → Naturalist → Grandmaster.

## Build order

1. **Foundations**: Expo app scaffold, `eas.json`, GitHub Actions → EAS build, home hub, parent PIN, printer setup screen. ✅
2. **Printer + Chess**: puzzle generators with tests, HTML print templates, Lichess import script, chess UI, basic points. **First TestFlight release.** ✅ code done; Kakuro and the Claude-backed word puzzles (crossword, word search) are still to do. First EAS build not yet run.
3. Vercel routes + Supabase schema/migrations + sync + `/api/generate`.
4. Art Studio + `/api/feedback` + gallery.
5. Animal Detective.
6. Language Lab.
7. Geo Quest + `/spots` parent page.
8. Math in the Wild, Inventor's Challenge, Geography Quiz.
9. Full rewards layer.

## Repo layout

```
/app          Expo app (expo-router, routes in app/src/app)
/api          Vercel project (API routes + /spots page)
/supabase     migrations, seed
/scripts      lichess-import.ts, species-cards build
/content      bundled JSON (puzzles, species, missions)
```

Inside `/app/src`: `app/` routes only; `puzzles/` generators + solvers; `print/` HTML sheet templates; `chess/` puzzle logic; `store/` local persistence (AsyncStorage, SecureStore); `components/` UI.

## Conventions

- TypeScript strict. Unit tests (vitest) for every puzzle generator and solver.
- Print templates: HTML + CSS, A4/Letter safe margins, black and white only, minimum 12 pt. `src/print/sheets.test.ts` enforces two pages, grayscale and ≥12 pt.
- Commit small; each milestone ends with an EAS build.
- Expo SDK 58. Add native packages with `npx expo install <pkg>` (in a sandbox without api.expo.dev, prefix `EXPO_OFFLINE=1`). Never create `ios/` or `android/` by hand.
- Generators take a seed (`makeRng`) so a sheet can be regenerated exactly.

## Commands

```bash
cd app
npm ci
npm test                 # vitest
npm run typecheck        # tsc --noEmit
npx expo export --platform ios   # bundle check, same as CI
cd .. && node scripts/lichess-import.ts   # rebuild content/puzzles.json (Node 22.18+)
```

## Known risks

- Wi-Fi-only iPads have no GPS. Detect this at runtime and fall back to parent confirm.
- TestFlight builds expire after 90 days. Schedule an EAS rebuild about every 80 days.
- Supabase free tier pauses after 7 days of no activity. A weekly Vercel cron ping keeps it active.
- `content/puzzles.json` currently holds a 60-puzzle mate-in-1 starter set. Run the "Naomi Hub – import Lichess puzzles" workflow to replace it with ~3,000 Lichess puzzles.

## Open items (owner)

- [ ] iPad model: Wi-Fi only or cellular
- [ ] Expo account linked to the Apple developer account; `EXPO_TOKEN` in GitHub secrets
- [ ] App Store Connect API key
- [ ] Anthropic API key with a spend cap → Vercel env
- [ ] Supabase project URL + service key → Vercel env
