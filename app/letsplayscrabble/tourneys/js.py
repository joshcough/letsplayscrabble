import json
import requests

class RawPlayerData:
    def __init__(self, name, pairings, scores):
        self.name = name
        self.pairings = pairings
        self.scores = scores

class RawDivisionData:
    def __init__(self, name, players):
        self.name = name
        self.players = players

class PlayerStats:
    def __init__(self, player, wins, losses, ties, average_score, spread, high_score):
        self.player = player
        self.wins = wins
        self.losses = losses
        self.ties = ties
        self.average_score = average_score
        self.spread = spread
        self.high_score = high_score

    def display_statistics(self, standing):
        print(f"{standing}: {self.player.name}")
        print(f"  Wins: {self.wins}, Losses: {self.losses}, Ties: {self.ties}")
        print(f"  Spread: {self.spread}, Average Score: {self.average_score}, High Score: {self.high_score}")
        # print(f"Games: {self.games}\n")

    @classmethod
    def calculate_player_stats(cls, raw_player, all_raw_player_data):
        total_spread = 0
        total_score = 0
        high_score = 0
        wins = 0
        losses = 0
        ties = 0
        games_played = 0
        games = []

        for game_idx, opponent_idx in enumerate(raw_player.pairings):
            player_score = raw_player.scores[game_idx]
            if opponent_idx == 0:
                total_spread += player_score
                if player_score > 0:
                    wins += 1
                    games += ("Bye", 50)
                else:
                    losses += 1
                    games += ("Forfeit", 50)
            else:
                opponent = all_raw_player_data[opponent_idx]
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

        average_score = round(total_score / games_played, 2) if games_played > 0 else 0
        return cls(raw_player, wins, losses, ties, average_score, total_spread, high_score)

class DivisionStats:
    def __init__(self, division, stats):
        self.division = division
        self.stats = stats

    def standings(self):
        stats = [stat for stat in self.stats if stat.player.name != "Bye"]
        stats.sort(key=lambda p: (-p.wins, -p.ties, p.losses, -p.spread))
        return stats

    def display_standings(self):
        print("===============================")
        print(f"Division {self.division.name}")
        print("===============================")
        for ix, player in enumerate(self.standings()):
            player.display_statistics(ix+1)

def analyze_js_from_url(js_url):
    print_standings_for_all_divisions_in_js(requests.get(js_url).text)

def analyze_js_from_file(file):
    with open(file, 'r') as file:
        print_standings_for_all_divisions_in_js(file.read())

def print_standings_for_all_divisions_in_js(js_content):

    def get_all_division_stats_from_json():
        json_object_str, remaining_content = extract_first_object(js_content)
        json_object_str = json_object_str.replace('undefined', 'null')
        python_dict = json.loads(json_object_str)
        all_divisions_stats = []
        if 'divisions' in python_dict and isinstance(python_dict['divisions'], list):
            for division_json in python_dict['divisions']:
                division_stats = division_stats_from_division_json(division_json)
                all_divisions_stats.append(division_stats)
        return all_divisions_stats

    def division_stats_from_division_json(division_json):
        all_players = [RawPlayerData(name="Bye", pairings=[], scores=[])]
        all_stats = []
        for player_data in division_json['players']:
            if player_data is not None:
                all_players.append(RawPlayerData(
                    name=player_data['name'],
                    pairings=player_data['pairings'],
                    scores=player_data['scores']
                ))
        for player in all_players:
            all_stats.append(PlayerStats.calculate_player_stats(player, all_players))

        return DivisionStats(RawDivisionData(division_json['name'], all_players), all_stats)

    for division_stats in get_all_division_stats_from_json():
        division_stats.display_standings()

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

if __name__ == '__main__':
    # analyze_js_from_url("https://scrabbleplayers.org/directors/AA003954/2024-07-04-Albany-NWL-ME/html/tourney.js")
    analyze_js_from_file("tourney.js")

