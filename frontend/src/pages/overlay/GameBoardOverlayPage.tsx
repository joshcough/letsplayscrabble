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
  return (
    <div className={`${theme.colors.pageBackground} relative`} style={{ width: '1920px', height: '1080px', overflow: 'hidden' }}>
      
      {/* EXACT POSITIONING BASED ON ORIGINAL SCREENSHOT */}
      
      {/* Tournament Name and Info - Overlapping Game Board */}
      <div className="absolute" style={{ top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-4 py-1`}>
          <div className={`${theme.colors.textPrimary} text-lg font-bold text-center`}>
            {tournament?.name || ""} - {tournament?.lexicon || ""} | Round {round}
          </div>
        </div>
      </div>

      {/* Remaining Tiles Box - Upper Left */}
      <div className="absolute" style={{ top: '80px', left: '400px' }}>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-2 relative`} style={{ width: '280px', height: '120px' }}>
          <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-2 py-0.5 absolute`} style={{ top: '-10px', left: '20px', right: '20px', zIndex: 1, backgroundColor: 'var(--bg-color, #f5f5dc)' }}>
            <div className={`${theme.colors.textPrimary} text-xs font-bold text-center`}>Remaining Tiles</div>
          </div>
          <div className={`${theme.colors.textSecondary}`} style={{ fontSize: '12px', lineHeight: '1.2', marginTop: '15px' }}>
            AAAAAAAA | CCCCCC<br/>
            EEEEEEEE E GG H IIIII<br/>
            MM NNNNNN OOOOOOOO<br/>
            RRRR SSS TTTTTT UUUU<br/>
            <div className="text-center mt-1">86 tiles | 50 consonants</div>
          </div>
        </div>
      </div>

      {/* LPS Info Box - Upper Right */}
      <div className="absolute" style={{ top: '80px', right: '400px' }}>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-2 relative`} style={{ width: '280px', height: '120px' }}>
          <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-2 py-0.5 absolute`} style={{ top: '-10px', left: '20px', right: '20px', zIndex: 1, backgroundColor: 'var(--bg-color, #f5f5dc)' }}>
            <div className="text-green-500 text-xs font-bold text-center">letsplayscrabble.com</div>
          </div>
          <div className={`${theme.colors.textSecondary} text-center`} style={{ fontSize: '14px', lineHeight: '1.3', marginTop: '15px' }}>
            <div className={`${theme.colors.textPrimary} font-bold`}>T O R O N T O</div>
            <div><span className="text-blue-500">tile</span> <span className="text-red-500">slingers</span></div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Commentary: Josh Sokol & David Spargo</div>
          </div>
        </div>
      </div>

      {/* Player 1 - Left Side */}
      {/* Player 1 Camera - Transparent */}
      <div className="absolute border-2 border-gray-500 rounded-lg bg-transparent" style={{ 
        top: '230px', left: '400px', width: '280px', height: '280px' 
      }} />

      {/* Player 1 Name - Overlapping Camera */}
      <div className="absolute" style={{ top: '220px', left: '420px', width: '240px' }}>
        <div className={`${theme.colors.cardBackground} border-2 border-blue-500 rounded-lg px-3 py-0.5`}>
          <div className={`${theme.colors.textPrimary} text-base font-bold text-center`}>
            {player1?.firstLast || ""}
          </div>
        </div>
      </div>

      {/* Player 1 Stats */}
      <div className="absolute" style={{ top: '515px', left: '400px' }}>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-2`} style={{ width: '280px' }}>
          <div className={`${theme.colors.textPrimary} text-sm text-center`}>
            {player1 ? formatRecord(player1) : ""} | {player1?.rankOrdinal || ""} Place | Rating {player1?.currentRating || ""}
          </div>
        </div>
      </div>

      {/* Player 1 Timer and Score - Side by Side */}
      <div className="absolute flex gap-2" style={{ top: '570px', left: '400px' }}>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-3 flex items-center justify-center`} style={{ width: '137px', height: '50px' }}>
          <div className={`${theme.colors.textPrimary} text-lg font-mono font-bold text-center`}>21:34</div>
        </div>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-3 flex items-center justify-center`} style={{ width: '137px', height: '50px' }}>
          <div className={`${theme.colors.textPrimary} text-xl font-bold text-center`}>456</div>
        </div>
      </div>

      {/* Game Board - Center */}
      <div className="absolute border-4 border-purple-700 rounded-2xl bg-transparent" style={{ 
        top: '80px', left: '50%', transform: 'translateX(-50%)', width: '540px', height: '540px' 
      }} />

      {/* Last Move Box */}
      <div className="absolute" style={{ top: '630px', left: '50%', transform: 'translateX(-50%)' }}>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-4 py-2`} style={{ width: '540px' }}>
          <div className={`${theme.colors.textSecondary} text-xs text-center`}>ST PLAY: Morris 76 PA +16.16 | a lather [n PAS]     LAST</div>
        </div>
      </div>

      {/* Player 2 - Right Side */}
      {/* Player 2 Camera - Transparent */}
      <div className="absolute border-2 border-gray-500 rounded-lg bg-transparent" style={{ 
        top: '230px', right: '400px', width: '280px', height: '280px' 
      }} />

      {/* Player 2 Name - Overlapping Camera */}
      <div className="absolute" style={{ top: '220px', right: '420px', width: '240px' }}>
        <div className={`${theme.colors.cardBackground} border-2 border-red-500 rounded-lg px-3 py-0.5`}>
          <div className={`${theme.colors.textPrimary} text-base font-bold text-center`}>
            {player2?.firstLast || ""}
          </div>
        </div>
      </div>

      {/* Player 2 Stats */}
      <div className="absolute" style={{ top: '515px', right: '400px' }}>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-2`} style={{ width: '280px' }}>
          <div className={`${theme.colors.textPrimary} text-sm text-center`}>
            {player2 ? formatRecord(player2) : ""} | {player2?.rankOrdinal || ""} Place | Rating {player2?.currentRating || ""}
          </div>
        </div>
      </div>

      {/* Player 2 Timer and Score - Side by Side */}
      <div className="absolute flex gap-2" style={{ top: '570px', right: '398px' }}>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-3 flex items-center justify-center`} style={{ width: '137px', height: '50px' }}>
          <div className={`${theme.colors.textPrimary} text-lg font-mono font-bold text-center`}>17:56</div>
        </div>
        <div className={`${theme.colors.cardBackground} ${theme.colors.primaryBorder} border-2 rounded-lg px-3 py-3 flex items-center justify-center`} style={{ width: '137px', height: '50px' }}>
          <div className={`${theme.colors.textPrimary} text-xl font-bold text-center`}>399</div>
        </div>
      </div>

      {/* Tile Racks - Extended toward center */}
      <div className="absolute flex" style={{ top: '685px', left: '400px', right: '400px' }}>
        {/* Player 1 Tile Rack - left aligned, extended right */}
        <div className="border-2 border-yellow-700 rounded bg-transparent" style={{ 
          width: '480px', height: '80px' 
        }} />
        
        {/* Center space with LPS */}
        <div className="flex items-center justify-center" style={{ width: '160px' }}>
          <div className="text-green-500 text-sm font-bold">LPS</div>
        </div>
        
        {/* Player 2 Tile Rack - right aligned, extended left */}
        <div className="border-2 border-yellow-700 rounded bg-transparent" style={{ 
          width: '480px', height: '80px' 
        }} />
      </div>

    </div>
  );
};

export default GameBoardOverlay;