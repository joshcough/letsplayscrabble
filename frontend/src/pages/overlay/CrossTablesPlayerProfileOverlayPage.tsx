import React from "react";
import { useParams, useSearchParams } from "react-router-dom";

import * as Domain from "@shared/types/domain";
import {
  BaseOverlay,
} from "../../components/shared/BaseOverlay";
import { ThemeProvider } from "../../components/shared/ThemeProvider";
import PlayerImage from "../../components/shared/PlayerImage";
import { ApiService } from "../../services/interfaces";
import { Theme } from "../../types/theme";
import { formatDate } from "../../utils/formatUtils";
import { getCurrentRating, formatPlayerName } from "../../utils/playerUtils";
import { getThemeClasses } from "../../utils/themeUtils";

type RouteParams = {
  userId?: string;
  tournamentId?: string;
  divisionName?: string;
  playerId?: string;
};

// Helper functions
const formatLocation = (xtData: Domain.CrossTablesPlayer): string | null => {
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
  player: Domain.Player,
  divisionData: Domain.Division,
  tournament: Domain.Tournament,
  theme: Theme,
  themeClasses: ReturnType<typeof getThemeClasses>
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
  const recentWin = xtData?.results?.find((result: Domain.TournamentResult) => result.place === 1);
  const recentTournament = recentWin || (xtData?.results && xtData.results.length > 0 ? xtData.results[0] : null);
  const isWin = recentWin && recentTournament === recentWin;

  return (
    <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
      <div className={`${theme.colors.cardBackground} rounded-3xl p-8 border-2 ${theme.colors.primaryBorder} shadow-2xl ${theme.colors.shadowColor} min-w-[32rem]`}>
        <div className="flex gap-8">
          {/* Photo Section */}
          <div className="flex-shrink-0">
            <PlayerImage
              player={player}
              tournamentDataUrl={tournament.dataUrl}
              className="w-40 h-40 rounded-2xl object-cover border-2 border-blue-400/50 shadow-lg"
              placeholderClassName={`w-40 h-40 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center ${theme.colors.textPrimary} font-bold text-4xl shadow-lg`}
            />
            {location && (
              <div className={`text-xl font-bold ${theme.colors.textAccent} mt-4 text-center`}>
                {location}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="flex-grow">
            <h2 className={`text-5xl font-black mb-3 ${theme.colors.textPrimary}`}>{formatPlayerName(player.name)}</h2>
            
            <div className="grid grid-cols-2 gap-6">
              {rating && (
                <div className={`${theme.colors.cardBackground} rounded-xl p-3 border ${theme.colors.secondaryBorder}`}>
                  <div className={`${theme.colors.textAccent} text-base font-bold uppercase tracking-wider mb-1`}>Rating</div>
                  <div className={`${theme.colors.textPrimary} text-3xl font-black`}>{rating}</div>
                </div>
              )}
              
              {ranking && (
                <div className={`${theme.colors.cardBackground} rounded-xl p-3 border ${theme.colors.secondaryBorder}`}>
                  <div className={`${theme.colors.textAccent} text-base font-bold uppercase tracking-wider mb-1`}>Ranking</div>
                  <div className={`${theme.colors.textPrimary} text-3xl font-black`}>{ranking}</div>
                </div>
              )}

              {tournamentCount && (
                <div className={`${theme.colors.cardBackground} rounded-xl p-3 border ${theme.colors.secondaryBorder}`}>
                  <div className={`${theme.colors.textAccent} text-base font-bold uppercase tracking-wider mb-1`}>Tournaments</div>
                  <div className={`${theme.colors.textPrimary} text-3xl font-black`}>{tournamentCount}</div>
                </div>
              )}

              {xtData?.w !== undefined && xtData?.l !== undefined && xtData?.t !== undefined && (
                <>
                  <div className={`${theme.colors.cardBackground} rounded-xl p-3 border ${theme.colors.secondaryBorder}`}>
                    <div className={`${theme.colors.textAccent} text-base font-bold uppercase tracking-wider mb-1`}>Career Record</div>
                    <div className={`${theme.colors.textPrimary} text-3xl font-black font-mono`}>{xtData.w}-{xtData.l}-{xtData.t}</div>
                  </div>
                  <div className={`${theme.colors.cardBackground} rounded-xl p-3 border ${theme.colors.secondaryBorder}`}>
                    <div className={`${theme.colors.textAccent} text-base font-bold uppercase tracking-wider mb-1`}>Career Win %</div>
                    <div className={`${theme.colors.textPrimary} text-3xl font-black`}>{winPercentage}%</div>
                  </div>
                </>
              )}

              {averageScore && (
                <div className={`${theme.colors.cardBackground} rounded-xl p-3 border ${theme.colors.secondaryBorder} ${!ranking ? 'col-span-2' : ''}`}>
                  <div className={`${theme.colors.textAccent} text-base font-bold uppercase tracking-wider mb-1`}>Average Score</div>
                  <div className={`${theme.colors.textPrimary} text-3xl font-black font-mono`}>
                    {Math.round(averageScore)}{xtData?.opponentAverageScore ? `-${Math.round(xtData.opponentAverageScore)}` : ''}
                  </div>
                </div>
              )}
            </div>

            {recentTournament && (
              <div className={`mt-5 p-4 ${theme.colors.cardBackground} rounded-xl border ${theme.colors.primaryBorder}`}>
                <div className={`${theme.colors.textAccent} text-xl font-bold mb-2`}>
                  {isWin ? '🏆 Recent Tournament Win' : 'Recent Tournament'}
                </div>
                <div className={`${theme.colors.textPrimary} text-2xl font-bold mb-3`}>
                  {recentTournament.name}
                </div>
                <table>
                  <tbody>
                    {recentTournament.date && (
                      <tr>
                        <td className={`${theme.colors.textAccent} text-xl font-semibold opacity-70 pr-3 align-top whitespace-nowrap`}>Date:</td>
                        <td className={`${theme.colors.textAccent} text-xl font-bold`}>{formatDate(recentTournament.date)}</td>
                      </tr>
                    )}
                    {recentTournament.wins !== undefined && recentTournament.losses !== undefined && (
                      <tr>
                        <td className={`${theme.colors.textAccent} text-xl font-semibold opacity-70 pr-3 align-top whitespace-nowrap`}>Record:</td>
                        <td className={`${theme.colors.textPrimary} font-mono text-xl font-bold`}>{recentTournament.wins}-{recentTournament.losses}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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

  // Validation - early return without theme
  if (!hasSpecificPlayer && (!playerParam || (playerParam !== "1" && playerParam !== "2"))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div>
          Either provide tournament/division/player IDs in URL, or use ?player=1 or ?player=2 for current match
        </div>
      </div>
    );
  }

  return (
    <BaseOverlay apiService={apiService}>
      {({ tournament, divisionData, divisionName: currentDivisionName, currentMatch }) => (
        <ThemeProvider
          tournamentId={tournament.id}
          tournamentTheme={tournament.theme || 'scrabble'}
        >
          {(theme, themeClasses) => {
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
        </ThemeProvider>
      )}
    </BaseOverlay>
  );
};

export default CrossTablesPlayerProfileModernOverlay;