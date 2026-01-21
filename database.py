"""
Database module for Chess Progress Tracker
"""
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional


class Database:
    def __init__(self, db_path='chess_progress.db'):
        self.db_path = db_path
        self.init_db()

    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Initialize database schema"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Games table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chess_com_id TEXT UNIQUE,
                username TEXT NOT NULL,
                opponent TEXT NOT NULL,
                result TEXT NOT NULL,
                time_class TEXT,
                time_control TEXT,
                user_rating INTEGER,
                opponent_rating INTEGER,
                date_played INTEGER NOT NULL,
                pgn TEXT,
                url TEXT,
                color TEXT,
                loss_reason TEXT,
                learning_recommendations TEXT,
                notes TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
        ''')

        # Add new columns for enhanced analysis (if they don't exist)
        # This allows backward compatibility with existing databases
        new_columns = [
            ('eco_code', 'TEXT'),
            ('opening_name', 'TEXT'),
            ('move_count', 'INTEGER'),
            ('avg_centipawn_loss', 'REAL'),
            ('opening_accuracy', 'REAL'),
            ('middlegame_accuracy', 'REAL'),
            ('endgame_accuracy', 'REAL'),
            ('blunders_count', 'INTEGER DEFAULT 0'),
            ('mistakes_count', 'INTEGER DEFAULT 0'),
            ('inaccuracies_count', 'INTEGER DEFAULT 0'),
            ('time_trouble', 'INTEGER DEFAULT 0'),
            ('analyzed', 'INTEGER DEFAULT 0'),
            ('analysis_date', 'INTEGER')
        ]

        for column_name, column_type in new_columns:
            try:
                cursor.execute(f'ALTER TABLE games ADD COLUMN {column_name} {column_type}')
            except sqlite3.OperationalError:
                # Column already exists, skip
                pass

        # Index for faster queries
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_date_played ON games(date_played DESC)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_result ON games(result)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_username ON games(username)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_eco_code ON games(eco_code)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_analyzed ON games(analyzed)
        ''')

        conn.commit()
        conn.close()

    def import_game(self, game_data: Dict, username: str) -> bool:
        """Import a game from chess.com API data"""
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            # Determine player's color and result
            white_player = game_data.get('white', {}).get('username', '').lower()
            black_player = game_data.get('black', {}).get('username', '').lower()
            username_lower = username.lower()

            if username_lower == white_player:
                color = 'white'
                opponent = game_data.get('black', {}).get('username', 'Unknown')
                user_rating = game_data.get('white', {}).get('rating')
                opponent_rating = game_data.get('black', {}).get('rating')
                result = game_data.get('white', {}).get('result', 'unknown')
            else:
                color = 'black'
                opponent = game_data.get('white', {}).get('username', 'Unknown')
                user_rating = game_data.get('black', {}).get('rating')
                opponent_rating = game_data.get('white', {}).get('rating')
                result = game_data.get('black', {}).get('result', 'unknown')

            cursor.execute('''
                INSERT OR IGNORE INTO games (
                    chess_com_id, username, opponent, result, time_class,
                    time_control, user_rating, opponent_rating, date_played,
                    pgn, url, color
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                game_data.get('url'),
                username,
                opponent,
                result,
                game_data.get('time_class'),
                game_data.get('time_control'),
                user_rating,
                opponent_rating,
                game_data.get('end_time'),
                game_data.get('pgn'),
                game_data.get('url'),
                color
            ))

            conn.commit()
            return cursor.rowcount > 0

        except Exception as e:
            print(f"Error importing game: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()

    def get_game(self, game_id: int) -> Optional[Dict]:
        """Get a single game by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM games WHERE id = ?', (game_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return dict(row)
        return None

    def get_recent_games(self, limit: int = 10) -> List[Dict]:
        """Get recent games"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM games
            ORDER BY date_played DESC
            LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def update_game_analysis(self, game_id: int, loss_reason: str,
                            learning_recommendations: str, notes: str):
        """Update game analysis"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            UPDATE games
            SET loss_reason = ?,
                learning_recommendations = ?,
                notes = ?,
                updated_at = strftime('%s', 'now')
            WHERE id = ?
        ''', (loss_reason, learning_recommendations, notes, game_id))

        conn.commit()
        conn.close()

    def get_statistics(self) -> Dict:
        """Get overall statistics"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Total games
        cursor.execute('SELECT COUNT(*) as total FROM games')
        total = cursor.fetchone()['total']

        # Wins, losses, draws
        cursor.execute('''
            SELECT result, COUNT(*) as count
            FROM games
            GROUP BY result
        ''')
        results = {row['result']: row['count'] for row in cursor.fetchall()}

        # Current rating (from most recent game)
        cursor.execute('''
            SELECT user_rating
            FROM games
            WHERE user_rating IS NOT NULL
            ORDER BY date_played DESC
            LIMIT 1
        ''')
        rating_row = cursor.fetchone()
        current_rating = rating_row['user_rating'] if rating_row else None

        # Games analyzed
        cursor.execute('''
            SELECT COUNT(*) as analyzed
            FROM games
            WHERE loss_reason IS NOT NULL OR learning_recommendations IS NOT NULL
        ''')
        analyzed = cursor.fetchone()['analyzed']

        conn.close()

        return {
            'total_games': total,
            'wins': results.get('win', 0),
            'losses': results.get('checkmated', 0) + results.get('timeout', 0) +
                     results.get('resigned', 0) + results.get('abandoned', 0),
            'draws': results.get('agreed', 0) + results.get('stalemate', 0) +
                    results.get('repetition', 0) + results.get('insufficient', 0) +
                    results.get('50move', 0),
            'current_rating': current_rating,
            'games_analyzed': analyzed
        }

    def get_loss_reasons_breakdown(self) -> List[Dict]:
        """Get breakdown of loss reasons"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT loss_reason, COUNT(*) as count
            FROM games
            WHERE loss_reason IS NOT NULL AND loss_reason != ''
            GROUP BY loss_reason
            ORDER BY count DESC
        ''')

        rows = cursor.fetchall()
        conn.close()

        return [{'reason': row['loss_reason'], 'count': row['count']} for row in rows]

    def get_learning_recommendations(self) -> List[Dict]:
        """Get all learning recommendations"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT learning_recommendations, COUNT(*) as count
            FROM games
            WHERE learning_recommendations IS NOT NULL AND learning_recommendations != ''
            GROUP BY learning_recommendations
            ORDER BY count DESC
        ''')

        rows = cursor.fetchall()
        conn.close()

        return [{'recommendation': row['learning_recommendations'], 'count': row['count']}
                for row in rows]

    def get_rating_history(self) -> List[Dict]:
        """Get rating history over time"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT date_played, user_rating
            FROM games
            WHERE user_rating IS NOT NULL
            ORDER BY date_played ASC
        ''')

        rows = cursor.fetchall()
        conn.close()

        return [{'date': row['date_played'], 'rating': row['user_rating']} for row in rows]

    def update_game_engine_analysis(self, game_id: int, analysis_data: Dict):
        """Update game with engine analysis results"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            UPDATE games
            SET eco_code = ?,
                opening_name = ?,
                move_count = ?,
                avg_centipawn_loss = ?,
                opening_accuracy = ?,
                middlegame_accuracy = ?,
                endgame_accuracy = ?,
                blunders_count = ?,
                mistakes_count = ?,
                inaccuracies_count = ?,
                time_trouble = ?,
                analyzed = 1,
                analysis_date = strftime('%s', 'now'),
                updated_at = strftime('%s', 'now')
            WHERE id = ?
        ''', (
            analysis_data.get('eco_code'),
            analysis_data.get('opening_name'),
            analysis_data.get('move_count'),
            analysis_data.get('avg_centipawn_loss'),
            analysis_data.get('opening_accuracy'),
            analysis_data.get('middlegame_accuracy'),
            analysis_data.get('endgame_accuracy'),
            analysis_data.get('blunders_count', 0),
            analysis_data.get('mistakes_count', 0),
            analysis_data.get('inaccuracies_count', 0),
            analysis_data.get('time_trouble', 0),
            game_id
        ))

        conn.commit()
        conn.close()

    def get_unanalyzed_games(self, limit: int = 10) -> List[Dict]:
        """Get games that haven't been analyzed yet"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM games
            WHERE analyzed = 0 AND pgn IS NOT NULL
            ORDER BY date_played DESC
            LIMIT ?
        ''', (limit,))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def get_opening_statistics(self) -> List[Dict]:
        """Get win rate and performance by opening"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT
                eco_code,
                opening_name,
                COUNT(*) as games_played,
                SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN result IN ('checkmated', 'timeout', 'resigned', 'abandoned')
                    THEN 1 ELSE 0 END) as losses,
                AVG(avg_centipawn_loss) as avg_cpl,
                AVG(opening_accuracy) as avg_accuracy
            FROM games
            WHERE eco_code IS NOT NULL AND analyzed = 1
            GROUP BY eco_code, opening_name
            HAVING games_played >= 3
            ORDER BY games_played DESC
        ''')

        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            win_rate = (row['wins'] / row['games_played'] * 100) if row['games_played'] > 0 else 0
            results.append({
                'eco_code': row['eco_code'],
                'opening_name': row['opening_name'],
                'games_played': row['games_played'],
                'wins': row['wins'],
                'losses': row['losses'],
                'win_rate': round(win_rate, 1),
                'avg_cpl': round(row['avg_cpl'], 1) if row['avg_cpl'] else None,
                'avg_accuracy': round(row['avg_accuracy'], 1) if row['avg_accuracy'] else None
            })

        return results

    def get_phase_statistics(self) -> Dict:
        """Get accuracy statistics by game phase"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT
                AVG(opening_accuracy) as avg_opening,
                AVG(middlegame_accuracy) as avg_middlegame,
                AVG(endgame_accuracy) as avg_endgame,
                AVG(blunders_count) as avg_blunders,
                AVG(mistakes_count) as avg_mistakes,
                AVG(inaccuracies_count) as avg_inaccuracies
            FROM games
            WHERE analyzed = 1
        ''')

        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                'opening_accuracy': round(row['avg_opening'], 1) if row['avg_opening'] else 0,
                'middlegame_accuracy': round(row['avg_middlegame'], 1) if row['avg_middlegame'] else 0,
                'endgame_accuracy': round(row['avg_endgame'], 1) if row['avg_endgame'] else 0,
                'avg_blunders': round(row['avg_blunders'], 1) if row['avg_blunders'] else 0,
                'avg_mistakes': round(row['avg_mistakes'], 1) if row['avg_mistakes'] else 0,
                'avg_inaccuracies': round(row['avg_inaccuracies'], 1) if row['avg_inaccuracies'] else 0
            }
        return {}

    def get_insights(self) -> Dict:
        """Generate automated insights and recommendations"""
        conn = self.get_connection()
        cursor = conn.cursor()

        insights = {
            'weakest_phase': None,
            'worst_openings': [],
            'best_openings': [],
            'time_trouble_games': 0,
            'recommendations': []
        }

        # Find weakest phase
        phase_stats = self.get_phase_statistics()
        if phase_stats:
            phases = {
                'Opening': phase_stats.get('opening_accuracy', 0),
                'Middlegame': phase_stats.get('middlegame_accuracy', 0),
                'Endgame': phase_stats.get('endgame_accuracy', 0)
            }
            insights['weakest_phase'] = min(phases, key=phases.get)

        # Find worst performing openings (win rate < 40%)
        cursor.execute('''
            SELECT eco_code, opening_name,
                   COUNT(*) as games,
                   SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as win_rate
            FROM games
            WHERE eco_code IS NOT NULL AND analyzed = 1
            GROUP BY eco_code, opening_name
            HAVING games >= 3 AND win_rate < 40
            ORDER BY win_rate ASC
            LIMIT 3
        ''')
        insights['worst_openings'] = [dict(row) for row in cursor.fetchall()]

        # Find best performing openings (win rate > 60%)
        cursor.execute('''
            SELECT eco_code, opening_name,
                   COUNT(*) as games,
                   SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as win_rate
            FROM games
            WHERE eco_code IS NOT NULL AND analyzed = 1
            GROUP BY eco_code, opening_name
            HAVING games >= 3 AND win_rate > 60
            ORDER BY win_rate DESC
            LIMIT 3
        ''')
        insights['best_openings'] = [dict(row) for row in cursor.fetchall()]

        # Count time trouble games
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM games
            WHERE time_trouble = 1
        ''')
        row = cursor.fetchone()
        insights['time_trouble_games'] = row['count'] if row else 0

        conn.close()

        # Generate recommendations
        if insights['worst_openings']:
            for opening in insights['worst_openings']:
                insights['recommendations'].append(
                    f"Avoid or study {opening['opening_name']} ({opening['eco_code']}) - only {opening['win_rate']:.0f}% win rate"
                )

        if insights['weakest_phase']:
            insights['recommendations'].append(
                f"Focus on {insights['weakest_phase']} practice - your weakest phase"
            )

        if insights['time_trouble_games'] > 5:
            insights['recommendations'].append(
                f"Work on time management - {insights['time_trouble_games']} games with time trouble"
            )

        return insights
