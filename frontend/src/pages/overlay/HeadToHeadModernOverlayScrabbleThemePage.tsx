import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  BaseOverlay, 
  BaseOverlayDataProps 
} from '../../components/shared/BaseOverlay';
import { ApiService } from '../../services/interfaces';
import { formatPlayerName } from '../../utils/playerUtils';

type RouteParams = {
  userId?: string;
  tournamentId?: string;
  divisionName?: string;
  playerId1?: string;
  playerId2?: string;
};

interface HeadToHeadModernOverlayScrabbleThemePageProps {
  apiService: ApiService;
}

const HeadToHeadModernOverlayScrabbleThemePage: React.FC<HeadToHeadModernOverlayScrabbleThemePageProps> = ({ apiService }) => {
  const { tournamentId, divisionName, playerId1, playerId2 } = useParams<RouteParams>();

  const hasSpecificPlayers = !!(tournamentId && divisionName && playerId1 && playerId2);
  
  return (
    <BaseOverlay apiService={apiService}>
      {({ tournament, divisionData, divisionName, currentMatch }) => {
        return renderCareerH2H({ tournament, divisionData, divisionName, currentMatch }, hasSpecificPlayers, playerId1, playerId2);
      }}
    </BaseOverlay>
  );
};

const renderCareerH2H = (
  data: BaseOverlayDataProps, 
  hasSpecificPlayers: boolean, 
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
  .map(game => ({
    gameid: game.id,
    date: new Date().toISOString().split('T')[0],
    isCurrentTournament: true,
    tournamentName: data.tournament.name,
    player1: {
      playerid: game.player1Id === player1.id ? player1.xtid : player2.xtid,
      name: game.player1Id === player1.id ? player1.name : player2.name,
      score: game.player1Id === player1.id ? game.player1Score : game.player2Score,
    },
    player2: {
      playerid: game.player2Id === player1.id ? player1.xtid : player2.xtid,
      name: game.player2Id === player1.id ? player1.name : player2.name,
      score: game.player2Id === player1.id ? game.player1Score : game.player2Score,
    }
  }));

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

  // Calculate going first/second records
  const calculateFirstSecondRecord = (playerId: number | null) => {
    let goingFirstWins = 0, goingFirstLosses = 0;
    let goingSecondWins = 0, goingSecondLosses = 0;
    
    headToHeadGames.forEach((game: any) => {
      const isPlayer1 = game.player1.playerid === playerId;
      const isPlayer2 = game.player2.playerid === playerId;
      
      if (isPlayer1) {
        if (game.player1.score > game.player2.score) {
          goingFirstWins++;
        } else {
          goingFirstLosses++;
        }
      } else if (isPlayer2) {
        if (game.player2.score > game.player1.score) {
          goingSecondWins++;
        } else {
          goingSecondLosses++;
        }
      }
    });
    
    return { goingFirstWins, goingFirstLosses, goingSecondWins, goingSecondLosses };
  };

  const player1FirstSecondRecord = calculateFirstSecondRecord(player1.xtid);
  const player2FirstSecondRecord = calculateFirstSecondRecord(player2.xtid);

  // Get recent games for display (last 7)
  const recentGames = [...headToHeadGames]
    .sort((a: any, b: any) => {
      if (a.isCurrentTournament && !b.isCurrentTournament) return -1;
      if (!a.isCurrentTournament && b.isCurrentTournament) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 7);

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  return (
    <div className="bg-gradient-to-br from-green-100 via-green-50 to-amber-50 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-7xl w-full">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-[2fr_1fr_2fr] gap-2 max-w-6xl mx-auto">

          {/* Player 1 Card */}
          <div className="bg-gradient-to-br from-amber-50/80 to-yellow-100/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-red-800/30 shadow-2xl shadow-red-800/20">
            <div className="flex items-center gap-6 mb-6">
              {/* Photo */}
              {player1.xtData?.photourl || player1.photo ? (
                <img
                  src={player1.xtData?.photourl || player1.photo || undefined}
                  alt={formatPlayerName(player1.name)}
                  className="w-28 h-32 rounded-xl object-cover border-3 border-red-700/60"
                />
              ) : (
                <div className="w-28 h-32 bg-gradient-to-br from-red-700 to-red-800 rounded-xl flex items-center justify-center text-yellow-100 font-bold text-3xl border-2 border-red-900">
                  {formatPlayerName(player1.name).split(' ').map((n: string) => n.charAt(0)).join('')}
                </div>
              )}

              {/* Name and Location */}
              <div>
                <h2 className="text-xl font-bold text-red-900">{formatPlayerName(player1.name)}</h2>
                {player1.xtData?.city && (
                  <p className="text-sm text-red-700">
                    {player1.xtData.city}{player1.xtData.state && `, ${player1.xtData.state}`}
                  </p>
                )}
              </div>
            </div>

            {/* Current Record */}
            <div className="mb-6">
              <p className="text-xs text-red-700 uppercase tracking-wider mb-1">Current Record</p>
              <p className="text-lg font-semibold text-red-900">
                {player1Record.wins}-{player1Record.losses} {player1Record.spread >= 0 ? '+' : ''}{player1Record.spread}, {player1Position}{getOrdinalSuffix(player1Position)} Place
              </p>
            </div>
          </div>

          {/* Center Section - Title and VS Score */}
          <div className="flex flex-col items-center justify-center">
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-green-800 tracking-wide">Career Head-to-Head</h1>
            </div>

            {/* Score Display */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-5xl font-black text-red-800">{player1Wins}</span>
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-full w-16 h-16 flex items-center justify-center shadow-xl border-2 border-green-800">
                  <span className="text-yellow-100 font-black text-lg">VS</span>
                </div>
                <span className="text-5xl font-black text-blue-800">{player2Wins}</span>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-700">Average Score</p>
                <p className="text-xl font-semibold text-green-900">{player1AvgScore}-{player2AvgScore}</p>
              </div>
            </div>
          </div>

          {/* Player 2 Card */}
          <div className="bg-gradient-to-br from-amber-50/80 to-yellow-100/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-blue-800/30 shadow-2xl shadow-blue-800/20">
            <div className="flex items-center gap-6 mb-6">
              {/* Name and Location */}
              <div className="text-right flex-1">
                <h2 className="text-xl font-bold text-blue-900">{formatPlayerName(player2.name)}</h2>
                {player2.xtData?.city && (
                  <p className="text-sm text-blue-700">
                    {player2.xtData.city}{player2.xtData.state && `, ${player2.xtData.state}`}
                  </p>
                )}
              </div>

              {/* Photo */}
              {player2.xtData?.photourl || player2.photo ? (
                <img
                  src={player2.xtData?.photourl || player2.photo || undefined}
                  alt={formatPlayerName(player2.name)}
                  className="w-28 h-32 rounded-xl object-cover border-3 border-blue-700/60"
                />
              ) : (
                <div className="w-28 h-32 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-yellow-100 font-bold text-3xl border-2 border-blue-900">
                  {formatPlayerName(player2.name).split(' ').map((n: string) => n.charAt(0)).join('')}
                </div>
              )}
            </div>

            {/* Current Record */}
            <div className="mb-6 text-right">
              <p className="text-xs text-blue-700 uppercase tracking-wider mb-1">Current Record</p>
              <p className="text-lg font-semibold text-blue-900">
                {player2Record.wins}-{player2Record.losses} {player2Record.spread >= 0 ? '+' : ''}{player2Record.spread}, {player2Position}{getOrdinalSuffix(player2Position)} Place
              </p>
            </div>
          </div>
        </div>

        {/* Latest Games Table Section with First/Second Records */}
        <div className="mt-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-[1fr_3fr_1fr] gap-4 items-start">

            {/* Player 1 First/Second Record */}
            <div className="space-y-3">
              <h3 className="text-xs text-red-700 uppercase tracking-wider text-center font-semibold">{formatPlayerName(player1.name).split(' ')[0]}'s Record</h3>

              <div className="bg-gradient-to-r from-red-200/80 to-red-100/80 rounded-lg p-3 border-2 border-red-700/40">
                <p className="text-xs text-red-800 mb-1 font-semibold">Going 1st</p>
                <p className="text-xl font-black text-red-900">
                  {player1FirstSecondRecord.goingFirstWins}-{player1FirstSecondRecord.goingFirstLosses}
                </p>
              </div>

              <div className="bg-gradient-to-r from-pink-200/80 to-pink-100/80 rounded-lg p-3 border-2 border-pink-600/40">
                <p className="text-xs text-pink-800 mb-1 font-semibold">Going 2nd</p>
                <p className="text-xl font-black text-pink-900">
                  {player1FirstSecondRecord.goingSecondWins}-{player1FirstSecondRecord.goingSecondLosses}
                </p>
              </div>
            </div>

            {/* Latest Games Table */}
            <div>
              <h3 className="text-sm text-green-800 uppercase tracking-wider mb-3 text-center font-bold">Latest Games</h3>
              <div className="bg-gradient-to-br from-green-50/90 to-green-100/90 rounded-xl p-4 border-3 border-green-700/40 shadow-2xl">
                <table className="w-full text-sm">
                  <tbody>
                    {recentGames.map((game: any, index: number) => {
                      const player1Won = game.player1.playerid === player1.xtid
                        ? game.player1.score > game.player2.score
                        : game.player2.score > game.player1.score;
                      const scores = game.player1.playerid === player1.xtid
                        ? `${game.player1.score}-${game.player2.score}`
                        : `${game.player2.score}-${game.player1.score}`;
                      const winner = player1Won ? 'W' : 'L';
                      const location = game.tournamentName || game.tourney || 'Tournament';

                      return (
                        <tr key={index} className="border-b-2 border-green-200/60 last:border-0 hover:bg-green-100/50 transition-colors">
                          <td className="py-3 px-4 text-green-800 font-medium">{new Date(game.date).toLocaleDateString()}</td>
                          <td className={`py-3 px-3 text-center font-bold ${player1Won ? 'text-red-700' : 'text-green-600'}`}>
                            {winner}
                          </td>
                          <td className="py-3 px-3 text-center text-green-900 font-mono font-bold">{scores}</td>
                          <td className={`py-3 px-3 text-center font-bold ${!player1Won ? 'text-blue-700' : 'text-green-600'}`}>
                            {player1Won ? 'L' : 'W'}
                          </td>
                          <td className="py-3 px-4 text-green-800 text-right truncate max-w-[150px] font-medium" title={location}>
                            {location}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Player 2 First/Second Record */}
            <div className="space-y-3">
              <h3 className="text-xs text-blue-700 uppercase tracking-wider text-center font-semibold">{formatPlayerName(player2.name).split(' ')[0]}'s Record</h3>

              <div className="bg-gradient-to-r from-sky-200/80 to-sky-100/80 rounded-lg p-3 border-2 border-sky-600/40">
                <p className="text-xs text-sky-800 mb-1 text-right font-semibold">Going 1st</p>
                <p className="text-xl font-black text-sky-900 text-right">
                  {player2FirstSecondRecord.goingFirstWins}-{player2FirstSecondRecord.goingFirstLosses}
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-200/80 to-blue-100/80 rounded-lg p-3 border-2 border-blue-700/40">
                <p className="text-xs text-blue-800 mb-1 text-right font-semibold">Going 2nd</p>
                <p className="text-xl font-black text-blue-900 text-right">
                  {player2FirstSecondRecord.goingSecondWins}-{player2FirstSecondRecord.goingSecondLosses}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadToHeadModernOverlayScrabbleThemePage;