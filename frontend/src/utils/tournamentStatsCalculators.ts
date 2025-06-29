import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";

export interface DivisionStats {
  gamesPlayed: number;
  pointsScored: number;
  averageScore: number;
  averageWinningScore: number;
  averageLosingScore: number;
  higherSeedWinPercentage: number;
  goingFirstWinPercentage: number;
}

export const calculateDivisionStats = (
  standings: PlayerStats[],
  tournament: ProcessedTournament,
  divisionId: number
): DivisionStats => {
  let totalGamesPlayed = 0;
  let totalPoints = 0;
  let winningScores: number[] = [];
  let losingScores: number[] = [];
  let higherSeedWins = 0;
  let player1Wins = 0;

  const rawDivision = tournament.divisions[divisionId];
  const rawPlayers = rawDivision.players.filter(p => p !== null);

  const playerMap = new Map<number, any>();
  rawPlayers.forEach(player => {
    if (player) {
      playerMap.set(player.id, player);
    }
  });

  rawPlayers.forEach(player => {
    if (!player) return;

    player.scores.forEach((score, roundIndex) => {
      const opponentId = player.pairings[roundIndex];

      if (opponentId === 0) return;

      const opponent = playerMap.get(opponentId);
      if (!opponent) return;

      const opponentScore = opponent.scores[roundIndex];
      if (opponentScore === undefined) return;

      if (player.id < opponentId) {
        totalGamesPlayed++;
        totalPoints += score + opponentScore;

        if (score > opponentScore) {
          winningScores.push(score);
          losingScores.push(opponentScore);
        } else if (score < opponentScore) {
          winningScores.push(opponentScore);
          losingScores.push(score);
        }

        const higherSeedPlayer = player.id < opponentId ? player : opponent;
        const winner = score > opponentScore ? player : (score < opponentScore ? opponent : null);

        if (winner && higherSeedPlayer.id === winner.id) {
          higherSeedWins++;
        }

        const playerGoesFirst = player.etc.p12[roundIndex] === 1;
        if (playerGoesFirst && score > opponentScore) {
          player1Wins++;
        } else if (!playerGoesFirst && score < opponentScore) {
          player1Wins++;
        }
      }
    });
  });

  const averageScore = totalPoints > 0 ? totalPoints / (totalGamesPlayed * 2) : 0;
  const averageWinningScore = winningScores.length > 0
    ? winningScores.reduce((sum, score) => sum + score, 0) / winningScores.length
    : 0;
  const averageLosingScore = losingScores.length > 0
    ? losingScores.reduce((sum, score) => sum + score, 0) / losingScores.length
    : 0;
  const higherSeedWinPercentage = totalGamesPlayed > 0
    ? (higherSeedWins / totalGamesPlayed) * 100
    : 0;
  const goingFirstWinPercentage = totalGamesPlayed > 0
    ? (player1Wins / totalGamesPlayed) * 100
    : 0;

  return {
    gamesPlayed: totalGamesPlayed,
    pointsScored: totalPoints,
    averageScore: Math.round(averageScore * 100) / 100,
    averageWinningScore: Math.round(averageWinningScore),
    averageLosingScore: Math.round(averageLosingScore),
    higherSeedWinPercentage: Math.round(higherSeedWinPercentage * 10) / 10,
    goingFirstWinPercentage: Math.round(goingFirstWinPercentage * 10) / 10,
  };
};

export const calculateTournamentStats = (tournament: ProcessedTournament): DivisionStats => {
  let totalGamesPlayed = 0;
  let totalPoints = 0;
  let winningScores: number[] = [];
  let losingScores: number[] = [];
  let higherSeedWins = 0;
  let player1Wins = 0;

  // Loop through all divisions
  tournament.divisions.forEach(division => {
    const rawPlayers = division.players.filter(p => p !== null);

    const playerMap = new Map<number, any>();
    rawPlayers.forEach(player => {
      if (player) {
        playerMap.set(player.id, player);
      }
    });

    rawPlayers.forEach(player => {
      if (!player) return;

      player.scores.forEach((score, roundIndex) => {
        const opponentId = player.pairings[roundIndex];

        if (opponentId === 0) return;

        const opponent = playerMap.get(opponentId);
        if (!opponent) return;

        const opponentScore = opponent.scores[roundIndex];
        if (opponentScore === undefined) return;

        if (player.id < opponentId) {
          totalGamesPlayed++;
          totalPoints += score + opponentScore;

          if (score > opponentScore) {
            winningScores.push(score);
            losingScores.push(opponentScore);
          } else if (score < opponentScore) {
            winningScores.push(opponentScore);
            losingScores.push(score);
          }

          const higherSeedPlayer = player.id < opponentId ? player : opponent;
          const winner = score > opponentScore ? player : (score < opponentScore ? opponent : null);

          if (winner && higherSeedPlayer.id === winner.id) {
            higherSeedWins++;
          }

          const playerGoesFirst = player.etc.p12[roundIndex] === 1;
          if (playerGoesFirst && score > opponentScore) {
            player1Wins++;
          } else if (!playerGoesFirst && score < opponentScore) {
            player1Wins++;
          }
        }
      });
    });
  });

  const averageScore = totalPoints > 0 ? totalPoints / (totalGamesPlayed * 2) : 0;
  const averageWinningScore = winningScores.length > 0
    ? winningScores.reduce((sum, score) => sum + score, 0) / winningScores.length
    : 0;
  const averageLosingScore = losingScores.length > 0
    ? losingScores.reduce((sum, score) => sum + score, 0) / losingScores.length
    : 0;
  const higherSeedWinPercentage = totalGamesPlayed > 0
    ? (higherSeedWins / totalGamesPlayed) * 100
    : 0;
  const goingFirstWinPercentage = totalGamesPlayed > 0
    ? (player1Wins / totalGamesPlayed) * 100
    : 0;

  return {
    gamesPlayed: totalGamesPlayed,
    pointsScored: totalPoints,
    averageScore: Math.round(averageScore * 100) / 100,
    averageWinningScore: Math.round(averageWinningScore),
    averageLosingScore: Math.round(averageLosingScore),
    higherSeedWinPercentage: Math.round(higherSeedWinPercentage * 10) / 10,
    goingFirstWinPercentage: Math.round(goingFirstWinPercentage * 10) / 10,
  };
};