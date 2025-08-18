import React from "react";

import { useApiQuery } from "../../hooks/useApiQuery";
import { ApiService } from "../../services/interfaces";
import { ProtectedPage } from "../ProtectedPage";
import { ErrorMessage, LoadingSpinner } from "../shared";

interface TournamentListProps {
  onTournamentClick: (id: number) => void;
  apiService: ApiService;
}

const TournamentList: React.FC<TournamentListProps> = ({
  onTournamentClick,
  apiService,
}) => {
  const {
    data: tournaments,
    loading,
    error,
  } = useApiQuery(() => apiService.listTournaments(), {
    // Could add refetchInterval: 30000 to poll every 30 seconds
  });

  if (loading) {
    return (
      <ProtectedPage>
        <div className="bg-[#FAF1DB] rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#4A3728]">
            Tournaments
          </h2>
          <LoadingSpinner message="Loading tournaments..." />
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <div className="bg-[#FAF1DB] rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-[#4A3728]">Tournaments</h2>

        <ErrorMessage error={error} />

        <div className="space-y-4">
          {!tournaments || (tournaments.length === 0 && !error) ? (
            <div className="text-[#6B5744]">No tournaments found.</div>
          ) : (
            tournaments.map((tournament) => (
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
            ))
          )}
        </div>
      </div>
    </ProtectedPage>
  );
};

export default TournamentList;
