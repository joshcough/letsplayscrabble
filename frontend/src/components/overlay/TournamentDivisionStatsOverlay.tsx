import React, { useState, useEffect } from "react";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { fetchTournament } from "../../utils/tournamentApi";

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
  const [stats, setStats] = useState<DivisionStats | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { currentMatch, loading: matchLoading, error: matchError } = useCurrentMatch();

  const calculateDivisionStats = (standings: PlayerStats[], tournament: ProcessedTournament, divisionId: number): DivisionStats => {
    let totalGamesPlayed = 0;
    let totalPoints = 0;
    let winningScores: number[] = [];
    let losingScores: number[] = [];
    let higherSeedWins = 0;
    let player1Wins = 0; // player1 goes first

    // Get the raw division data to access pairings and scores
    const rawDivision = tournament.divisions[divisionId];
    const rawPlayers = rawDivision.players.filter(p => p !== null);

    // Create a map for quick lookup
    const playerMap = new Map<number, any>();
    rawPlayers.forEach(player => {
      if (player) {
        playerMap.set(player.id, player);
      }
    });

    // Process each raw player's games
    rawPlayers.forEach(player => {
      if (!player) return;

      player.scores.forEach((score, roundIndex) => {
        const opponentId = player.pairings[roundIndex];

        // Skip byes (opponent ID of 0)
        if (opponentId === 0) return;

        const opponent = playerMap.get(opponentId);
        if (!opponent) return;

        const opponentScore = opponent.scores[roundIndex];
        if (opponentScore === undefined) return;

        // Only count each game once (when processing the lower ID player)
        if (player.id < opponentId) {
          totalGamesPlayed++;

          // Add both scores to total points
          totalPoints += score + opponentScore;

          // Determine winning and losing scores
          if (score > opponentScore) {
            winningScores.push(score);
            losingScores.push(opponentScore);
          } else if (score < opponentScore) {
            winningScores.push(opponentScore);
            losingScores.push(score);
          }
          // Note: ties don't contribute to winning/losing score averages

          // Check if higher seed won (seed = player.id, lower number = higher seed)
          const higherSeedPlayer = player.id < opponentId ? player : opponent;
          const winner = score > opponentScore ? player : (score < opponentScore ? opponent : null);

          if (winner && higherSeedPlayer.id === winner.id) {
            higherSeedWins++;
          }

          // Check who went first and won
          const playerGoesFirst = player.etc.p12[roundIndex] === 1;
          if (playerGoesFirst && score > opponentScore) {
            player1Wins++;
          } else if (!playerGoesFirst && score < opponentScore) {
            player1Wins++; // Opponent went first and won
          }
        }
      });
    });

    // Calculate averages
    const averageScore = totalPoints > 0 ? totalPoints / (totalGamesPlayed * 2) : 0; // Divide by 2 since we counted both scores
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

  const fetchTournamentData = async (tournamentId: number, divisionId: number) => {
    try {
      setLoading(true);
      setFetchError(null);

      const tournamentData = await fetchTournament(tournamentId);
      setTournament(tournamentData);

      const divisionStandings = tournamentData.standings[divisionId];
      const calculatedStats = calculateDivisionStats(divisionStandings, tournamentData, divisionId);
      setStats(calculatedStats);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch tournament data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch tournament data when currentMatch changes
  useEffect(() => {
    if (currentMatch?.tournament_id !== undefined && currentMatch?.division_id !== undefined) {
      fetchTournamentData(currentMatch.tournament_id, currentMatch.division_id);
    }
  }, [currentMatch]);

  // Show loading state
  if (matchLoading || loading) {
    return <div className="text-black p-2">Loading...</div>;
  }

  // Show errors
  if (matchError || fetchError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{matchError || fetchError}</p>
        </div>
      </div>
    );
  }

  // Show message when no data
  if (!currentMatch || !stats || !tournament) {
    return <div className="text-black p-2">No current match or tournament data</div>;
  }

  return (
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
  );
};

export default TournamentDivisionStatsOverlay;