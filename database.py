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
