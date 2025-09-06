import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BaseOverlay } from "../../components/shared/BaseOverlay";
import { BaseModernOverlay } from "../../components/shared/BaseModernOverlay";
import { useTournamentData } from "../../hooks/useTournamentData";
import { ApiService } from "../../services/interfaces";
import { RankedPlayerStats } from "../../hooks/usePlayerStatsCalculation";
import * as Stats from "../../types/stats";
import { formatRecord } from "../../utils/playerUtils";

type RouteParams = {
  userId?: string;
  tournamentId?: string;
  divisionName?: string;
};

const GameBoardOverlay: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const { tournamentId, divisionName } = useParams<RouteParams>();

  return (
    <BaseModernOverlay>
      {(theme) => {
        const shouldUseCurrentMatch = !tournamentId;

        if (shouldUseCurrentMatch) {
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
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-white">
                        No current match data available
                      </div>
                    </div>
                  );
                }

                const currentGame = divisionData.games.find(
                  (game) =>
                    game.pairingId === currentMatch.pairingId &&
                    game.roundNumber === currentMatch.round,
                );

                if (!currentGame) {
                  return (
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-white">
                        Current game not found in tournament data
                      </div>
                    </div>
                  );
                }

                const {
                  calculateStandingsFromGames,
                } = require("../../utils/calculateStandings");
                const playerStats = calculateStandingsFromGames(
                  divisionData.games,
                  divisionData.players,
                );

                const rankedPlayers = playerStats
                  .sort((a: Stats.PlayerStats, b: Stats.PlayerStats) => {
                    if (a.wins !== b.wins) return b.wins - a.wins;
                    if (a.losses !== b.losses) return a.losses - b.losses;
                    return b.spread - a.spread;
                  })
                  .map(
                    (
                      player: Stats.PlayerStats,
                      index: number,
                    ): RankedPlayerStats => ({
                      ...player,
                      rank: index + 1,
                      rankOrdinal: `${index + 1}${["th", "st", "nd", "rd"][(index + 1) % 100 > 10 && (index + 1) % 100 < 14 ? 0 : (index + 1) % 10] || "th"}`,
                    }),
                  );

                const player1 = rankedPlayers.find(
                  (p: RankedPlayerStats) => p.playerId === currentGame.player1Id,
                );
                const player2 = rankedPlayers.find(
                  (p: RankedPlayerStats) => p.playerId === currentGame.player2Id,
                );

                return <GameBoardDisplay 
                  tournament={tournament}
                  divisionName={currentDivisionName}
                  round={currentMatch.round}
                  player1={player1}
                  player2={player2}
                  theme={theme}
                />;
              }}
            </BaseOverlay>
          );
        } else {
          return <URLBasedGameBoard 
            tournamentId={Number(tournamentId)}
            divisionName={divisionName || ""}
            apiService={apiService}
            theme={theme}
          />;
        }
      }}
    </BaseModernOverlay>
  );
};

const URLBasedGameBoard: React.FC<{
  tournamentId: number;
  divisionName: string;
  apiService: ApiService;
  theme: any;
}> = ({ tournamentId, divisionName, apiService, theme }) => {
  const [searchParams] = useSearchParams();
  const round = searchParams.get("round");
  const player1Id = searchParams.get("player1Id");
  const player2Id = searchParams.get("player2Id");

  const {
    tournamentData,
    loading,
    fetchError,
  } = useTournamentData({
    tournamentId: tournamentId,
    useUrlParams: false,
    apiService,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Error loading tournament data</div>
      </div>
    );
  }

  const targetDivision = tournamentData?.divisions.find(
    (div) => div.name.toUpperCase() === divisionName.toUpperCase(),
  );

  if (!targetDivision) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">
          Division "{divisionName}" not found
        </div>
      </div>
    );
  }

  const {
    calculateStandingsFromGames,
  } = require("../../utils/calculateStandings");
  const playerStats = calculateStandingsFromGames(
    targetDivision.games,
    targetDivision.players,
  );

  const rankedPlayers = playerStats
    .sort((a: Stats.PlayerStats, b: Stats.PlayerStats) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.spread - a.spread;
    })
    .map(
      (
        player: Stats.PlayerStats,
        index: number,
      ): RankedPlayerStats => ({
        ...player,
        rank: index + 1,
        rankOrdinal: `${index + 1}${["th", "st", "nd", "rd"][(index + 1) % 100 > 10 && (index + 1) % 100 < 14 ? 0 : (index + 1) % 10] || "th"}`,
      }),
    );

  const player1 = rankedPlayers.find((p: RankedPlayerStats) => p.playerId === Number(player1Id));
  const player2 = rankedPlayers.find((p: RankedPlayerStats) => p.playerId === Number(player2Id));

  return <GameBoardDisplay 
    tournament={tournamentData}
    divisionName={divisionName}
    round={Number(round) || 1}
    player1={player1}
    player2={player2}
    theme={theme}
  />;
};

