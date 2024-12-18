import { GameResult } from "@shared/types/tournament";

const GameHistoryDisplay = ({
  games,
  side,
}: {
  games: GameResult[];
  side: "player1" | "player2";
}) => {
  if (!games || games.length === 0) return null;

  return (
    <div className="mt-4 space-y-2" data-obs={`${side}-game-history`}>
      <h3 className="font-semibold">Recent Games:</h3>
      {games.map((game, index) => (
        <div
          key={`${game.round}-${index}`}
          className="text-sm"
          data-obs={`${side}-game-${index + 1}`}
        >
          Round {game.round}: {game.playerScore}-{game.opponentScore} vs{" "}
          {game.opponentName}
        </div>
      ))}
    </div>
  );
};

export default GameHistoryDisplay;
