import { GameResult } from "@shared/types/tournament";

const GameHistoryDisplay = ({
  games,
  side,
}: {
  games: GameResult[];
  side: "player1" | "player2";
}) => {
  if (!games || games.length === 0) {
    return null;
  }

  const reversedGames = [...games].reverse();
  const headerText =
    games.length === 1 ? "Last Game:" : `Last ${games.length} Games:`;

  return (
    <div
      className="mt-4 flex flex-col items-start"
      data-obs={`${side}-game-history`}
    >
      <div className="text-base w-full text-left">{headerText}</div>
      {reversedGames.map((game, index) => (
        <div
          key={`${game.round}-${index}`}
          className="text-base w-full text-left"
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