const GameBoardDisplay: React.FC<{
  tournament: any;
  divisionName: string;
  round: number;
  player1?: RankedPlayerStats;
  player2?: RankedPlayerStats;
  theme: any;
}> = ({ tournament, round, player1, player2, theme }) => {
  // Get the background class
  const bgClass = theme.colors.pageBackground;
  
  return (
    <div className={`${bgClass} relative overflow-hidden`} style={{ width: '1920px', height: '1080px' }}>
      {/* Top Header Elements */}
      
      {/* Remaining Tiles Content Box - positioned above player 1 */}
      <div className="absolute" style={{ top: '45px', left: '370px' }}>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-2 py-2 relative`} style={{ width: '160px', height: '80px' }}>
          {/* Remaining Tiles Label - overlapping */}
          <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-2 py-0.5 absolute left-1 right-1`} style={{ top: '-10px' }}>
            <div className={`${theme.colors.textPrimary} text-xs font-bold text-center`}>Remaining Tiles</div>
          </div>
          
          {/* Content */}
          <div className={`${theme.colors.textSecondary}`} style={{ fontSize: '9px', lineHeight: '1.1', marginTop: '6px' }}>
            AAAAAAAA | CCCCCC<br/>
            EEEEEEEE E GG H IIIII<br/>
            MM NNNNNN OOOOOOOO<br/>
            RRRR SSS TTTTTT UUUU<br/>
            <span className="text-center block mt-1">86 tiles | 50 consonants</span>
          </div>
        </div>
      </div>

      {/* Center - Tournament Info */}
      <div className="absolute text-center" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)' }}>
        <div className={`${theme.colors.textPrimary} text-2xl font-bold`}>
          {tournament?.name || ""}
        </div>
        <div className={`${theme.colors.textSecondary} text-base`}>
          {tournament?.lexicon || ""} | Round {round}
        </div>
      </div>

      {/* Right - Tournament Info Box - positioned above player 2 */}
      <div className="absolute" style={{ top: '45px', right: '370px' }}>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-2 py-2 relative`} style={{ width: '160px', height: '80px' }}>
          {/* LPS Label - overlapping */}
          <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-2 py-0.5 absolute left-1 right-1`} style={{ top: '-10px' }}>
            <div className="text-green-500 text-xs font-bold text-center">letsplayscrabble.com</div>
          </div>
          
          {/* Content */}
          <div className={`${theme.colors.textSecondary} text-center`} style={{ fontSize: '9px', lineHeight: '1.2', marginTop: '6px' }}>
            <div className={`${theme.colors.textPrimary} font-bold`}>T O R O N T O</div>
            <div>
              <span className="text-blue-500">tile</span> <span className="text-red-500">slingers</span>
            </div>
            <div style={{ fontSize: '8px', marginTop: '4px' }}>Commentary: Josh Sokol & David Spargo</div>
          </div>
        </div>
      </div>

      {/* Main Content Area - back to working position */}
      <div className="absolute" style={{ top: '80px', left: '50px', right: '50px', bottom: '30px' }}>
        <div className="flex gap-6 justify-center h-full">
          
          {/* Left Player Column */}
          <div className="flex flex-col" style={{ width: '280px' }}>
            {/* Player 1 Camera Area - TRANSPARENT */}
            <div className="border-2 border-gray-500 rounded-xl bg-transparent relative" style={{ width: '280px', height: '280px' }}>
              {/* Player 1 Name Box - overlapping camera */}
              <div className={`${theme.colors.cardBackground} border-2 ${theme.colors.primaryBorder} rounded-lg px-3 py-0.5 absolute left-2 right-2`} style={{ borderColor: '#3b82f6', borderWidth: '3px', top: '-18px' }}>
                <div className={`${theme.colors.textPrimary} text-base font-bold text-center`}>
                  {player1?.firstLast || ""}
                </div>
              </div>
            </div>
            
            {/* Player 1 Stats Box */}
            <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-2 mt-3`}>
              <div className={`${theme.colors.textPrimary} text-sm text-center`}>
                {player1 ? formatRecord(player1) : ""} | {player1?.rankOrdinal || ""} Place | Rating {player1?.currentRating || ""}
              </div>
            </div>

            {/* Player 1 Score and Timer - side by side */}
            <div className="flex gap-2 mt-3">
              {/* Player 1 Timer Box */}
              <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-2 flex-1`}>
                <div className={`${theme.colors.textPrimary} text-lg font-mono font-bold text-center`}></div>
              </div>
              
              {/* Player 1 Score Box */}
              <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-2 flex-1`}>
                <div className={`${theme.colors.textSecondary} text-xs`}>Score:</div>
                <div className={`${theme.colors.textPrimary} text-xl font-bold text-center`}></div>
              </div>
            </div>
          </div>

          {/* Center - Board and Racks */}
          <div className="flex flex-col items-center">
            {/* Game Board Camera Area - TRANSPARENT */}
            <div className="border-4 border-purple-700 rounded-2xl bg-transparent" style={{ width: '560px', height: '560px' }}>
              {/* Transparent for board camera */}
            </div>
            
            {/* Last Move Box - under the board */}
            <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-4 py-2 mt-3`} style={{ width: '560px' }}>
              <div className={`${theme.colors.textSecondary} text-xs text-center`}>ST PLAY: Morris 76 PA +16.16 | a lather [n PAS]     LAST</div>
            </div>
            
          </div>

          {/* Right Player Column */}
          <div className="flex flex-col" style={{ width: '280px' }}>
            {/* Player 2 Camera Area - TRANSPARENT */}
            <div className="border-2 border-gray-500 rounded-xl bg-transparent relative" style={{ width: '280px', height: '280px' }}>
              {/* Player 2 Name Box - overlapping camera */}
              <div className={`${theme.colors.cardBackground} border-2 ${theme.colors.primaryBorder} rounded-lg px-3 py-0.5 absolute left-2 right-2`} style={{ borderColor: '#ef4444', borderWidth: '3px', top: '-18px' }}>
                <div className={`${theme.colors.textPrimary} text-base font-bold text-center`}>
                  {player2?.firstLast || ""}
                </div>
              </div>
            </div>
            
            {/* Player 2 Stats Box */}
            <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-2 mt-3`}>
              <div className={`${theme.colors.textPrimary} text-sm text-center`}>
                {player2 ? formatRecord(player2) : ""} | {player2?.rankOrdinal || ""} Place | Rating {player2?.currentRating || ""}
              </div>
            </div>

            {/* Player 2 Score and Timer - side by side */}
            <div className="flex gap-2 mt-3">
              {/* Player 2 Timer Box */}
              <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-2 flex-1`}>
                <div className={`${theme.colors.textPrimary} text-lg font-mono font-bold text-center`}></div>
              </div>
              
              {/* Player 2 Score Box */}
              <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-2 flex-1`}>
                <div className={`${theme.colors.textSecondary} text-xs`}>Score:</div>
                <div className={`${theme.colors.textPrimary} text-xl font-bold text-center`}></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Full-Width Tile Racks - positioned right under last move box */}
      <div className="absolute flex" style={{ top: '720px', left: '0', right: '0', height: '80px' }}>
        {/* Player 1 Rack - Left side, aligned with player 1 camera left edge */}
        <div className="border-2 border-yellow-700 rounded bg-transparent" style={{ 
          width: '500px',
          height: '70px',
          marginLeft: '394px' /* Align with left edge of player 1 camera */
        }}>
          {/* Transparent for player 1 tiles camera */}
        </div>
        
        {/* Small gap in middle for LPS logo */}
        <div style={{ width: '132px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-green-500 text-sm font-bold">LPS</div>
        </div>
        
        {/* Player 2 Rack - Right side, aligned with player 2 camera right edge */}
        <div className="border-2 border-yellow-700 rounded bg-transparent" style={{ 
          width: '500px',
          height: '70px',
          marginRight: '394px' /* Align with right edge of player 2 camera */
        }}>
          {/* Transparent for player 2 tiles camera */}
        </div>
      </div>
    </div>
  );
};

export default GameBoardOverlay;