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
    return <div className="text-white">Player not found</div>;
  }

  const { xtData } = player;
  const location = xtData ? formatLocation(xtData) : null;
  const rating = getCurrentRating(player);
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
    <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
      <div className="bg-gradient-to-br from-blue-900/50 to-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border-2 border-blue-400/50 shadow-2xl shadow-blue-400/10 min-w-[32rem]">
        <div className="flex gap-8">
          {/* Photo Section */}
          <div className="flex-shrink-0">
            {xtData?.photourl || player.photo ? (
              <img 
                src={xtData?.photourl || player.photo || undefined} 
                alt={player.name}
                className="w-40 h-40 rounded-2xl object-cover border-2 border-blue-400/50 shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                {player.name.charAt(0)}
              </div>
            )}
            {location && (
              <div className="text-sm text-blue-200 mt-3 text-center">
                {location}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="flex-grow">
            <h2 className="text-3xl font-bold mb-5 text-white">{player.name}</h2>
            
            <div className="space-y-3">
              {rating && (
                <div className="flex items-center gap-2">
                  <span className="text-blue-300 font-semibold">Rating:</span>
                  <span className="text-white text-lg">{rating}</span>
                </div>
              )}
              
              {ranking && (
                <div className="flex items-center gap-2">
                  <span className="text-blue-300 font-semibold">Ranking:</span>
                  <span className="text-white text-lg">{ranking}</span>
                </div>
              )}

              {tournamentCount && (
                <div className="flex items-center gap-2">
                  <span className="text-blue-300 font-semibold">Tournaments:</span>
                  <span className="text-white text-lg">{tournamentCount}</span>
                </div>
              )}

              {xtData?.w !== undefined && xtData?.l !== undefined && xtData?.t !== undefined && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 font-semibold">Career Record:</span>
                    <span className="text-white text-lg font-mono">{xtData.w}-{xtData.l}-{xtData.t}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 font-semibold">Career Win %:</span>
                    <span className="text-white text-lg">{winPercentage}%</span>
                  </div>
                </>
              )}

              {averageScore && (
                <div className="flex items-center gap-2">
                  <span className="text-blue-300 font-semibold">Average Score:</span>
                  <span className="text-white text-lg font-mono">
                    {Math.round(averageScore)}{xtData?.opponentAverageScore ? `-${Math.round(xtData.opponentAverageScore)}` : ''}
                  </span>
                </div>
              )}

              {recentTournament && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded-xl border border-blue-400/30">
                  <div className="text-blue-300 font-semibold mb-2">
                    {isWin ? '🏆 Recent Tournament Win' : 'Recent Tournament'}
                  </div>
                  <div className="text-white">
                    {recentTournament.tourneyname}
                  </div>
                  {recentTournament.date && (
                    <div className="text-gray-400 text-sm mt-1">
                      {recentTournament.date}
                    </div>
                  )}
                  <div className="text-white font-mono mt-2">
                    {recentTournament.w}-{recentTournament.l} {recentTournament.spread > 0 ? '+' : ''}{recentTournament.spread}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CrossTablesPlayerProfileModernOverlay: React.FC<{ apiService: ApiService }> = ({
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
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
        <div className="text-white">
          Either provide tournament/division/player IDs in URL, or use ?player=1 or ?player=2 for current match
        </div>
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
              <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
                <div className="text-white">
                  Player ID {playerId} not found in tournament data
                </div>
              </div>
            );
          }
        } else {
          // Current match mode
          if (!currentMatch) {
            return (
              <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
                <div className="text-white">
                  No current match data available
                </div>
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
              <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
                <div className="text-white">
                  Current game not found in tournament data
                </div>
              </div>
            );
          }

          // Get the right player based on parameter
          const isPlayer1 = playerParam === "1";
          const targetPlayerId = isPlayer1 ? currentGame.player1Id : currentGame.player2Id;
          targetPlayer = divisionData.players.find(p => p.id === targetPlayerId);

          if (!targetPlayer) {
            return (
              <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
                <div className="text-white">
                  Player {playerParam} not found in tournament data
                </div>
              </div>
            );
          }
        }

        return renderPlayerProfile(targetPlayer, divisionData, tournament);
      }}
    </BaseOverlay>
  );
};

export default CrossTablesPlayerProfileModernOverlay;