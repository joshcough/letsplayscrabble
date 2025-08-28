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

interface HeadToHeadModernOverlayPageProps {
  apiService: ApiService;
}

const HeadToHeadModernOverlayPage: React.FC<HeadToHeadModernOverlayPageProps> = ({ apiService }) => {
  const { tournamentId, divisionName, playerId1, playerId2 } = useParams<RouteParams>();

  const hasSpecificPlayers = !!(tournamentId && divisionName && playerId1 && playerId2);
  
  return (
    <BaseOverlay apiService={apiService}>
      {({ tournament, divisionData, divisionName, currentMatch }) => {
        return renderModernH2H({ tournament, divisionData, divisionName, currentMatch }, hasSpecificPlayers, playerId1, playerId2);
      }}
    </BaseOverlay>
  );
};

const renderModernH2H = (
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
    player1: {
      playerid: game.player1Id === player1.id ? player1.xtid : player2.xtid,
      name: game.player1Id === player1.id ? player1.name : player2.name,
      score: game.player1Id === player1.id ? game.player1Score : game.player2Score,
      oldrating: 0,
      newrating: 0,
    },
    player2: {
      playerid: game.player2Id === player1.id ? player1.xtid : player2.xtid,
      name: game.player2Id === player1.id ? player1.name : player2.name,
      score: game.player2Id === player1.id ? game.player1Score : game.player2Score,
      oldrating: 0,
      newrating: 0,
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

  // Find last completed game
  const lastGame = [...headToHeadGames]
    .sort((a: any, b: any) => {
      if (a.isCurrentTournament && !b.isCurrentTournament) return -1;
      if (!a.isCurrentTournament && b.isCurrentTournament) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];

  // Calculate record going first/second
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

  const winPercentage = headToHeadGames.length > 0 
    ? Math.round((player1Wins / headToHeadGames.length) * 100) 
    : 50;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen flex items-center justify-center p-3">
      <div className="max-w-3xl w-full">
        {/* Compact Modern Layout */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/50 shadow-2xl shadow-black/50">
          
          {/* Minimal Top Bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
            <div className="text-sm text-gray-400 uppercase tracking-wider">Head to Head</div>
            <div className="text-sm text-gray-400">
              Avg: {player1AvgScore}-{player2AvgScore}
            </div>
          </div>

          {/* Main Content - Horizontal Layout */}
          <div className="grid grid-cols-5 gap-4 items-center">
            
            {/* Player 1 - Compact Card */}
            <div className="col-span-2">
              <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
                <div className="flex items-center gap-3">
                  {/* Small Photo */}
                  {player1.xtData?.photourl || player1.photo ? (
                    <img 
                      src={player1.xtData?.photourl || player1.photo || undefined} 
                      alt={formatPlayerName(player1.name)}
                      className="w-18 h-24 rounded-lg object-cover border border-cyan-400/50"
                    />
                  ) : (
                    <div className="w-18 h-24 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {formatPlayerName(player1.name).split(' ').map((n: string) => n.charAt(0)).join('')}
                    </div>
                  )}
                  
                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm">{formatPlayerName(player1.name)}</div>
                    {player1.xtData?.city && (
                      <div className="text-xs text-gray-400">
                        {player1.xtData.city}{player1.xtData.state && `, ${player1.xtData.state}`}
                      </div>
                    )}
                    {/* Mini Stats */}
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      <div className="bg-gray-900/60 backdrop-blur-sm rounded border border-cyan-400/20 px-1 py-0.5">
                        <span className="text-gray-400">1st:</span> <span className="text-cyan-400 font-bold">{player1FirstSecondRecord.goingFirstWins}-{player1FirstSecondRecord.goingFirstLosses}</span>
                      </div>
                      <div className="bg-gray-900/60 backdrop-blur-sm rounded border border-cyan-400/20 px-1 py-0.5">
                        <span className="text-gray-400">2nd:</span> <span className="text-cyan-400 font-bold">{player1FirstSecondRecord.goingSecondWins}-{player1FirstSecondRecord.goingSecondLosses}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Stats - Vertically Centered */}
            <div className="col-span-1 flex flex-col items-center justify-center h-full">
              {/* Main H2H Record - Right in the middle */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl font-black text-cyan-400">{player1Wins}</span>
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-xs">VS</span>
                </div>
                <span className="text-4xl font-black text-blue-400">{player2Wins}</span>
              </div>
            </div>

            {/* Player 2 - Compact Card */}
            <div className="col-span-2">
              <div className="bg-gradient-to-l from-gray-800/30 to-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-blue-500/40 shadow-lg shadow-blue-500/10">
                <div className="flex items-center gap-3">
                  {/* Player Info - Reversed layout */}
                  <div className="flex-1 text-right">
                    <div className="font-bold text-white text-sm">{formatPlayerName(player2.name)}</div>
                    {player2.xtData?.city && (
                      <div className="text-xs text-gray-400">
                        {player2.xtData.city}{player2.xtData.state && `, ${player2.xtData.state}`}
                      </div>
                    )}
                    {/* Mini Stats */}
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      <div className="bg-gray-900/60 backdrop-blur-sm rounded border border-blue-400/20 px-1 py-0.5">
                        <span className="text-gray-400">1st:</span> <span className="text-blue-400 font-bold">{player2FirstSecondRecord.goingFirstWins}-{player2FirstSecondRecord.goingFirstLosses}</span>
                      </div>
                      <div className="bg-gray-900/60 backdrop-blur-sm rounded border border-blue-400/20 px-1 py-0.5">
                        <span className="text-gray-400">2nd:</span> <span className="text-blue-400 font-bold">{player2FirstSecondRecord.goingSecondWins}-{player2FirstSecondRecord.goingSecondLosses}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Small Photo */}
                  {player2.xtData?.photourl || player2.photo ? (
                    <img 
                      src={player2.xtData?.photourl || player2.photo || undefined} 
                      alt={formatPlayerName(player2.name)}
                      className="w-18 h-24 rounded-lg object-cover border border-blue-400/50"
                    />
                  ) : (
                    <div className="w-18 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {formatPlayerName(player2.name).split(' ').map((n: string) => n.charAt(0)).join('')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Last Match */}
          {lastGame && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Last Match</div>
                <div className="text-lg font-bold text-white">
                  {lastGame.player1.playerid === player1.xtid 
                    ? `${lastGame.player1.score}-${lastGame.player2.score}`
                    : `${lastGame.player2.score}-${lastGame.player1.score}`
                  }
                </div>
                <div className="text-xs text-gray-400">
                  {(lastGame as any).isCurrentTournament ? data.tournament.name : new Date(lastGame.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeadToHeadModernOverlayPage;