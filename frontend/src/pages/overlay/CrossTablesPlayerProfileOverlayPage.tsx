import React from "react";
import { useParams, useSearchParams } from "react-router-dom";

import * as Domain from "@shared/types/domain";
import {
  BaseOverlay,
} from "../../components/shared/BaseOverlay";
import { ThemeProvider } from "../../components/shared/ThemeProvider";
import { ApiService } from "../../services/interfaces";
import { Theme } from "../../types/theme";
import { getCurrentRating, formatPlayerName } from "../../utils/playerUtils";

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
  tournament: Domain.Tournament,
  theme: Theme,
  themeClasses: any
) => {
  if (!player) {
    return <div className={`${theme.colors.textPrimary}`}>Player not found</div>;
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
    <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
      <div className={`${theme.colors.cardBackground} rounded-3xl p-8 border-2 ${theme.colors.primaryBorder} shadow-2xl ${theme.colors.shadowColor} min-w-[32rem]`}>
        <div className="flex gap-8">
          {/* Photo Section */}
          <div className="flex-shrink-0">
            {xtData?.photourl || player.photo ? (
              <img 
                src={xtData?.photourl || player.photo || undefined} 
                alt={formatPlayerName(player.name)}
                className="w-40 h-40 rounded-2xl object-cover border-2 border-blue-400/50 shadow-lg"
              />
            ) : (
              <div className={`w-40 h-40 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center ${theme.colors.textPrimary} font-bold text-4xl shadow-lg`}>
                {formatPlayerName(player.name).charAt(0)}
              </div>
            )}
            {location && (
              <div className={`text-xl font-bold ${theme.colors.textAccent} mt-4 text-center`}>
                {location}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="flex-grow">
            <h2 className={`text-5xl font-black mb-6 ${theme.colors.textPrimary}`}>{formatPlayerName(player.name)}</h2>
            
            <div className="grid grid-cols-2 gap-6">
              {rating && (
                <div className={`${theme.colors.cardBackground} rounded-xl p-4 border ${theme.colors.secondaryBorder}`}>
                  <div className={`${theme.colors.textAccent} text-lg font-bold uppercase tracking-wider mb-2`}>Rating</div>
                  <div className={`${theme.colors.textPrimary} text-4xl font-black`}>{rating}</div>
                </div>
              )}
              
              {ranking && (
                <div className={`${theme.colors.cardBackground} rounded-xl p-4 border ${theme.colors.secondaryBorder}`}>
                  <div className={`${theme.colors.textAccent} text-lg font-bold uppercase tracking-wider mb-2`}>Ranking</div>
                  <div className={`${theme.colors.textPrimary} text-4xl font-black`}>{ranking}</div>
                </div>
              )}

              {tournamentCount && (
                <div className={`${theme.colors.cardBackground} rounded-xl p-4 border ${theme.colors.secondaryBorder}`}>
                  <div className={`${theme.colors.textAccent} text-lg font-bold uppercase tracking-wider mb-2`}>Tournaments</div>
                  <div className={`${theme.colors.textPrimary} text-4xl font-black`}>{tournamentCount}</div>
                </div>
              )}

              {xtData?.w !== undefined && xtData?.l !== undefined && xtData?.t !== undefined && (
                <>
                  <div className={`${theme.colors.cardBackground} rounded-xl p-4 border ${theme.colors.secondaryBorder}`}>
                    <div className={`${theme.colors.textAccent} text-lg font-bold uppercase tracking-wider mb-2`}>Career Record</div>
                    <div className={`${theme.colors.textPrimary} text-4xl font-black font-mono`}>{xtData.w}-{xtData.l}-{xtData.t}</div>
                  </div>
                  <div className={`${theme.colors.cardBackground} rounded-xl p-4 border ${theme.colors.secondaryBorder}`}>
                    <div className={`${theme.colors.textAccent} text-lg font-bold uppercase tracking-wider mb-2`}>Career Win %</div>
                    <div className={`${theme.colors.textPrimary} text-4xl font-black`}>{winPercentage}%</div>
                  </div>
                </>
              )}

              {averageScore && (
                <div className={`${theme.colors.cardBackground} rounded-xl p-4 border ${theme.colors.secondaryBorder} ${!ranking ? 'col-span-2' : ''}`}>
                  <div className={`${theme.colors.textAccent} text-lg font-bold uppercase tracking-wider mb-2`}>Average Score</div>
                  <div className={`${theme.colors.textPrimary} text-4xl font-black font-mono`}>
                    {Math.round(averageScore)}{xtData?.opponentAverageScore ? `-${Math.round(xtData.opponentAverageScore)}` : ''}
                  </div>
                </div>
              )}
            </div>

            {recentTournament && (
              <div className={`mt-8 p-4 ${theme.colors.cardBackground} rounded-xl border ${theme.colors.primaryBorder}`}>
                <div className={`${theme.colors.textAccent} text-xl font-bold mb-3`}>
                  {isWin ? '🏆 Recent Tournament Win' : 'Recent Tournament'}
                </div>
                <div className={`${theme.colors.textPrimary} text-2xl font-bold`}>
                  {recentTournament.tourneyname}
                </div>
                {recentTournament.date && (
                  <div className={`${theme.colors.textAccent} text-lg mt-2 font-semibold`}>
                    {recentTournament.date}
                  </div>
                )}
                {recentTournament.w !== undefined && recentTournament.l !== undefined && (
                  <div className={`${theme.colors.textPrimary} font-mono text-xl font-bold mt-3`}>
                    {recentTournament.w}-{recentTournament.l} {recentTournament.spread > 0 ? '+' : ''}{recentTournament.spread}
                  </div>
                )}
              </div>
            )}
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

  return (
    <ThemeProvider>
      {(theme, themeClasses) => {
        // Validation
        if (!hasSpecificPlayer && (!playerParam || (playerParam !== "1" && playerParam !== "2"))) {
          return (
            <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
              <div className={`${theme.colors.textPrimary}`}>
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
                    <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
                      <div className={`${theme.colors.textPrimary}`}>
                        Player ID {playerId} not found in tournament data
                      </div>
                    </div>
                  );
                }
              } else {
                // Current match mode
                if (!currentMatch) {
                  return (
                    <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
                      <div className={`${theme.colors.textPrimary}`}>
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
                    <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
                      <div className={`${theme.colors.textPrimary}`}>
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
                    <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
                      <div className={`${theme.colors.textPrimary}`}>
                        Player {playerParam} not found in tournament data
                      </div>
                    </div>
                  );
                }
              }

              return renderPlayerProfile(targetPlayer, divisionData, tournament, theme, themeClasses);
            }}
          </BaseOverlay>
        );
      }}
    </ThemeProvider>
  );
};

export default CrossTablesPlayerProfileModernOverlay;