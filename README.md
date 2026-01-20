# Chess Progress Tracker

A web-based tool for tracking your chess progress by importing games from chess.com, analyzing losses, and identifying areas for improvement.

## Features

- **Automatic Game Import**: Fetch games directly from chess.com using their public API
- **Game Analysis**: Add custom analysis to each game including:
  - Loss reasons (what went wrong)
  - Learning recommendations (what to study)
  - Personal notes
- **Progress Tracking**: View statistics and track your improvement over time
- **Rating History**: Visualize your rating progression with charts
- **Loss Pattern Analysis**: Identify common mistakes and weaknesses

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
├── requirements.txt        # Python dependencies
├── chess_progress.db       # SQLite database (created on first run)
├── templates/              # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── fetch_games.html
│   ├── game_detail.html
│   ├── analyze_game.html
│   └── statistics.html
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
    loss_reason TEXT,
    learning_recommendations TEXT,
    notes TEXT,
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
