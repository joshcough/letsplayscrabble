import React, { useState, useEffect } from "react";
import { fetchAuthenticatedApiEndpoint } from "../../utils/api";
import { ProcessedTournament } from "@shared/types/tournament";

interface TournamentListProps {
  onTournamentClick: (id: number) => void;
}

const TournamentList: React.FC<TournamentListProps> = ({
  onTournamentClick,
}) => {
  const [tournaments, setTournaments] = useState<ProcessedTournament[]>([]);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await fetchAuthenticatedApiEndpoint<ProcessedTournament[]>('/api/tournaments/admin', 'fetching user tournaments');
        setTournaments(data || []); // Handle null case by defaulting to empty array
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        setTournaments([]); // Set empty array on error
      }
    };
    fetchTournaments();
  }, []);

  return (
    <div className="bg-[#FAF1DB] rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#4A3728]">Tournaments</h2>
      <div className="space-y-4">
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="p-4 bg-[#FFF8E7] border border-[#4A3728]/20 rounded
                     hover:bg-[#4A3728]/5 cursor-pointer transition-colors"
            onClick={() => onTournamentClick(tournament.id)}
          >
            <h3 className="font-semibold text-lg text-[#4A3728]">
              {tournament.name}
            </h3>
            <p className="text-[#6B5744]">
              {tournament.city}, {tournament.year} - {tournament.lexicon}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentList;
