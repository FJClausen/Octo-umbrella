"""
Chess Engine Analysis Module
Uses Stockfish to analyze games and calculate metrics
"""
import chess
import chess.pgn
import chess.engine
from io import StringIO
from typing import Dict, List, Optional, Tuple
import os


class EngineAnalyzer:
    """Analyzes chess games using Stockfish engine"""

    def __init__(self, stockfish_path: Optional[str] = None, depth: int = 15, time_limit: float = 0.1):
        """
        Initialize the engine analyzer

        Args:
            stockfish_path: Path to Stockfish binary (auto-detected if None)
            depth: Analysis depth (higher = more accurate but slower)
            time_limit: Time limit per position in seconds
        """
        self.depth = depth
        self.time_limit = time_limit
        self.stockfish_path = stockfish_path or self._find_stockfish()

    def _find_stockfish(self) -> str:
        """Try to find Stockfish binary"""
        common_paths = [
            '/usr/games/stockfish',
            '/usr/local/bin/stockfish',
            '/usr/bin/stockfish',
            'stockfish',
            '/nix/store/*/bin/stockfish',  # Replit uses Nix
        ]

        # Check environment variable first
        if 'STOCKFISH_PATH' in os.environ:
            return os.environ['STOCKFISH_PATH']

        # Try common paths
        for path in common_paths:
            if os.path.exists(path):
                return path

        # Try to find in PATH
        import shutil
        stockfish = shutil.which('stockfish')
        if stockfish:
            return stockfish

        raise FileNotFoundError(
            "Stockfish not found. Please install Stockfish or set STOCKFISH_PATH environment variable."
        )

    def analyze_game(self, pgn_text: str, player_color: str) -> Dict:
        """
        Analyze a complete game

        Args:
            pgn_text: PGN text of the game
            player_color: 'white' or 'black' - the player we're analyzing

        Returns:
            Dictionary with analysis results
        """
        try:
            # Parse PGN
            pgn = StringIO(pgn_text)
            game = chess.pgn.read_game(pgn)

            if not game:
                return {'error': 'Invalid PGN'}

            # Extract basic info
            eco_code = game.headers.get('ECO', 'Unknown')
            opening_name = game.headers.get('Opening', 'Unknown')

            # Analyze moves
            analysis_results = self._analyze_moves(game, player_color)

            return {
                'eco_code': eco_code,
                'opening_name': opening_name,
                'move_count': analysis_results['move_count'],
                'avg_centipawn_loss': analysis_results['avg_cpl'],
                'opening_accuracy': analysis_results['opening_accuracy'],
                'middlegame_accuracy': analysis_results['middlegame_accuracy'],
                'endgame_accuracy': analysis_results['endgame_accuracy'],
                'blunders_count': analysis_results['blunders'],
                'mistakes_count': analysis_results['mistakes'],
                'inaccuracies_count': analysis_results['inaccuracies'],
                'time_trouble': 0,  # Will be implemented with clock parsing
                'move_analysis': analysis_results['moves']
            }

        except Exception as e:
            return {'error': str(e)}

    def _analyze_moves(self, game: chess.pgn.Game, player_color: str) -> Dict:
        """Analyze all moves in the game"""
        board = game.board()
        move_analysis = []

        player_is_white = (player_color.lower() == 'white')

        cpls = []  # Centipawn losses
        opening_cpls = []  # Moves 1-15
        middlegame_cpls = []  # Moves 16-35
        endgame_cpls = []  # Moves 36+

        blunders = 0
        mistakes = 0
        inaccuracies = 0

        move_number = 0

        try:
            with chess.engine.SimpleEngine.popen_uci(self.stockfish_path) as engine:
                for node in game.mainline():
                    move = node.move

                    # Only analyze player's moves
                    if board.turn == chess.WHITE and player_is_white:
                        analyze_this_move = True
                    elif board.turn == chess.BLACK and not player_is_white:
                        analyze_this_move = True
                    else:
                        analyze_this_move = False

                    if analyze_this_move:
                        move_number += 1

                        # Get best move before playing the actual move
                        info_before = engine.analyse(
                            board,
                            chess.engine.Limit(depth=self.depth, time=self.time_limit)
                        )
                        score_before = info_before['score'].white().score(mate_score=10000)

                        # Play the actual move
                        board.push(move)

                        # Get evaluation after the move
                        info_after = engine.analyse(
                            board,
                            chess.engine.Limit(depth=self.depth, time=self.time_limit)
                        )
                        score_after = info_after['score'].white().score(mate_score=10000)

                        # Calculate centipawn loss
                        if player_is_white:
                            cpl = max(0, score_before - score_after)
                        else:
                            cpl = max(0, score_after - score_before)

                        cpls.append(cpl)

                        # Categorize by phase
                        if move_number <= 15:
                            opening_cpls.append(cpl)
                        elif move_number <= 35:
                            middlegame_cpls.append(cpl)
                        else:
                            endgame_cpls.append(cpl)

                        # Classify move quality
                        classification = self._classify_move(cpl)
                        if classification == 'blunder':
                            blunders += 1
                        elif classification == 'mistake':
                            mistakes += 1
                        elif classification == 'inaccuracy':
                            inaccuracies += 1

                        move_analysis.append({
                            'move_number': move_number,
                            'move': board.san(move),
                            'cpl': cpl,
                            'classification': classification
                        })
                    else:
                        # Just play opponent's move
                        board.push(move)

        except Exception as e:
            print(f"Engine analysis error: {e}")
            # Return partial results if analysis fails
            pass

        # Calculate accuracies (100 - average CPL, capped at 0-100)
        avg_cpl = sum(cpls) / len(cpls) if cpls else 0
        opening_acc = max(0, min(100, 100 - (sum(opening_cpls) / len(opening_cpls) if opening_cpls else 0)))
        middlegame_acc = max(0, min(100, 100 - (sum(middlegame_cpls) / len(middlegame_cpls) if middlegame_cpls else 0)))
        endgame_acc = max(0, min(100, 100 - (sum(endgame_cpls) / len(endgame_cpls) if endgame_cpls else 0)))

        return {
            'move_count': move_number,
            'avg_cpl': round(avg_cpl, 2),
            'opening_accuracy': round(opening_acc, 1),
            'middlegame_accuracy': round(middlegame_acc, 1),
            'endgame_accuracy': round(endgame_acc, 1),
            'blunders': blunders,
            'mistakes': mistakes,
            'inaccuracies': inaccuracies,
            'moves': move_analysis
        }

    def _classify_move(self, cpl: float) -> str:
        """
        Classify move quality based on centipawn loss

        Args:
            cpl: Centipawn loss

        Returns:
            'excellent', 'good', 'inaccuracy', 'mistake', or 'blunder'
        """
        if cpl <= 10:
            return 'excellent'
        elif cpl <= 25:
            return 'good'
        elif cpl <= 50:
            return 'inaccuracy'
        elif cpl <= 100:
            return 'mistake'
        else:
            return 'blunder'

    def quick_parse_pgn(self, pgn_text: str) -> Dict:
        """
        Quickly parse PGN for basic info without engine analysis

        Args:
            pgn_text: PGN text

        Returns:
            Dictionary with basic game info
        """
        try:
            pgn = StringIO(pgn_text)
            game = chess.pgn.read_game(pgn)

            if not game:
                return {'error': 'Invalid PGN'}

            # Count moves
            move_count = 0
            for _ in game.mainline():
                move_count += 1

            return {
                'eco_code': game.headers.get('ECO', 'Unknown'),
                'opening_name': game.headers.get('Opening', 'Unknown'),
                'move_count': move_count // 2,  # Divide by 2 to get full moves
                'white': game.headers.get('White', 'Unknown'),
                'black': game.headers.get('Black', 'Unknown'),
                'result': game.headers.get('Result', '*')
            }

        except Exception as e:
            return {'error': str(e)}
