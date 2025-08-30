import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  BaseOverlay, 
  BaseOverlayDataProps 
} from '../../../components/shared/BaseOverlay';
import { ApiService } from '../../../services/interfaces';
import { BaseModernOverlay } from '../../../components/shared/BaseModernOverlay';
import { Theme } from '../../../types/theme';
import { formatPlayerName, getCurrentRating } from '../../../utils/playerUtils';
import { getPageTextColor } from '../../../utils/themeUtils';

type RouteParams = {
  userId?: string;
  tournamentId?: string;
  divisionName?: string;
  playerId1?: string;
  playerId2?: string;
};

// Abbreviate common tournament words to save space
const abbreviateTournamentName = (name: string): string => {
  return name
    .replace(/\bInternational\b/gi, 'Int\'l')
    .replace(/\bTournament\b/gi, 'Tourney')
    .replace(/\bChampionship\b/gi, 'Championship') // Keep full - important
    .replace(/\bNational\b/gi, 'Nat\'l')
    .replace(/\bRegional\b/gi, 'Regional')
    .replace(/\bInvitational\b/gi, 'Invit\'l')
    .replace(/\bClassic\b/gi, 'Classic')
    .replace(/\bFestival\b/gi, 'Festival')
    .replace(/\bOpen\b/gi, 'Open')
    .replace(/\bMemorial\b/gi, 'Memorial');
};

interface HeadToHeadModernOverlayPageProps {
  apiService: ApiService;
}

const HeadToHeadModernOverlayPage: React.FC<HeadToHeadModernOverlayPageProps> = ({ apiService }) => {
  const { tournamentId, divisionName, playerId1, playerId2 } = useParams<RouteParams>();
  const hasSpecificPlayers = !!(tournamentId && divisionName && playerId1 && playerId2);
  
  return (
    <BaseModernOverlay>
      {(theme, themeClasses) => (
        <BaseOverlay apiService={apiService}>
          {({ tournament, divisionData, divisionName, currentMatch }) => {
            return renderCareerH2H({ tournament, divisionData, divisionName, currentMatch }, hasSpecificPlayers, theme, themeClasses, playerId1, playerId2);
          }}
        </BaseOverlay>
      )}
    </BaseModernOverlay>
  );
};

