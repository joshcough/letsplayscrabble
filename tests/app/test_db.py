
def test_insert_and_get_player(db_api):
    player = db_api.players.insert_player("Nigel", "Richards")
    players = db_api.players.get_all()
    assert player in players, f"Player {player.first_name} {player.last_name} is not in the database"
