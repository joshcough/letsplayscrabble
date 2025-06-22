import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../config/api";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useSocketConnection } from "../../hooks/useSocketConnection";

const baseUrl = "https://scrabbleplayers.org/directors/AA003954/";

const getTournamentName = (tourney_url: string): string => {
  const suffix = "/html/tourney.js";
  return tourney_url.slice(baseUrl.length, -suffix.length);
};

const getPlayerImageUrl = (tourney_url: string, player_photo: string): string => {
  return baseUrl + getTournamentName(tourney_url) + "/html/" + player_photo;
}

const formatPlayerName = (name: string): string => {
  if (!name.includes(',')) { return name; }
  const parts = name.split(',').map(part => part.trim());
  // Return original if format is unexpected
  if (parts.length !== 2 || !parts[0] || !parts[1]) { return name; }
  const [lastName, firstName] = parts;
  return `${firstName} ${lastName}`;
};

const HighScoresWithPicsOverlay: React.FC = () => {
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);

  const {
    matchWithPlayers,
    connectionStatus,
    error,
    lastDataUpdate
  } = useSocketConnection();

  const calculateRanks = (players: PlayerStats[]): PlayerStats[] => {
    const sortedPlayers = [...players].sort((a, b) => {
      return b.highScore - a.highScore; // Sort by high score instead of average
    });

    return sortedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
  };

  const fetchTournamentData = async (
    tournamentId: number,
    divisionId: number,
  ) => {
    try {
      console.log("Fetching tournament data for:", {
        tournamentId,
        divisionId,
      });
      const tournamentData: ProcessedTournament = await fetchWithAuth(
        `/api/tournaments/public/${tournamentId}`,
      );

      setTournament(tournamentData);

      const divisionIndex = divisionId;
      const divisionStandings = calculateRanks(
        tournamentData.standings[divisionIndex],
      );
      setStandings(divisionStandings);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
    }
  };

  // Fetch tournament data when matchWithPlayers changes
  useEffect(() => {
    if (
      matchWithPlayers?.matchData?.tournament_id !== undefined &&
      matchWithPlayers?.matchData?.division_id !== undefined
    ) {
      fetchTournamentData(
        matchWithPlayers.matchData.tournament_id,
        matchWithPlayers.matchData.division_id,
      );
    }
  }, [matchWithPlayers]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
          <p className="text-sm mt-2">Status: {connectionStatus}</p>
        </div>
      </div>
    );
  }

  if (!standings || !tournament || !matchWithPlayers) {
    return <div className="text-black p-2">Loading...</div>;
  }

  // Get top 5 players by high score
  const top5Players = standings.slice(0, 5);

  return (
    <div className="flex flex-col items-center pt-8 font-bold">
      <div className="text-black text-6xl font-bold text-center mb-4">
        High Scores
      </div>

      <div className="text-black text-4xl font-bold text-center mb-8">
        {tournament.name} {tournament.lexicon} Div{" "}
        {tournament.divisions[matchWithPlayers.matchData.division_id].name}{" "}
      </div>

      <div className="flex justify-center items-end gap-8 px-4">
        {top5Players.map((player, index) => (
          <div key={player.name} className="flex flex-col items-center">
            {/* Player Image */}
            <div className="w-32 h-32 mb-4 rounded-lg overflow-hidden border-4 border-gray-300 bg-gray-200">
              <img
                src={getPlayerImageUrl(tournament.data_url, player.photo)}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Player Name */}
            <div className="text-black text-xl font-bold text-center mb-2 max-w-40">
              {formatPlayerName(player.name)}
            </div>

            {/* High Score */}
            <div className="text-black text-3xl font-bold text-center">
              {player.highScore}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HighScoresWithPicsOverlay;