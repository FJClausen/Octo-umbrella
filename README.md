# Chess Progress Tracker

A comprehensive web-based tool for tracking your chess progress by importing games from chess.com, running deep engine analysis with Stockfish, and automatically identifying areas for improvement.

## Features

### Game Import & Management
- **Automatic Game Import**: Fetch games directly from chess.com using their public API
- **Game Database**: SQLite-based storage with full PGN data
- **Manual Analysis**: Add custom notes, loss reasons, and learning recommendations

### Engine Analysis (Stockfish Integration)
- **Deep Position Analysis**: Run Stockfish on every move of your games
- **Centipawn Loss (CPL)**: Measure accuracy with centipawn loss calculation
- **Phase-by-Phase Accuracy**: Get accuracy scores for Opening, Middlegame, and Endgame
- **Automatic Blunder Detection**: Identify blunders (CPL > 100), mistakes (CPL 50-100), and inaccuracies (CPL 25-50)
- **Opening Analysis**: ECO codes and opening names extracted from PGN
- **Batch Analysis**: Analyze multiple games at once

### Automated Insights
- **Weakest Phase Detection**: Automatically identifies if you struggle in opening, middlegame, or endgame
- **Opening Performance**: Win rate breakdown by ECO code and opening name
- **Pattern Recognition**: Identifies which openings you should play more or avoid
- **Personalized Recommendations**: Get automated study suggestions based on your game data
- **Time Trouble Tracking**: Identify games where time management was an issue

### Statistics & Visualization
- **Progress Tracking**: View overall statistics and track improvement over time
- **Rating History**: Visualize rating progression with interactive charts
- **Opening Statistics**: Detailed win/loss records by opening with minimum game thresholds
- **Phase Performance**: Compare your accuracy across different game phases

## Installation

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd Octo-umbrella
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and navigate to:
```
http://localhost:5000
```

### Running on Replit (Recommended for Easy Setup)

For a hassle-free setup with no local installation required:

1. Go to [Replit](https://replit.com) and sign up/login
2. Click "+ Create" → "Import from GitHub"
3. Paste your repository URL
4. Replit will automatically:
   - Install Python and dependencies
   - Set up Stockfish engine
   - Configure the environment

5. Click the "Run" button
6. The app opens in Replit's webview

**See [REPLIT_SETUP.md](REPLIT_SETUP.md) for detailed Replit instructions and troubleshooting.**

**For complete beginner setup instructions, see [QUICKSTART.md](QUICKSTART.md).**

## Usage

### Importing Games

1. Click on "Import Games" in the navigation bar
2. Enter your chess.com username
3. Select the year and month (defaults to current month)
4. Click "Import Games"
5. Games will be automatically fetched and stored in the database

### Analyzing Games

1. From the Dashboard, click "View" on any game
2. Click "Add Analysis" or "Edit Analysis"
3. Fill in:
   - **Loss Reason**: What caused the loss (e.g., "Blundered in opening", "Time pressure")
   - **Learning Recommendations**: What to study (e.g., "Study Sicilian Defense", "Practice endgames")
   - **Notes**: Any additional observations
4. Save your analysis

### Running Engine Analysis

1. Click "Engine Analysis" in the navigation bar
2. You'll see all unanalyzed games
3. Options:
   - Click "Analyze" next to individual games (takes 10-30 seconds)
   - Click "Analyze All Games" for batch processing (runs in background)
4. Analysis includes:
   - Centipawn loss for each move
   - Opening identification (ECO code and name)
   - Blunder/mistake/inaccuracy detection
   - Accuracy by phase (Opening/Middlegame/Endgame)

**Note**: First analysis may take a few minutes. Subsequent analyses are cached.

### Viewing Insights & Recommendations

1. Click "Insights" in the navigation bar
2. See automated analysis:
   - **Your Weakest Phase**: Which phase (Opening/Middlegame/Endgame) needs work
   - **Openings to Avoid**: Openings with <40% win rate
   - **Best Openings**: Openings with >60% win rate
   - **Phase Performance**: Accuracy breakdown by phase
   - **Personalized Recommendations**: What to study based on your patterns

### Checking Opening Performance

1. Click "Openings" in the navigation bar
2. View detailed stats for each opening you've played (minimum 3 games):
   - Win rate percentage
   - Games played (W-L record)
   - Average centipawn loss
   - Average accuracy
   - Status indicator (Play More / Study/Avoid / Neutral)

### Viewing Statistics

1. Click "Statistics" in the navigation bar
2. View:
   - Overall win/loss/draw statistics
   - Rating progression chart
   - Most common loss reasons
   - Learning recommendations breakdown

## Project Structure

```
Octo-umbrella/
├── app.py                  # Main Flask application
├── database.py             # Database operations
├── chess_api.py            # Chess.com API integration
├── engine_analysis.py      # Stockfish engine integration
├── requirements.txt        # Python dependencies
├── chess_progress.db       # SQLite database (created on first run)
├── README.md               # Main documentation
├── QUICKSTART.md           # Beginner-friendly setup guide
├── REPLIT_SETUP.md         # Replit-specific setup guide
├── replit.nix              # Replit Nix configuration
├── .replit                 # Replit run configuration
├── templates/              # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── fetch_games.html
│   ├── game_detail.html
│   ├── analyze_game.html
│   ├── statistics.html
│   ├── engine_analysis.html  # Engine analysis page
│   ├── insights.html          # Automated insights dashboard
│   └── openings.html          # Opening performance analysis
└── static/                 # Static files
    └── style.css
```

## Database Schema

The application uses SQLite with the following schema:

```sql
games (
    id INTEGER PRIMARY KEY,
    chess_com_id TEXT UNIQUE,
    username TEXT,
    opponent TEXT,
    result TEXT,
    time_class TEXT,
    time_control TEXT,
    user_rating INTEGER,
    opponent_rating INTEGER,
    date_played INTEGER,
    pgn TEXT,
    url TEXT,
    color TEXT,

    -- Manual analysis fields
    loss_reason TEXT,
    learning_recommendations TEXT,
    notes TEXT,

    -- Engine analysis fields
    eco_code TEXT,
    opening_name TEXT,
    move_count INTEGER,
    avg_centipawn_loss REAL,
    opening_accuracy REAL,
    middlegame_accuracy REAL,
    endgame_accuracy REAL,
    blunders_count INTEGER,
    mistakes_count INTEGER,
    inaccuracies_count INTEGER,
    time_trouble INTEGER,
    analyzed INTEGER,
    analysis_date INTEGER,

    created_at INTEGER,
    updated_at INTEGER
)
```

## API Usage

The application uses the [chess.com Public API](https://www.chess.com/news/view/published-data-api). No authentication is required, but your chess.com profile must be public.

### Endpoints Used:
- `GET /pub/player/{username}/games/{year}/{month}` - Fetch monthly games

## Development

### Running in Development Mode

The application runs in debug mode by default when started with `python app.py`. This enables:
- Auto-reload on code changes
- Detailed error pages
- Debug logging

### Production Deployment

For production deployment:

1. Set a secure secret key in `app.py`:
```python
app.secret_key = 'your-secure-random-secret-key-here'
```

2. Use a production WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Tips for Effective Analysis

1. **Be Specific**: When adding loss reasons, be as specific as possible (e.g., "Missed knight fork on move 15" rather than just "tactical mistake")

2. **Track Patterns**: After analyzing multiple games, check the Statistics page to identify recurring issues

3. **Set Goals**: Use learning recommendations to create a structured study plan

4. **Regular Reviews**: Import and analyze games regularly to track your progress over time

## Troubleshooting

### Games Not Importing
- Ensure your chess.com profile is public
- Verify the username is correct (case-insensitive)
- Check that you have games in the selected month

### Database Issues
- The database file `chess_progress.db` is created automatically
- To reset the database, delete the file and restart the application

## Future Enhancements

Potential features for future development:
- Support for other chess platforms (Lichess, Chess24)
- Game replay with board visualization
- Opening repertoire tracking
- Puzzle integration
- Multi-user support with authentication
- Export data to CSV/PDF reports

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
