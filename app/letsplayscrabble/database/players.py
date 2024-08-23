from typing import Optional

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship, Session
from app.letsplayscrabble.database import Base

class Player(Base):
    __tablename__ = 'players'

    id = Column(Integer, primary_key=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)

    def __repr__(self):
        return f'<Player {self.first_name} {self.last_name}>'

    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"

class PlayersDB:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> [Player]:
        return self.session.query(Player).all()

    def get_by_id(self, player_id) -> Optional[Player]:
        return self.session.query(Player).get(player_id)

    def insert_player(self, first_name: String, last_name: String) -> Player:
        new_player = Player(first_name=first_name, last_name=last_name)
        self.session.add(new_player)
        self.session.commit()
        return new_player

