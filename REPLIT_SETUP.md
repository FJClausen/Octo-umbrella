# Setting Up Chess Progress Tracker on Replit

This guide will help you set up the Chess Progress Tracker with Stockfish engine analysis on Replit.

## Quick Start

### 1. Import the Project

1. Go to [Replit](https://replit.com)
2. Click "+ Create Repl"
3. Select "Import from GitHub"
4. Paste your repository URL
5. Click "Import from GitHub"

### 2. Install Stockfish

Replit uses Nix package manager. Add a `replit.nix` file:

```nix
{ pkgs }: {
  deps = [
    pkgs.python310
    pkgs.stockfish
  ];
}
```

Or run this command in the Shell:
```bash
nix-env -iA nixpkgs.stockfish
```

### 3. Configure the Application

Create a `.replit` file in the root:

```
run = "python app.py"
language = "python3"

[nix]
channel = "stable-22_11"
```

### 4. Install Python Dependencies

Replit should automatically install from `requirements.txt`, but you can also run:

```bash
pip install -r requirements.txt
```

### 5. Run the Application

Click the green "Run" button at the top, or in the Shell:

```bash
python app.py
```

The app will start on port 5000 and Replit will show it in a webview.

## Using the Features

### Import Games
1. Click "Import Games" in the navigation
2. Enter your chess.com username
3. Select month/year (optional - defaults to current month)
4. Click "Import Games"

### Run Engine Analysis
1. Click "Engine Analysis" in the navigation
2. Click "Analyze All Games" to analyze all unanalyzed games (this may take a few minutes)
3. Or click "Analyze" next to individual games
4. Wait for analysis to complete (10-30 seconds per game)

### View Insights
1. Click "Insights" in the navigation
2. See your automated recommendations:
   - Weakest game phase
   - Openings to avoid
   - Best performing openings
   - Phase accuracy scores
   - Average blunders/mistakes

### Check Opening Performance
1. Click "Openings" in the navigation
2. View win rates by opening
3. Identify which openings work well for you
4. See which openings to avoid or study

## Troubleshooting

### Stockfish Not Found

If you see "Stockfish not found" errors:

1. Make sure Stockfish is installed via Nix (see step 2 above)
2. Find Stockfish path:
   ```bash
   which stockfish
   ```
3. Set environment variable in Replit's "Secrets" (Environment Variables):
   - Key: `STOCKFISH_PATH`
   - Value: The path from the `which` command (usually `/nix/store/.../bin/stockfish`)

### Analysis Taking Too Long

The analysis uses these settings in `engine_analysis.py`:
- `depth=12` - Engine search depth (lower = faster but less accurate)
- `time_limit=0.1` - Time per position in seconds

To speed up analysis, edit `engine_analysis.py` line 22:
```python
engine_analyzer = EngineAnalyzer(depth=10, time_limit=0.05)  # Faster but less accurate
```

### Out of Memory

If Replit runs out of memory during batch analysis:
- Analyze games in smaller batches (10-20 at a time)
- The batch limit can be adjusted in the HTML form

### Database Locked

If you see "database is locked" errors:
- This happens if multiple analysis requests run simultaneously
- Wait for current analysis to finish
- Reload the page and try again

## Performance Tips

1. **Start Small**: Import and analyze one month of games first to test
2. **Batch Analysis**: Use "Analyze All" for background processing
3. **Check Progress**: Refresh the Engine Analysis page to see how many games are analyzed
4. **View Results**: Once analyzed, check Insights page for recommendations

## Understanding the Metrics

### Centipawn Loss (CPL)
- Measures how much "advantage" you lose with each move
- Lower is better
- 0 = perfect move, 100+ = blunder

### Accuracy %
- 100% = perfect play
- Based on inverse of average centipawn loss
- Calculated separately for Opening, Middlegame, and Endgame

### Move Classifications
- **Excellent**: CPL ≤ 10
- **Good**: CPL 11-25
- **Inaccuracy**: CPL 26-50 (counted in stats)
- **Mistake**: CPL 51-100 (counted in stats)
- **Blunder**: CPL > 100 (counted in stats)

### Game Phases
- **Opening**: Moves 1-15
- **Middlegame**: Moves 16-35
- **Endgame**: Moves 36+

## Features Overview

### Automated Insights
- Identifies your weakest game phase
- Finds openings with low win rates
- Highlights your best openings
- Tracks time trouble patterns
- Generates personalized study recommendations

### Opening Analysis
- Win rate by ECO code
- Average centipawn loss per opening
- Average accuracy per opening
- Visual indicators for good/bad openings
- Minimum 3 games required for statistics

### Phase Statistics
- Accuracy breakdown by phase
- Average errors per game
- Identifies where you lose most often
- Helps focus study efforts

## Data Privacy

All data is stored locally in `chess_progress.db` in your Replit project. Your games and analysis are private to your account.

## Need Help?

If you encounter issues:
1. Check the Shell tab for error messages
2. Review the troubleshooting section above
3. Make sure all dependencies are installed
4. Verify Stockfish is accessible

Enjoy tracking your chess progress! 📈♟️
