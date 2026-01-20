"""
Chess Progress Tracker - Main Flask Application
"""
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from database import Database
from chess_api import ChessComAPI
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'chess-progress-tracker-secret-key-change-in-production'

db = Database()
chess_api = ChessComAPI()


# Jinja template filters
@app.template_filter('timestamp_to_date')
def timestamp_to_date(timestamp):
    """Convert Unix timestamp to readable date"""
    if timestamp:
        return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M')
    return 'N/A'


@app.route('/')
def index():
    """Dashboard showing recent games and statistics"""
    stats = db.get_statistics()
    recent_games = db.get_recent_games(limit=10)
    return render_template('index.html', stats=stats, recent_games=recent_games)


@app.route('/fetch-games', methods=['GET', 'POST'])
def fetch_games():
    """Fetch games from chess.com"""
    if request.method == 'POST':
        username = request.form.get('username')
        year = request.form.get('year')
        month = request.form.get('month')

        if not username:
            flash('Please provide a chess.com username', 'error')
            return redirect(url_for('fetch_games'))

        try:
            # Fetch games from chess.com
            games = chess_api.fetch_games(username, year, month)

            if not games:
                flash('No games found for the specified period', 'warning')
                return redirect(url_for('fetch_games'))

            # Import games into database
            imported_count = 0
            for game in games:
                if db.import_game(game, username):
                    imported_count += 1

            flash(f'Successfully imported {imported_count} games', 'success')
            return redirect(url_for('index'))

        except Exception as e:
            flash(f'Error fetching games: {str(e)}', 'error')
            return redirect(url_for('fetch_games'))

    return render_template('fetch_games.html')


@app.route('/game/<int:game_id>')
def view_game(game_id):
    """View detailed information about a specific game"""
    game = db.get_game(game_id)
    if not game:
        flash('Game not found', 'error')
        return redirect(url_for('index'))

    return render_template('game_detail.html', game=game)


@app.route('/game/<int:game_id>/analyze', methods=['GET', 'POST'])
def analyze_game(game_id):
    """Add analysis to a game (loss reason, recommendations)"""
    game = db.get_game(game_id)
    if not game:
        flash('Game not found', 'error')
        return redirect(url_for('index'))

    if request.method == 'POST':
        loss_reason = request.form.get('loss_reason')
        learning_recommendations = request.form.get('learning_recommendations')
        notes = request.form.get('notes')

        db.update_game_analysis(game_id, loss_reason, learning_recommendations, notes)
        flash('Analysis saved successfully', 'success')
        return redirect(url_for('view_game', game_id=game_id))

    return render_template('analyze_game.html', game=game)


@app.route('/statistics')
def statistics():
    """View detailed statistics and progress"""
    stats = db.get_statistics()
    loss_reasons = db.get_loss_reasons_breakdown()
    learning_recommendations = db.get_learning_recommendations()
    rating_history = db.get_rating_history()

    return render_template('statistics.html',
                         stats=stats,
                         loss_reasons=loss_reasons,
                         learning_recommendations=learning_recommendations,
                         rating_history=rating_history)


@app.route('/api/rating-chart')
def rating_chart_data():
    """API endpoint for rating chart data"""
    rating_history = db.get_rating_history()
    return jsonify(rating_history)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
