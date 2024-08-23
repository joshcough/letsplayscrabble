from app.letsplayscrabble.database.base import Base
from app.letsplayscrabble.database.current_game import CurrentGameDB
from app.letsplayscrabble.database.players import PlayersDB

class DB_API:
    def __init__(self, db_session):
        self.players = PlayersDB(db_session)
        self.current_game = CurrentGameDB(db_session)
