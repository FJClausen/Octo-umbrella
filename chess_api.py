"""
Chess.com API integration module
"""
import requests
from datetime import datetime
from typing import List, Dict, Optional


class ChessComAPI:
    """Interface to chess.com public API"""

    BASE_URL = "https://api.chess.com/pub"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Chess Progress Tracker (Python)'
        })

    def fetch_games(self, username: str, year: Optional[str] = None,
                   month: Optional[str] = None) -> List[Dict]:
        """
        Fetch games for a user from chess.com

        Args:
            username: Chess.com username
            year: Year (YYYY format), defaults to current year
            month: Month (MM format), defaults to current month

        Returns:
            List of game data dictionaries
        """
        if not year:
            year = str(datetime.now().year)
        if not month:
            month = str(datetime.now().month).zfill(2)

        url = f"{self.BASE_URL}/player/{username}/games/{year}/{month}"

        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            games = data.get('games', [])
            return games

        except requests.RequestException as e:
            print(f"Error fetching games: {e}")
            raise Exception(f"Failed to fetch games from chess.com: {str(e)}")

    def get_player_stats(self, username: str) -> Dict:
        """Get player statistics"""
        url = f"{self.BASE_URL}/player/{username}/stats"

        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            print(f"Error fetching player stats: {e}")
            raise Exception(f"Failed to fetch player stats: {str(e)}")

    def get_player_profile(self, username: str) -> Dict:
        """Get player profile information"""
        url = f"{self.BASE_URL}/player/{username}"

        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            print(f"Error fetching player profile: {e}")
            raise Exception(f"Failed to fetch player profile: {str(e)}")

    def get_available_archives(self, username: str) -> List[str]:
        """Get list of available monthly archives for a user"""
        url = f"{self.BASE_URL}/player/{username}/games/archives"

        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data.get('archives', [])

        except requests.RequestException as e:
            print(f"Error fetching archives: {e}")
            raise Exception(f"Failed to fetch game archives: {str(e)}")
