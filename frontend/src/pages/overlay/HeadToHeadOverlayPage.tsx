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
  const { userId, tournamentId, divisionName, playerId1, playerId2 } = useParams<RouteParams>();

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

  // Calculate head-to-head record from all games in tournament
  const headToHeadGames = divisionData.games.filter(game =>
    (game.player1Id === player1.id && game.player2Id === player2.id) ||
    (game.player1Id === player2.id && game.player2Id === player1.id)
  );

  const player1Wins = headToHeadGames.filter(game => {
    if (game.player1Score === null || game.player2Score === null) return false;
    if (game.player1Id === player1.id) {
      return game.player1Score > game.player2Score;
    } else {
      return game.player2Score > game.player1Score;
    }
  }).length;

  const player2Wins = headToHeadGames.filter(game => {
    if (game.player1Score === null || game.player2Score === null) return false;
    if (game.player1Id === player2.id) {
      return game.player1Score > game.player2Score;
    } else {
      return game.player2Score > game.player1Score;
    }
  }).length;

  // Calculate average scores against each other
  let player1TotalScore = 0, player2TotalScore = 0, completedGames = 0;
  headToHeadGames.forEach(game => {
    if (game.player1Score !== null && game.player2Score !== null) {
      completedGames++;
      if (game.player1Id === player1.id) {
        player1TotalScore += game.player1Score;
        player2TotalScore += game.player2Score;
      } else {
        player1TotalScore += game.player2Score;
        player2TotalScore += game.player1Score;
      }
    }
  });

  const player1AvgScore = completedGames > 0 ? Math.round(player1TotalScore / completedGames) : 0;
  const player2AvgScore = completedGames > 0 ? Math.round(player2TotalScore / completedGames) : 0;

  // Find last completed game between them
  const lastGame = [...headToHeadGames]
    .filter(game => game.player1Score !== null && game.player2Score !== null)
    .sort((a, b) => b.roundNumber - a.roundNumber)[0];

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

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg min-w-[800px]">
      <div className="flex justify-between items-start mb-8">
        {/* Player 1 */}
        <div className="flex flex-col items-center w-64">
          <h2 className="text-2xl font-bold mb-2">{player1.name}</h2>
          {player1.xtData?.city && (
            <div className="text-gray-600 mb-4">{player1.xtData.city}, {player1.xtData.state || player1.xtData.country}</div>
          )}
          
          {/* Player 1 Photo */}
          <div className="mb-4">
            {player1.xtData?.photourl || player1.photo ? (
              <img 
                src={player1.xtData?.photourl || player1.photo || undefined} 
                alt={player1.name}
                className="w-32 h-32 rounded-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                {player1.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Player 1 Current Tournament Stats */}
          <div className="text-center">
            <div className="text-lg font-semibold">
              {player1Record.wins}-{player1Record.losses} {player1Spread >= 0 ? '+' : ''}{player1Spread}
            </div>
            <div className="text-sm text-gray-600">Current Tournament</div>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-grow mx-8 text-center">
          <h1 className="text-3xl font-bold mb-6">Head to head record</h1>
          <div className="text-6xl font-bold text-blue-600 mb-4">
            {player1Wins}-{player2Wins}
          </div>
          
          <div className="mb-6">
            <div className="text-xl font-semibold mb-2">Average Score</div>
            <div className="text-4xl font-bold">
              {player1AvgScore}-{player2AvgScore}
            </div>
          </div>

          {lastGame && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-lg font-semibold mb-2">Last Match:</div>
              <div className="text-sm text-gray-600">Round {lastGame.roundNumber}</div>
              <div className="text-lg">
                {lastGame.player1Id === player1.id 
                  ? `${player1.name.split(' ')[0]} ${lastGame.player1Score}-${lastGame.player2Score}`
                  : `${player1.name.split(' ')[0]} ${lastGame.player2Score}-${lastGame.player1Score}`
                }
              </div>
            </div>
          )}
        </div>

        {/* Player 2 */}
        <div className="flex flex-col items-center w-64">
          <h2 className="text-2xl font-bold mb-2">{player2.name}</h2>
          {player2.xtData?.city && (
            <div className="text-gray-600 mb-4">{player2.xtData.city}, {player2.xtData.state || player2.xtData.country}</div>
          )}
          
          {/* Player 2 Photo */}
          <div className="mb-4">
            {player2.xtData?.photourl || player2.photo ? (
              <img 
                src={player2.xtData?.photourl || player2.photo || undefined} 
                alt={player2.name}
                className="w-32 h-32 rounded-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                {player2.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Player 2 Current Tournament Stats */}
          <div className="text-center">
            <div className="text-lg font-semibold">
              {player2Record.wins}-{player2Record.losses} {player2Spread >= 0 ? '+' : ''}{player2Spread}
            </div>
            <div className="text-sm text-gray-600">Current Tournament</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadToHeadOverlayPage;