"""
Chess Progress Tracker - Main Flask Application
"""
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from database import Database
from chess_api import ChessComAPI
from engine_analysis import EngineAnalyzer
from datetime import datetime
import threading

app = Flask(__name__)
app.secret_key = 'chess-progress-tracker-secret-key-change-in-production'

db = Database()
chess_api = ChessComAPI()
engine_analyzer = None  # Lazy initialization

def get_engine():
    """Get or create engine analyzer instance"""
    global engine_analyzer
    if engine_analyzer is None:
        try:
            engine_analyzer = EngineAnalyzer(depth=12, time_limit=0.1)
        except FileNotFoundError as e:
            print(f"Stockfish not found: {e}")
            return None
    return engine_analyzer


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


@app.route('/engine-analysis')
def engine_analysis_page():
    """Page for running engine analysis on games"""
    unanalyzed = db.get_unanalyzed_games(limit=20)
    return render_template('engine_analysis.html', unanalyzed_games=unanalyzed)


@app.route('/game/<int:game_id>/run-analysis', methods=['POST'])
def run_game_analysis(game_id):
    """Run engine analysis on a specific game"""
    game = db.get_game(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    engine = get_engine()
    if not engine:
        return jsonify({'error': 'Stockfish engine not available'}), 500

    if not game['pgn']:
        return jsonify({'error': 'No PGN data available'}), 400

    try:
        # Run analysis
        analysis = engine.analyze_game(game['pgn'], game['color'])

        if 'error' in analysis:
            return jsonify({'error': analysis['error']}), 400

        # Save to database
        db.update_game_engine_analysis(game_id, analysis)

        return jsonify({
            'success': True,
            'message': 'Analysis complete',
            'data': {
                'opening': analysis['opening_name'],
                'eco': analysis['eco_code'],
                'blunders': analysis['blunders_count'],
                'mistakes': analysis['mistakes_count'],
                'opening_accuracy': analysis['opening_accuracy'],
                'middlegame_accuracy': analysis['middlegame_accuracy'],
                'endgame_accuracy': analysis['endgame_accuracy']
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/analyze-all', methods=['POST'])
def analyze_all_games():
    """Analyze all unanalyzed games (runs in background)"""
    limit = request.form.get('limit', 10, type=int)
    unanalyzed = db.get_unanalyzed_games(limit=limit)

    engine = get_engine()
    if not engine:
        flash('Stockfish engine not available', 'error')
        return redirect(url_for('engine_analysis_page'))

    def analyze_in_background():
        """Background task to analyze games"""
        success_count = 0
        for game in unanalyzed:
            try:
                if game['pgn']:
                    analysis = engine.analyze_game(game['pgn'], game['color'])
                    if 'error' not in analysis:
                        db.update_game_engine_analysis(game['id'], analysis)
                        success_count += 1
            except Exception as e:
                print(f"Error analyzing game {game['id']}: {e}")

        print(f"Batch analysis complete: {success_count}/{len(unanalyzed)} games analyzed")

    # Start background thread
    thread = threading.Thread(target=analyze_in_background)
    thread.start()

    flash(f'Started analysis of {len(unanalyzed)} games in background. This may take a few minutes.', 'success')
    return redirect(url_for('engine_analysis_page'))


@app.route('/insights')
def insights():
    """Show automated insights and recommendations"""
    insights_data = db.get_insights()
    opening_stats = db.get_opening_statistics()
    phase_stats = db.get_phase_statistics()

    return render_template('insights.html',
                         insights=insights_data,
                         opening_stats=opening_stats,
                         phase_stats=phase_stats)


@app.route('/openings')
def openings():
    """View opening performance analysis"""
    opening_stats = db.get_opening_statistics()
    return render_template('openings.html', openings=opening_stats)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
