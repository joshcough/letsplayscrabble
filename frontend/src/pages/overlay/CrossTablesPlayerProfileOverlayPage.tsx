import React from "react";
import { useParams, useSearchParams } from "react-router-dom";

import * as Domain from "@shared/types/domain";
import {
  BaseOverlay,
  TournamentDisplayData,
} from "../../components/shared/BaseOverlay";
import { ApiService } from "../../services/interfaces";
import { getCurrentRating } from "../../utils/playerUtils";

type RouteParams = {
  userId?: string;
  tournamentId?: string;
  divisionName?: string;
  playerId?: string;
};

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

const renderPlayerProfile = (
  player: any,
  divisionData: Domain.Division,
  tournament: TournamentDisplayData
) => {
  if (!player) {
    return <div>Player not found</div>;
  }

  const { xtData } = player;
  const location = xtData ? formatLocation(xtData) : null;
  const rating = getCurrentRating(player); // Use current rating from ratings history or initial rating
  // const rating = xtData?.twlrating || xtData?.cswrating || null;
  const ranking = xtData?.twlranking || xtData?.cswranking || null;
  const winPercentage = (xtData?.w !== undefined && xtData?.l !== undefined && xtData?.t !== undefined)
    ? calculateWinPercentage(xtData.w, xtData.l, xtData.t) 
    : null;
  const tournamentCount = xtData?.tournamentCount || null;
  const averageScore = xtData?.averageScore || null;
  
  // Find most recent tournament win, or fall back to most recent tournament
  const recentWin = xtData?.results?.find((result: any) => result.position === '1' || result.position === 1);
  const recentTournament = recentWin || (xtData?.results && xtData.results.length > 0 ? xtData.results[0] : null);
  const isWin = recentWin && recentTournament === recentWin;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg min-w-96">
      <div className="flex gap-6">
        {/* Photo Section */}
        <div className="flex-shrink-0">
          {xtData?.photourl || player.photo ? (
            <img 
              src={xtData?.photourl || player.photo || undefined} 
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
                <span className="font-semibold">Career Win %:</span> {winPercentage}
              </div>
            </>
          )}

          {averageScore && (
            <div className="mb-2">
              <span className="font-semibold">Average Score:</span> {Math.round(averageScore)}{xtData?.opponentAverageScore ? `-${Math.round(xtData.opponentAverageScore)}` : ''}
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
};

const CrossTablesPlayerProfileOverlay: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const { userId, tournamentId, divisionName, playerId } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const playerParam = searchParams.get("player"); // "1" or "2" for current match

  // Determine mode: specific player ID vs current match
  const hasSpecificPlayer = !!(tournamentId && divisionName && playerId);

  // Validation
  if (!hasSpecificPlayer && (!playerParam || (playerParam !== "1" && playerParam !== "2"))) {
    return (
      <div className="text-black p-2">
        Either provide tournament/division/player IDs in URL, or use ?player=1 or ?player=2 for current match
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
        let targetPlayer;

        if (hasSpecificPlayer) {
          // Specific player mode - find player by ID
          targetPlayer = divisionData.players.find(p => p.id === parseInt(playerId!));
          if (!targetPlayer) {
            return (
              <div className="text-black p-2">
                Player ID {playerId} not found in tournament data
              </div>
            );
          }
        } else {
          // Current match mode
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
          targetPlayer = divisionData.players.find(p => p.id === targetPlayerId);

          if (!targetPlayer) {
            return (
              <div className="text-black p-2">
                Player {playerParam} not found in tournament data
              </div>
            );
          }
        }

        return (
          <div className="inline-block">
            {renderPlayerProfile(targetPlayer, divisionData, tournament)}
          </div>
        );
      }}
    </BaseOverlay>
  );
};

export default CrossTablesPlayerProfileOverlay;