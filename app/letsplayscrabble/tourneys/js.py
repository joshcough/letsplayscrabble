import json
import requests

class Player:
    def __init__(self, name, pairings, scores):
        self.name = name
        self.pairings = pairings
        self.scores = scores
        self.wins = 0
        self.losses = 0
        self.ties = 0
        self.spread = 0
        self.average_score = 0
        self.high_score = 0
        self.games = []

    def calculate_statistics(self, players):
        total_spread = 0
        total_score = 0
        high_score = 0
        wins = 0
        losses = 0
        ties = 0
        games_played = 0
        games = []

        for game_idx, opponent_idx in enumerate(self.pairings):
            if opponent_idx == 0:
                player_score = self.scores[game_idx]
                total_spread += player_score
                if player_score > 0:
                    wins += 1
                    games += ("Bye", 50)
                else:
                    losses += 1
                    games += ("Forfeit", 50)
            else:
                opponent = players[opponent_idx]
                player_score = self.scores[game_idx]
                opponent_score = opponent.scores[game_idx]
                spread = player_score - opponent_score
                total_spread += spread

                if player_score > opponent_score:
                    wins += 1
                elif player_score < opponent_score:
                    losses += 1
                else:
                    ties += 1

                total_score += player_score
                high_score = max(high_score, player_score)
                games_played += 1
                games += (opponent.name, (player_score, opponent_score), spread)

    # Calculate average score based on non-bye games (25 games in Joey's case)
        self.average_score = round(total_score / games_played, 2) if games_played > 0 else 0
        self.wins = wins
        self.losses = losses
        self.ties = ties
        self.spread = total_spread
        self.high_score = high_score
        self.games = games

    def display_statistics(self):
        print(f"Player: {self.name}")
        print(f"  Wins: {self.wins}, Losses: {self.losses}, Ties: {self.ties}")
        print(f"  Spread: {self.spread}, Average Score: {self.average_score}, High Score: {self.high_score}")
        # print(f"Games: {self.games}\n")


def extract_first_object(js_content):
    # Find where the object starts (after "newt=")
    start_index = js_content.find('newt=') + len('newt=')
    if start_index == -1:
        raise ValueError("Couldn't find the 'newt=' part.")

    # Strip the leading part before the actual object
    js_content = js_content[start_index:].strip()

    # Use a simple brace counting method to find the end of the first object
    brace_count = 0
    object_end_index = -1

    for i, char in enumerate(js_content):
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                object_end_index = i
                break

    if object_end_index == -1:
        raise ValueError("Couldn't find the end of the object.")

    # Extract the object and the remaining part of the file
    json_object_str = js_content[:object_end_index + 1]
    remaining_content = js_content[object_end_index + 1:].strip()

    return json_object_str, remaining_content

def analyze_js(js_url):
    response = requests.get(js_url)
    js_content = response.text
    try:
        json_object_str, remaining_content = extract_first_object(js_content)
        json_object_str = json_object_str.replace('undefined', 'null')
        python_dict = json.loads(json_object_str)
        if 'divisions' in python_dict and isinstance(python_dict['divisions'], list):
            for division in python_dict['divisions']:

                print("===============================")
                print(f"Division {division['name']}")
                print("===============================")
                players_data = division['players']

                players = [Player(name="Bye", pairings=[], scores=[])]
                for player_data in players_data:
                    # print(player_data)
                    if player_data is not None:
                        player = Player(
                            name=player_data['name'],
                            pairings=player_data['pairings'],
                            scores=player_data['scores']
                        )
                        players.append(player)
                for player in players:
                    player.calculate_statistics(players)

                players = [player for player in players if player.name != "Bye"]
                players.sort(key=lambda p: (-p.wins, -p.ties, p.losses, -p.spread))

                for player in players:
                    player.display_statistics()

                print("\n")
    except ValueError as e:
        print(f"Error: {e}")


if __name__ == '__main__':
    analyze_js("https://scrabbleplayers.org/directors/AA003954/2024-07-04-Albany-NWL-ME/html/tourney.js")
