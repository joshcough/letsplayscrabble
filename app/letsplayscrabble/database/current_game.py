from typing import Optional

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, Session
from app.letsplayscrabble.database import Base
from app.letsplayscrabble.database.players import Player

class CurrentGame(Base):
    __tablename__ = 'current_game'

    id = Column(Integer, primary_key=True)  # Primary key
    player1_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    player2_id = Column(Integer, ForeignKey('players.id'), nullable=False)

    # Relationships to the Player model
    player1 = relationship('Player', foreign_keys=[player1_id])
    player2 = relationship('Player', foreign_keys=[player2_id])

class CurrentGameDB:
    def __init__(self, session: Session):
        self.session = session

    def get(self) -> Optional[CurrentGame]:
        return self.session.query(CurrentGame).one_or_none()

    def set_current_game(self, player1_id: int, player2_id: int) -> CurrentGame:
        current_game = self.session.query(CurrentGame).first()  # Only ever one row
        if current_game:
            current_game.player1_id = player1_id
            current_game.player2_id = player2_id
        else:
            current_game = CurrentGame(player1_id=player1_id, player2_id=player2_id)
            self.session.add(current_game)

        self.session.commit()
        return current_game

