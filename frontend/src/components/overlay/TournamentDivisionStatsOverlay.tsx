import React from "react";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { useTournamentData } from "../../hooks/useTournamentData";
import { LoadingErrorWrapper } from "../shared/LoadingErrorWrapper";

interface DivisionStats {
  gamesPlayed: number;
  pointsScored: number;
  averageScore: number;
  averageWinningScore: number;
  averageLosingScore: number;
  higherSeedWinPercentage: number;
  goingFirstWinPercentage: number;
}

const TournamentDivisionStatsOverlay: React.FC = () => {
  const { currentMatch, loading: matchLoading, error: matchError } = useCurrentMatch();

  const calculateDivisionStats = React.useCallback((standings: PlayerStats[], tournament: ProcessedTournament, divisionId: number): DivisionStats => {
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
  }, []);

  const statsCalculator = React.useCallback((standings: PlayerStats[]) => {
    // This component doesn't actually modify standings, just calculates stats
    return standings;
  }, []);

  const { standings, tournament, loading, fetchError } = useTournamentData({
    tournamentId: currentMatch?.tournament_id,
    divisionId: currentMatch?.division_id,
    rankCalculator: statsCalculator
  });

  const stats = React.useMemo(() => {
    if (!standings || !tournament || currentMatch?.division_id === undefined) return null;
    return calculateDivisionStats(standings, tournament, currentMatch.division_id);
  }, [standings, tournament, currentMatch?.division_id, calculateDivisionStats]);

  return (
    <LoadingErrorWrapper
      loading={matchLoading || loading}
      error={matchError || fetchError}
    >
      {currentMatch && stats && tournament ? (
        <div className="flex flex-col items-center pt-8 font-bold">
          <div className="text-black text-4xl font-bold text-center mb-8">
            {tournament.name} {tournament.lexicon} Div{" "}
            {tournament.divisions[currentMatch.division_id].name} - Total Tournament Stats
          </div>

          <div className="flex justify-center gap-8 max-w-6xl overflow-x-auto">
            <div className="flex flex-col items-center">
              <div className="text-black text-lg font-bold mb-2">Games Played</div>
              <div className="bg-white rounded-full px-8 py-6 shadow-lg border-4 border-black">
                <div className="text-4xl font-bold text-black text-center">{stats.gamesPlayed}</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-black text-lg font-bold mb-2">Points Scored</div>
              <div className="bg-white rounded-full px-8 py-6 shadow-lg border-4 border-black">
                <div className="text-4xl font-bold text-black text-center">{stats.pointsScored.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-black text-lg font-bold mb-2">Average Score</div>
              <div className="bg-white rounded-full px-8 py-6 shadow-lg border-4 border-black">
                <div className="text-4xl font-bold text-black text-center">{stats.averageWinningScore}-{stats.averageLosingScore}</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-black text-lg font-bold mb-2">Higher Rated Win%</div>
              <div className="bg-white rounded-full px-8 py-6 shadow-lg border-4 border-black">
                <div className="text-4xl font-bold text-black text-center">{stats.higherSeedWinPercentage}%</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-black text-lg font-bold mb-2">Going First Win%</div>
              <div className="bg-white rounded-full px-8 py-6 shadow-lg border-4 border-black">
                <div className="text-4xl font-bold text-black text-center">{stats.goingFirstWinPercentage}%</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-black p-2">No current match or tournament data</div>
      )}
    </LoadingErrorWrapper>
  );
};

export default TournamentDivisionStatsOverlay;