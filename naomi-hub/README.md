# Naomi's Activity Hub

iPad app (Expo, SDK 58) that hands Naomi activities which end away from the screen. Spec and conventions: [CLAUDE.md](CLAUDE.md).

Milestones 1–2 are in place: the hub, parent PIN, printer setup, Puzzle Printer (Sudoku 6×6/9×9, KenKen, logic grid, number pyramid, magic square) and Chess Puzzles. On top of that, screen tickets: playing chess on the iPad costs a ticket, and solving a printed sheet (checked by photo) earns one.

## First TestFlight build (no Mac needed)

Everything runs in GitHub Actions and on EAS. You only use a browser.

### 1. GitHub secrets

Repository → Settings → Secrets and variables → Actions:

| Secret | What | Where to get it |
| --- | --- | --- |
| `EXPO_TOKEN` | Expo access token | expo.dev → Account settings → Access tokens. Already set if the TriLift builds work. |
| `ASC_API_KEY_P8` | Full text of the `.p8` file, including the BEGIN/END lines | App Store Connect → Users and Access → Integrations → App Store Connect API → generate a key with the **App Manager** role |
| `ASC_KEY_ID` | Key ID of that key | Same page |
| `ASC_ISSUER_ID` | Issuer ID | Same page, above the key list |
| `APPLE_TEAM_ID` | 10-character team ID | developer.apple.com → Membership details |
| `APPLE_TEAM_TYPE` | `INDIVIDUAL` or `COMPANY_OR_ORGANIZATION` | Same page. Defaults to `INDIVIDUAL` |
| `NAOMI_ASC_APP_ID` | Numeric Apple ID of the app record | Step 3 below |
| `NAOMI_API_URL` | `https://<project>.vercel.app` | Step 4 below |
| `NAOMI_APP_SECRET` | Same value as `APP_SECRET` in Vercel | Step 4 below |

### 2. First build (registers the bundle ID)

Merge to `main` or run **Actions → Naomi Hub → Run workflow** on `main`. The workflow:

1. runs the tests and a bundle check,
2. creates the `naomi-hub` EAS project if needed,
3. uses the ASC key to register `com.fjclausen.naomihub` and create the signing certificate and provisioning profile,
4. starts `eas build --platform ios --profile production`, adding `--auto-submit` once `NAOMI_ASC_APP_ID` is set.

### 3. Create the App Store Connect app

App Store Connect → Apps → + → New App: platform iOS, bundle ID `com.fjclausen.naomihub`, any SKU. Copy its **Apple ID** (App Information) into the `NAOMI_ASC_APP_ID` secret. Every later push to `main` builds and uploads to TestFlight.

### 4. Photo answer checks (Vercel)

Printed sheets earn screen tickets once Naomi photographs her finished page and the app confirms the answers. The photo is read by Claude through a small Vercel API, so the Anthropic key never ships in the app.

1. **Anthropic key.** console.anthropic.com → API keys → create one. Under Billing → Limits, set a monthly spend limit (a few dollars is plenty: each check costs well under a cent).
2. **Vercel project.** vercel.com → Add New → Project → import `FJClausen/Octo-umbrella`.
   - Root Directory: `naomi-hub/api`
   - Framework Preset: Other
   - Environment Variables: `ANTHROPIC_API_KEY` (from step 1) and `APP_SECRET` (any long random string, 32+ characters)
   - Deploy, then open `https://<project>.vercel.app/api/health`. It should show `"anthropicKey":true,"appSecret":true`.
3. **GitHub secrets.** `NAOMI_API_URL` = `https://<project>.vercel.app` and `NAOMI_APP_SECRET` = the same `APP_SECRET` value.
4. Run **Actions → Naomi Hub → Run workflow** on `main`. The new build has the checker built in.

Without these, everything still works: "Check my answers" falls back to a parent approving the sheet with the PIN.

### 5. Puzzles

Run **Actions → Naomi Hub – import Lichess puzzles** once. It replaces the 60-puzzle starter set with ~3,000 Lichess puzzles and commits the file.

## Develop

```bash
cd app && npm ci && npm test
```
