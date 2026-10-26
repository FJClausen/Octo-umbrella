# Naomi's Activity Hub

iPad app (Expo, SDK 58) that hands Naomi activities which end away from the screen. Spec and conventions: [CLAUDE.md](CLAUDE.md).

Milestones 1–2 are in place: the hub, parent PIN, printer setup, Puzzle Printer (Sudoku 6×6/9×9, KenKen, logic grid, number pyramid, magic square) and Chess Puzzles.

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

### 2. First build (registers the bundle ID)

Merge to `main` or run **Actions → Naomi Hub → Run workflow** on `main`. The workflow:

1. runs the tests and a bundle check,
2. creates the `naomi-hub` EAS project if needed,
3. uses the ASC key to register `com.fjclausen.naomihub` and create the signing certificate and provisioning profile,
4. starts `eas build --platform ios --profile production`, adding `--auto-submit` once `NAOMI_ASC_APP_ID` is set.

### 3. Create the App Store Connect app

App Store Connect → Apps → + → New App: platform iOS, bundle ID `com.fjclausen.naomihub`, any SKU. Copy its **Apple ID** (App Information) into the `NAOMI_ASC_APP_ID` secret. Every later push to `main` builds and uploads to TestFlight.

### 4. Puzzles

Run **Actions → Naomi Hub – import Lichess puzzles** once. It replaces the 60-puzzle starter set with ~3,000 Lichess puzzles and commits the file.

## Develop

```bash
cd app && npm ci && npm test
```
