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

  const getGameResult = (game: GameResult) => {
    const isWin = game.playerScore > game.opponentScore
    return isWin ? "Win" : "Loss";
  };

  return (
    <div
      className="mt-4 flex flex-col items-start text-sm"
      data-obs={`${side}-game-history`}
    >
      <div className="w-full text-left mb-1">{headerText}</div>
      <table className="w-full border-separate border-spacing-x-4">
        <tbody>
          {reversedGames.map((game, index) => (
            <tr
              key={`${game.round}-${index}`}
              data-obs={`${side}-game-${index + 1}`}
            >
              <td className="whitespace-nowrap">Round {game.round}:</td>
              <td className="whitespace-nowrap">
                {game.playerScore}-{game.opponentScore}
              </td>
              <td
                className={`whitespace-nowrap font-extrabold ${getGameResult(game) === "Win" ? "text-red-600" : "text-blue-600"}`}
              >
                {getGameResult(game)}
              </td>
              <td>vs {game.opponentElemName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GameHistoryDisplay;
