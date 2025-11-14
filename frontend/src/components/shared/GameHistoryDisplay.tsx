import React from "react";

interface GameResult {
  round: number;
  opponentName: string;
  playerScore: number;
  opponentScore: number;
}

interface GameHistoryDisplayProps {
  games: GameResult[];
  side: "player1" | "player2";
  opponentNameKey?: "opponentName";
}

const GameHistoryDisplay: React.FC<GameHistoryDisplayProps> = ({
  games,
  side,
  opponentNameKey = "opponentName",
}) => {
  if (!games || games.length === 0) {
    return null;
  }

  const headerText =
    games.length === 1 ? "Last Game:" : `Last ${games.length} Games:`;

  const getGameResult = (game: GameResult) => {
    if (game.playerScore > game.opponentScore) {
      return "Win";
    } else if (game.playerScore === game.opponentScore) {
      return "Tie";
    } else {
      return "Loss";
    }
  };

  return (
    <div
      className="mt-4 flex flex-col items-start text-sm"
      data-obs={`${side}-game-history`}
    >
      <div className="w-full text-left mb-1">{headerText}</div>
      <table className="w-full border-separate border-spacing-x-4">
        <tbody>
          {games.map((game, index) => (
            <tr
              key={`${game.round}-${index}`}
              data-obs={`${side}-game-${index + 1}`}
            >
              <td className="whitespace-nowrap">Round {game.round}:</td>
              <td className="whitespace-nowrap">
                {game.playerScore}-{game.opponentScore}
              </td>
              <td
                className={`whitespace-nowrap font-extrabold ${
                  getGameResult(game) === "Win"
                    ? "text-red-600"
                    : getGameResult(game) === "Tie"
                    ? "text-gray-600"
                    : "text-blue-600"
                }`}
              >
                {getGameResult(game)}
              </td>
              <td>vs {game[opponentNameKey]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GameHistoryDisplay;