const renderCareerH2H = (
  data: BaseOverlayDataProps, 
  hasSpecificPlayers: boolean, 
  theme: Theme,
  themeClasses: ReturnType<typeof import('../../../utils/themeUtils').getThemeClasses>,
  playerId1?: string, 
  playerId2?: string
): React.ReactNode => {
  const { divisionData, currentMatch } = data;

  let player1: any, player2: any;

  if (hasSpecificPlayers) {
    player1 = divisionData.players.find(p => p.id === parseInt(playerId1!));
    player2 = divisionData.players.find(p => p.id === parseInt(playerId2!));

    if (!player1 || !player2) {
      return <div>Players not found</div>;
    }
  } else {
    if (!currentMatch) {
      return <div>No current match selected</div>;
    }

    const currentGame = divisionData.games.find(game => 
      game.roundNumber === currentMatch.round && 
      game.pairingId === currentMatch.pairingId
    );

    if (!currentGame) {
      return <div>Current game not found</div>;
    }

    player1 = divisionData.players.find(p => p.id === currentGame.player1Id);
    player2 = divisionData.players.find(p => p.id === currentGame.player2Id);

    if (!player1 || !player2) {
      return <div>Players not found in tournament data</div>;
    }
  }

  // Get historical head-to-head games from cross-tables data
  const historicalGames = divisionData.headToHeadGames?.filter((game: any) =>
    (game.player1.playerid === player1.xtid && game.player2.playerid === player2.xtid) ||
    (game.player1.playerid === player2.xtid && game.player2.playerid === player1.xtid)
  ) || [];

  // Get current tournament games between these players
  const currentTournamentGames = divisionData.games.filter(game =>
    (game.player1Id === player1.id && game.player2Id === player2.id) ||
    (game.player1Id === player2.id && game.player2Id === player1.id)
  ).filter(game => game.player1Score !== null && game.player2Score !== null)
  .map(game => {
    // Figure out which player is which in this game
    const headToHeadPlayer1IsGamePlayer1 = game.player1Id === player1.id;
    
    return {
      gameid: game.id,
      date: new Date().toISOString().split('T')[0],
      isCurrentTournament: true,
      tournamentName: data.tournament.name,
      player1: {
        playerid: player1.xtid,
        name: player1.name,
        score: headToHeadPlayer1IsGamePlayer1 ? game.player1Score : game.player2Score,
      },
      player2: {
        playerid: player2.xtid,
        name: player2.name,
        score: headToHeadPlayer1IsGamePlayer1 ? game.player2Score : game.player1Score,
      }
    };
  });

  const headToHeadGames = [...historicalGames, ...currentTournamentGames];

  const player1Wins = headToHeadGames.filter((game: any) => {
    if (game.player1.playerid === player1.xtid) {
      return game.player1.score > game.player2.score;
    } else {
      return game.player2.score > game.player1.score;
    }
  }).length;

  const player2Wins = headToHeadGames.filter((game: any) => {
    if (game.player1.playerid === player2.xtid) {
      return game.player1.score > game.player2.score;
    } else {
      return game.player2.score > game.player1.score;
    }
  }).length;

  // Calculate average scores
  let player1TotalScore = 0, player2TotalScore = 0, completedGames = 0;
  headToHeadGames.forEach((game: any) => {
    completedGames++;
    if (game.player1.playerid === player1.xtid) {
      player1TotalScore += game.player1.score;
      player2TotalScore += game.player2.score;
    } else {
      player1TotalScore += game.player2.score;
      player2TotalScore += game.player1.score;
    }
  });

  const player1AvgScore = completedGames > 0 ? Math.round(player1TotalScore / completedGames) : 0;
  const player2AvgScore = completedGames > 0 ? Math.round(player2TotalScore / completedGames) : 0;

  // Calculate current tournament record and position
  const calculateRecord = (playerId: number) => {
    let wins = 0, losses = 0, spread = 0;
    divisionData.games.forEach(game => {
      if (game.player1Score === null || game.player2Score === null || game.isBye) return;
      if (game.player1Id === playerId) {
        if (game.player1Score > game.player2Score) wins++;
        else losses++;
        spread += game.player1Score - game.player2Score;
      } else if (game.player2Id === playerId) {
        if (game.player2Score > game.player1Score) wins++;  
        else losses++;
        spread += game.player2Score - game.player1Score;
      }
    });
    return { wins, losses, spread };
  };

  const player1Record = calculateRecord(player1.id);
  const player2Record = calculateRecord(player2.id);

  // Calculate positions
  const sortedPlayers = [...divisionData.players].sort((a, b) => {
    const aRecord = calculateRecord(a.id);
    const bRecord = calculateRecord(b.id);
    const aWinPct = (aRecord.wins + aRecord.losses) > 0 ? aRecord.wins / (aRecord.wins + aRecord.losses) : 0;
    const bWinPct = (bRecord.wins + bRecord.losses) > 0 ? bRecord.wins / (bRecord.wins + bRecord.losses) : 0;
    
    if (aWinPct !== bWinPct) return bWinPct - aWinPct;
    return bRecord.spread - aRecord.spread;
  });

  const player1Position = sortedPlayers.findIndex(p => p.id === player1.id) + 1;
  const player2Position = sortedPlayers.findIndex(p => p.id === player2.id) + 1;


  // Get recent games for display (last 6)
  const recentGames = [...headToHeadGames]
    .sort((a: any, b: any) => {
      if (a.isCurrentTournament && !b.isCurrentTournament) return -1;
      if (!a.isCurrentTournament && b.isCurrentTournament) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 6);

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  return (
    <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-4`}>
      <div className="max-w-7xl w-full">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-[2fr_1fr_2fr] gap-2 max-w-6xl mx-auto">

          {/* Player 1 Card */}
          <div className={themeClasses.card}>
            <div className="flex items-center gap-6 mb-6">
              {/* Photo */}
              {player1.xtData?.photourl || player1.photo ? (
                <img
                  src={player1.xtData?.photourl || player1.photo || undefined}
                  alt={formatPlayerName(player1.name)}
                  className={`w-28 h-32 ${themeClasses.playerImage}`}
                />
              ) : (
                <div className="w-28 h-32 rounded-xl flex items-center justify-center font-bold text-3xl shadow-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                  {formatPlayerName(player1.name).split(' ').map((n: string) => n.charAt(0)).join('')}
                </div>
              )}

              {/* Name and Location */}
              <div>
                <h2 className={`text-xl font-bold ${theme.colors.textPrimary}`}>{formatPlayerName(player1.name)}</h2>
                {player1.xtData?.city && (
                  <p className="text-sm text-gray-400">
                    {player1.xtData.city}{player1.xtData.state && `, ${player1.xtData.state}`}
                  </p>
                )}
                <p className={`text-sm mt-1 ${theme.colors.textSecondary}`}>Rating: {getCurrentRating(player1)}</p>
              </div>
            </div>

            {/* Current Record */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Record</p>
              <p className={`text-lg font-semibold ${theme.colors.textPrimary}`}>
                {player1Record.wins}-{player1Record.losses} {player1Record.spread >= 0 ? '+' : ''}{player1Record.spread}, {player1Position}{getOrdinalSuffix(player1Position)} Place
              </p>
            </div>
          </div>

          {/* Center Section - Title and VS Score */}
          <div className="flex flex-col items-center justify-center">
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className={`text-xl font-bold ${getPageTextColor(theme, 'primary')} opacity-90 tracking-wide`}>Career Head-to-Head</h1>
            </div>

            {/* Score Display */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className={`text-5xl font-black drop-shadow-lg ${theme.colors.textAccent}`}>{player1Wins}</span>
                <div className={`rounded-full w-16 h-16 flex items-center justify-center shadow-xl ring-2 ${theme.colors.accentGradient} ${theme.colors.ringColor}`}>
                  <span className="text-white font-black text-lg">VS</span>
                </div>
                <span className={`text-5xl font-black drop-shadow-lg ${theme.colors.textAccent}`}>{player2Wins}</span>
              </div>
              <div className="text-center">
                <p className={`text-sm ${getPageTextColor(theme, 'secondary')}`}>Average Score</p>
                <p className={`text-xl font-semibold ${getPageTextColor(theme, 'primary')}`}>{player1AvgScore}-{player2AvgScore}</p>
              </div>
            </div>
          </div>

          {/* Player 2 Card */}
          <div className={themeClasses.card}>
            <div className="flex items-center gap-6 mb-6">
              {/* Name and Location */}
              <div className="text-right flex-1">
                <h2 className={`text-xl font-bold ${theme.colors.textPrimary}`}>{formatPlayerName(player2.name)}</h2>
                {player2.xtData?.city && (
                  <p className="text-sm text-gray-400">
                    {player2.xtData.city}{player2.xtData.state && `, ${player2.xtData.state}`}
                  </p>
                )}
                <p className={`text-sm mt-1 ${theme.colors.textSecondary}`}>Rating: {getCurrentRating(player2)}</p>
              </div>

              {/* Photo */}
              {player2.xtData?.photourl || player2.photo ? (
                <img
                  src={player2.xtData?.photourl || player2.photo || undefined}
                  alt={formatPlayerName(player2.name)}
                  className={`w-28 h-32 ${themeClasses.playerImage}`}
                />
              ) : (
                <div className="w-28 h-32 rounded-xl flex items-center justify-center font-bold text-3xl shadow-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                  {formatPlayerName(player2.name).split(' ').map((n: string) => n.charAt(0)).join('')}
                </div>
              )}
            </div>

            {/* Current Record */}
            <div className="mb-6 text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Record</p>
              <p className={`text-lg font-semibold ${theme.colors.textPrimary}`}>
                {player2Record.wins}-{player2Record.losses} {player2Record.spread >= 0 ? '+' : ''}{player2Record.spread}, {player2Position}{getOrdinalSuffix(player2Position)} Place
              </p>
            </div>
          </div>
        </div>

        {/* Latest Games Table Section */}
        <div className="mt-8 max-w-6xl mx-auto">
          <div className="flex justify-center">
            {/* Latest Games Table */}
            <div className="w-full" style={{maxWidth: '56rem'}}>
              <h3 className={`text-sm ${getPageTextColor(theme, 'secondary')} uppercase tracking-wider mb-3 text-center font-semibold`}>Latest Games</h3>
              <div className={`${theme.colors.cardBackground} rounded-xl p-4 border ${theme.colors.primaryBorder} shadow-2xl ${theme.colors.shadowColor}`}>
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[10%]" />
                    <col className="w-[30%]" />
                    <col className="w-[10%]" />
                    <col className="w-[25%]" />
                  </colgroup>
                  <tbody>
                    {recentGames.map((game: any, index: number) => {
                      const player1Won = game.player1.playerid === player1.xtid
                        ? game.player1.score > game.player2.score
                        : game.player2.score > game.player1.score;
                      const scores = game.player1.playerid === player1.xtid
                        ? `${game.player1.score}-${game.player2.score}`
                        : `${game.player2.score}-${game.player1.score}`;
                      const winner = player1Won ? 'W' : 'L';
                      const location = game.tournamentName || game.tourneyname || 'Tournament';

                      return (
                        <tr key={index} className={`border-b ${theme.colors.secondaryBorder} last:border-0 ${theme.colors.hoverBackground} transition-colors`}>
                          <td className={`py-3 px-4 ${theme.colors.textSecondary} text-left`}>{new Date(game.date).toLocaleDateString()}</td>
                          <td className={`py-3 px-2 text-center font-bold ${player1Won ? theme.colors.positiveColor : theme.colors.neutralColor}`}>
                            {winner}
                          </td>
                          <td className={`py-3 px-2 text-center ${theme.colors.textPrimary} font-mono font-bold text-lg`}>{scores}</td>
                          <td className={`py-3 px-2 text-center font-bold ${!player1Won ? theme.colors.positiveColor : theme.colors.neutralColor}`}>
                            {player1Won ? 'L' : 'W'}
                          </td>
                          <td className={`py-3 px-4 ${theme.colors.textSecondary} text-right`} title={location}>
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                              {abbreviateTournamentName(location)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadToHeadModernOverlayPage;