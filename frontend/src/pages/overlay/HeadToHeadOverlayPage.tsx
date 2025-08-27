import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  BaseOverlay, 
  BaseOverlayDataProps 
} from '../../components/shared/BaseOverlay';
import { ApiService } from '../../services/interfaces';

type RouteParams = {
  userId?: string;
  tournamentId?: string;
  divisionName?: string;
  playerId1?: string;
  playerId2?: string;
};

// Simplified to just show full head-to-head comparison

interface HeadToHeadOverlayPageProps {
  apiService: ApiService;
}

const HeadToHeadOverlayPage: React.FC<HeadToHeadOverlayPageProps> = ({ apiService }) => {
  const { tournamentId, divisionName, playerId1, playerId2 } = useParams<RouteParams>();

  // Determine mode: specific player IDs vs current match
  const hasSpecificPlayers = !!(tournamentId && divisionName && playerId1 && playerId2);
  
  return (
    <BaseOverlay apiService={apiService}>
      {({ tournament, divisionData, divisionName, currentMatch }) => {
        return renderHeadToHead({ tournament, divisionData, divisionName, currentMatch }, hasSpecificPlayers, playerId1, playerId2);
      }}
    </BaseOverlay>
  );
};

const renderHeadToHead = (
  data: BaseOverlayDataProps, 
  hasSpecificPlayers: boolean, 
  playerId1?: string, 
  playerId2?: string
): React.ReactNode => {
  const { divisionData, currentMatch } = data;

  let player1: any, player2: any;

  if (hasSpecificPlayers) {
    // Specific players mode - find players by ID
    player1 = divisionData.players.find(p => p.id === parseInt(playerId1!));
    player2 = divisionData.players.find(p => p.id === parseInt(playerId2!));

    if (!player1) {
      return <div>Player ID {playerId1} not found in tournament data</div>;
    }
    if (!player2) {
      return <div>Player ID {playerId2} not found in tournament data</div>;
    }
  } else {
    // Current match mode
    if (!currentMatch) {
      return <div>No current match selected</div>;
    }

    // Find the current game from the current match
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
  ).filter(game => game.player1Score !== null && game.player2Score !== null) // Only completed games
  .map(game => ({
    // Convert to head-to-head format for consistency
    gameid: game.id,
    date: new Date().toISOString().split('T')[0], // Use today's date as placeholder
    isCurrentTournament: true, // Flag to identify current tournament games
    player1: {
      playerid: game.player1Id === player1.id ? player1.xtid : player2.xtid,
      name: game.player1Id === player1.id ? player1.name : player2.name,
      score: game.player1Id === player1.id ? game.player1Score : game.player2Score,
      oldrating: 0, // Not available for current tournament
      newrating: 0, // Not available for current tournament
    },
    player2: {
      playerid: game.player2Id === player1.id ? player1.xtid : player2.xtid,
      name: game.player2Id === player1.id ? player1.name : player2.name,
      score: game.player2Id === player1.id ? game.player1Score : game.player2Score,
      oldrating: 0, // Not available for current tournament
      newrating: 0, // Not available for current tournament
    }
  }));

  // Combine historical and current tournament games
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

  // Calculate average scores against each other
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

  // Find last completed game between them (prioritize current tournament, then by date)
  const lastGame = [...headToHeadGames]
    .sort((a: any, b: any) => {
      // Current tournament games come first, then sort by date
      if (a.isCurrentTournament && !b.isCurrentTournament) return -1;
      if (!a.isCurrentTournament && b.isCurrentTournament) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];

  // Calculate current tournament standings
  const calculateRecord = (playerId: number) => {
    let wins = 0, losses = 0;
    divisionData.games.forEach(game => {
      if (game.player1Score === null || game.player2Score === null || game.isBye) return;
      if (game.player1Id === playerId) {
        if (game.player1Score > game.player2Score) wins++;
        else losses++;
      } else if (game.player2Id === playerId) {
        if (game.player2Score > game.player1Score) wins++;  
        else losses++;
      }
    });
    return { wins, losses };
  };

  const player1Record = calculateRecord(player1.id);
  const player2Record = calculateRecord(player2.id);

  // Calculate spreads
  const calculateSpread = (playerId: number) => {
    let spread = 0;
    divisionData.games.forEach(game => {
      if (game.player1Score === null || game.player2Score === null || game.isBye) return;
      if (game.player1Id === playerId) {
        spread += game.player1Score - game.player2Score;
      } else if (game.player2Id === playerId) {
        spread += game.player2Score - game.player1Score;
      }
    });
    return spread;
  };

  const player1Spread = calculateSpread(player1.id);
  const player2Spread = calculateSpread(player2.id);

  // Calculate record going first/second in head-to-head games
  const calculateFirstSecondRecord = (playerId: number | null) => {
    let goingFirstWins = 0, goingFirstLosses = 0;
    let goingSecondWins = 0, goingSecondLosses = 0;
    
    headToHeadGames.forEach((game: any) => {
      const isPlayer1 = game.player1.playerid === playerId;
      const isPlayer2 = game.player2.playerid === playerId;
      
      if (isPlayer1) {
        // This player went first (player1)
        if (game.player1.score > game.player2.score) {
          goingFirstWins++;
        } else {
          goingFirstLosses++;
        }
      } else if (isPlayer2) {
        // This player went second (player2)  
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

  // Calculate current tournament positions
  const sortedPlayers = [...divisionData.players].sort((a, b) => {
    const aRecord = calculateRecord(a.id);
    const bRecord = calculateRecord(b.id);
    const aWinPct = (aRecord.wins + aRecord.losses) > 0 ? aRecord.wins / (aRecord.wins + aRecord.losses) : 0;
    const bWinPct = (bRecord.wins + bRecord.losses) > 0 ? bRecord.wins / (bRecord.wins + bRecord.losses) : 0;
    
    if (aWinPct !== bWinPct) return bWinPct - aWinPct;
    return calculateSpread(b.id) - calculateSpread(a.id);
  });

  const player1Position = sortedPlayers.findIndex(p => p.id === player1.id) + 1;
  const player2Position = sortedPlayers.findIndex(p => p.id === player2.id) + 1;

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        {/* Header with player names and locations */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-left">
            <h2 className="text-4xl font-bold mb-2">{player1.name}</h2>
            {player1.xtData?.city && (
              <div className="text-xl text-gray-600">
                {player1.xtData.city}{player1.xtData.state && `, ${player1.xtData.state}`}{player1.xtData.country && !player1.xtData.state && `, ${player1.xtData.country}`}
              </div>
            )}
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold">Head to head record</h1>
          </div>

          <div className="text-right">
            <h2 className="text-4xl font-bold mb-2">{player2.name}</h2>
            {player2.xtData?.city && (
              <div className="text-xl text-gray-600">
                {player2.xtData.city}{player2.xtData.state && `, ${player2.xtData.state}`}{player2.xtData.country && !player2.xtData.state && `, ${player2.xtData.country}`}
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex justify-between items-center">
          {/* Player 1 Photo */}
          <div className="flex flex-col items-center">
            <div className="mb-6">
              {player1.xtData?.photourl || player1.photo ? (
                <img 
                  src={player1.xtData?.photourl || player1.photo || undefined} 
                  alt={player1.name}
                  className="w-80 h-96 rounded-3xl object-cover border-4 border-green-500"
                  style={{ backgroundColor: '#22c55e' }}
                />
              ) : (
                <div className="w-80 h-96 bg-green-500 rounded-3xl flex items-center justify-center text-white font-bold text-6xl border-4 border-green-600">
                  {player1.name.split(' ').map((n: string) => n.charAt(0)).join('')}
                </div>
              )}
            </div>
          </div>

          {/* Center Stats */}
          <div className="flex-grow mx-12 text-center">
            {/* Head to head record */}
            <div className="text-8xl font-bold mb-6">
              {player1Wins}-{player2Wins}
            </div>
            
            {/* Average scores */}
            <div className="mb-8">
              <div className="text-2xl font-semibold mb-2">Average Score</div>
              <div className="text-6xl font-bold">
                {player1AvgScore}-{player2AvgScore}
              </div>
            </div>

            {/* Last match details */}
            {lastGame && (
              <div className="mb-8">
                <div className="text-2xl font-semibold mb-2">Last Match:</div>
                <div className="text-xl">{new Date(lastGame.date).toLocaleDateString()}</div>
                <div className="text-xl">{(lastGame as any).isCurrentTournament ? data.tournament.name : 'Cross-tables.com'}</div>
                <div className="text-2xl font-semibold">
                  {lastGame.player1.playerid === player1.xtid 
                    ? `${player1.name.split(' ')[0]} ${lastGame.player1.score}-${lastGame.player2.score}`
                    : `${player1.name.split(' ')[0]} ${lastGame.player2.score}-${lastGame.player1.score}`
                  }
                </div>
              </div>
            )}

            {/* First/Second Record */}
            <div className="text-lg text-gray-600 mb-2">
              {player1.name.split(' ')[0]} going first/second: {player1FirstSecondRecord.goingFirstWins}-{player1FirstSecondRecord.goingFirstLosses} / {player1FirstSecondRecord.goingSecondWins}-{player1FirstSecondRecord.goingSecondLosses}
            </div>
            <div className="text-lg text-gray-600">
              {player2.name.split(' ')[0]} going first/second: {player2FirstSecondRecord.goingFirstWins}-{player2FirstSecondRecord.goingFirstLosses} / {player2FirstSecondRecord.goingSecondWins}-{player2FirstSecondRecord.goingSecondLosses}
            </div>
          </div>

          {/* Player 2 Photo */}
          <div className="flex flex-col items-center">
            <div className="mb-6">
              {player2.xtData?.photourl || player2.photo ? (
                <img 
                  src={player2.xtData?.photourl || player2.photo || undefined} 
                  alt={player2.name}
                  className="w-80 h-96 rounded-3xl object-cover border-4 border-green-500"
                  style={{ backgroundColor: '#22c55e' }}
                />
              ) : (
                <div className="w-80 h-96 bg-green-500 rounded-3xl flex items-center justify-center text-white font-bold text-6xl border-4 border-green-600">
                  {player2.name.split(' ').map((n: string) => n.charAt(0)).join('')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom section with current tournament stats and positions */}
        <div className="flex justify-between items-end mt-8">
          {/* Player 1 stats */}
          <div className="text-center">
            <div className="text-2xl font-semibold mb-2">
              {player1Record.wins}-{player1Record.losses} {player1Spread >= 0 ? '+' : ''}{player1Spread}
            </div>
            <div className="text-6xl font-bold">
              {getOrdinalSuffix(player1Position)} <span className="text-3xl">Place</span>
            </div>
          </div>

          {/* Player 2 stats */}
          <div className="text-center">
            <div className="text-2xl font-semibold mb-2">
              {player2Record.wins}-{player2Record.losses} {player2Spread >= 0 ? '+' : ''}{player2Spread}
            </div>
            <div className="text-6xl font-bold">
              {getOrdinalSuffix(player2Position)} <span className="text-3xl">Place</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadToHeadOverlayPage;