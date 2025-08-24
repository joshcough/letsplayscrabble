import React from "react";
import { useSearchParams } from "react-router-dom";

import {
  BaseOverlay,
  TournamentDisplayData,
  DivisionData,
} from "../../components/shared/BaseOverlay";
import { ApiService } from "../../services/interfaces";

// Helper functions
const formatLocation = (xtData: any): string | null => {
  if (!xtData?.city) return null;
  
  if (xtData.state) {
    return `${xtData.city}, ${xtData.state}`;
  } else if (xtData.country && xtData.country !== 'USA') {
    return `${xtData.city}, ${xtData.country}`;
  } else {
    return xtData.city;
  }
};

const calculateWinPercentage = (wins: number, losses: number, ties: number): number => {
  const totalGames = wins + losses + ties;
  if (totalGames === 0) return 0;
  
  // Count ties as half wins for percentage calculation
  const effectiveWins = wins + (ties * 0.5);
  return Math.round((effectiveWins / totalGames) * 1000) / 10; // Round to 1 decimal place
};

const calculateTournamentRecord = (playerId: number, games: any[]): string => {
  let wins = 0;
  let losses = 0;

  games.forEach(game => {
    // Only count completed games for this player
    if (game.player1Score === null || game.player2Score === null || game.isBye) return;
    if (game.player1Id !== playerId && game.player2Id !== playerId) return;
    
    const playerScore = game.player1Id === playerId ? game.player1Score : game.player2Score;
    const opponentScore = game.player1Id === playerId ? game.player2Score : game.player1Score;
    
    if (playerScore > opponentScore) {
      wins++;
    } else if (playerScore < opponentScore) {
      losses++;
    }
    // Ties are not common in Scrabble, but if they occur, we don't count them in W-L
  });

  return `${wins}-${losses}`;
};

type SourceType = 
  | "name"
  | "location" 
  | "rating"
  | "ranking"
  | "tournament-count"
  | "career-record"
  | "win-percentage"
  | "average-score"
  | "tournament-record"
  | "current-rating"
  | "recent-tournament"
  | "photo"
  | "full-profile";

const renderPlayerData = (
  source: SourceType,
  player: any,
  divisionData: DivisionData,
  tournament: TournamentDisplayData
) => {
  if (!player) {
    return <div>Player not found</div>;
  }

  const { xtData } = player;
  const location = xtData ? formatLocation(xtData) : null;
  const rating = xtData?.twlrating || xtData?.cswrating || null;
  const ranking = xtData?.twlranking || xtData?.cswranking || null;
  const winPercentage = (xtData?.w !== undefined && xtData?.l !== undefined && xtData?.t !== undefined) 
    ? calculateWinPercentage(xtData.w, xtData.l, xtData.t) 
    : null;
  const tournamentRecord = calculateTournamentRecord(player.id, divisionData.games);
  const currentRating = player.ratingsHistory[player.ratingsHistory.length - 1] || player.initialRating;
  
  // New detailed tournament data
  const tournamentCount = xtData?.tournamentCount || null;
  const averageScore = xtData?.averageScore || null;
  // Find most recent tournament win, or fall back to most recent tournament
  const recentWin = xtData?.results?.find((result: any) => result.position === '1' || result.position === 1);
  const recentTournament = recentWin || (xtData?.results && xtData.results.length > 0 ? xtData.results[0] : null);
  const isWin = recentWin && recentTournament === recentWin;
    
  // Debug logging
  console.log('CrossTables Debug:', {
    hasXtData: !!xtData,
    tournamentCount,
    averageScore,
    hasResults: xtData?.results?.length || 0,
    firstResult: recentTournament
  });

  switch (source) {
    case "name":
      return <div>{player.name}</div>;

    case "location":
      return <div>{location || "Location not available"}</div>;

    case "rating":
      return <div>{rating ? `Rating: ${rating}` : "Rating not available"}</div>;

    case "ranking":
      return <div>{ranking ? `Ranking: ${ranking}` : "Ranking not available"}</div>;

    case "tournament-count":
      return <div>{tournamentCount ? `Tournaments: ${tournamentCount}` : "Tournament count not available"}</div>;

    case "career-record":
      if (xtData?.w !== undefined && xtData?.l !== undefined && xtData?.t !== undefined) {
        return <div>Career Record: {xtData.w}-{xtData.l}-{xtData.t}</div>;
      }
      return <div>Career Record: Not available</div>;

    case "win-percentage":
      return <div>{winPercentage !== null ? `Win %: ${winPercentage}%` : "Win % not available"}</div>;

    case "average-score":
      return <div>{averageScore ? `Average Score: ${averageScore.toFixed(1)}` : "Average score not available"}</div>;

    case "tournament-record":
      return <div>Tournament Record: {tournamentRecord}</div>;

    case "current-rating":
      return <div>Current Rating: {currentRating}</div>;

    case "recent-tournament":
      if (recentTournament) {
        return (
          <div>
            Recent Tournament Win:
            <br />
            {recentTournament.name} - {recentTournament.place}/{recentTournament.totalplayers}
            <br />
            {recentTournament.wins}-{recentTournament.losses} {recentTournament.ratingchange > 0 ? '+' : ''}{recentTournament.ratingchange}
          </div>
        );
      }
      return <div>Recent tournament not available</div>;

    case "photo":
      const photoUrl = xtData?.photourl || player.photo;
      console.log('Photo debug:', { 
        xtDataPhotoUrl: xtData?.photourl, 
        playerPhoto: player.photo, 
        finalPhotoUrl: photoUrl,
        hasXtData: !!xtData 
      });
      return photoUrl ? (
        <img 
          src={photoUrl} 
          alt={player.name} 
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            console.error('Image failed to load:', photoUrl);
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="w-32 h-32 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
          {player.name.charAt(0)}
        </div>
      );

    case "full-profile":
      return (
        <div className="bg-white p-6 rounded-lg shadow-lg min-w-96">
          <div className="flex gap-6">
            {/* Photo Section */}
            <div className="flex-shrink-0">
              {xtData?.photourl || player.photo ? (
                <img 
                  src={xtData?.photourl || player.photo} 
                  alt={player.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                  {player.name.charAt(0)}
                </div>
              )}
              {location && (
                <div className="text-sm text-gray-600 mt-2 text-center">
                  {location}
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="flex-grow">
              <h2 className="text-2xl font-bold mb-4">{player.name}</h2>
              
              {rating && (
                <div className="mb-2">
                  <span className="font-semibold">Rating:</span> {rating}
                </div>
              )}
              
              {ranking && (
                <div className="mb-2">
                  <span className="font-semibold">Ranking:</span> {ranking}
                </div>
              )}

              {tournamentCount && (
                <div className="mb-2">
                  <span className="font-semibold">Tournaments:</span> {tournamentCount}
                </div>
              )}

              {xtData?.w !== undefined && xtData?.l !== undefined && xtData?.t !== undefined && (
                <>
                  <div className="mb-2">
                    <span className="font-semibold">Career Record:</span> {xtData.w}-{xtData.l}-{xtData.t}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Career Win %:</span> {winPercentage}%
                  </div>
                </>
              )}

              {averageScore && (
                <div className="mb-2">
                  <span className="font-semibold">Average Score:</span> {averageScore}-386
                </div>
              )}

              {recentTournament && (
                <div className="mb-2">
                  <span className="font-semibold">{isWin ? 'Recent Tournament Win:' : 'Recent Tournament:'}</span>
                  <div className="ml-4">
                    {recentTournament.tourneyname}
                    {recentTournament.date && ` (${recentTournament.date})`}
                  </div>
                  <div className="ml-4">
                    {recentTournament.w}-{recentTournament.l} {recentTournament.spread > 0 ? '+' : ''}{recentTournament.spread}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      );

    default:
      return <div>Unknown source: {source}</div>;
  }
};

const CrossTablesPlayerProfileOverlay: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") as SourceType || "full-profile";
  const playerParam = searchParams.get("player"); // "1" or "2" for current match

  // Validation - must specify player 1 or 2
  if (!playerParam || (playerParam !== "1" && playerParam !== "2")) {
    return (
      <div className="text-black p-2">
        Player parameter required: ?player=1 or ?player=2 for current match
      </div>
    );
  }

  return (
    <BaseOverlay apiService={apiService}>
      {({
        tournament,
        divisionData,
        divisionName: currentDivisionName,
        currentMatch,
      }) => {
        if (!currentMatch) {
          return (
            <div className="text-black p-2">
              No current match data available
            </div>
          );
        }

        // Find the current game
        const currentGame = divisionData.games.find(
          (game) =>
            game.pairingId === currentMatch.pairingId &&
            game.roundNumber === currentMatch.round,
        );

        if (!currentGame) {
          return (
            <div className="text-black p-2">
              Current game not found in tournament data
            </div>
          );
        }

        // Get the right player based on parameter
        const isPlayer1 = playerParam === "1";
        const targetPlayerId = isPlayer1 ? currentGame.player1Id : currentGame.player2Id;
        const targetPlayer = divisionData.players.find(p => p.id === targetPlayerId);

        if (!targetPlayer) {
          return (
            <div className="text-black p-2">
              Player {playerParam} not found in tournament data
            </div>
          );
        }

        return (
          <div className="inline-block">
            {renderPlayerData(source, targetPlayer, divisionData, tournament)}
          </div>
        );
      }}
    </BaseOverlay>
  );
};

export default CrossTablesPlayerProfileOverlay;