import json
import requests

class Division:

    def __init__(self, division_json):
        self.name = division_json['name']
        players = [Player(name="Bye", pairings=[], scores=[])]
        for player_data in division_json['players']:
            if player_data is not None:
                players.append(Player(
                    name=player_data['name'],
                    pairings=player_data['pairings'],
                    scores=player_data['scores']
                ))
        for player in players:
            player.calculate_statistics(players)
        self.players = players

    def players_sorted_by_standing(self):
        players = [player for player in self.players if player.name != "Bye"]
        players.sort(key=lambda p: (-p.wins, -p.ties, p.losses, -p.spread))
        return players

    def display(self):
        print("===============================")
        print(f"Division {self.name}")
        print("===============================")
        for ix, player in enumerate(self.players_sorted_by_standing()):
            player.display_statistics(ix+1)

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
            player_score = self.scores[game_idx]
            if opponent_idx == 0:
                total_spread += player_score
                if player_score > 0:
                    wins += 1
                    games += ("Bye", 50)
                else:
                    losses += 1
                    games += ("Forfeit", 50)
            else:
                opponent = players[opponent_idx]
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

        self.average_score = round(total_score / games_played, 2) if games_played > 0 else 0
        self.wins = wins
        self.losses = losses
        self.ties = ties
        self.spread = total_spread
        self.high_score = high_score
        self.games = games

    def display_statistics(self, standing):
        print(f"{standing}: {self.name}")
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

def analyze_js_from_url(js_url):
    print_divisions_in_js(requests.get(js_url).text)

def analyze_js_from_file(file):
    with open(file, 'r') as file:
        print_divisions_in_js(file.read())

def get_divisions(js_content):
    json_object_str, remaining_content = extract_first_object(js_content)
    json_object_str = json_object_str.replace('undefined', 'null')
    python_dict = json.loads(json_object_str)
    divisions = []
    if 'divisions' in python_dict and isinstance(python_dict['divisions'], list):
        for division_json in python_dict['divisions']:
            division = Division(division_json)
            divisions.append(division)
    return divisions

def print_divisions_in_js(js_content):
    divisions = get_divisions(js_content)
    for division in divisions:
        division.display()

if __name__ == '__main__':
    # analyze_js_from_url("https://scrabbleplayers.org/directors/AA003954/2024-07-04-Albany-NWL-ME/html/tourney.js")
    analyze_js_from_file("tourney.js")

