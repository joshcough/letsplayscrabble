import React from "react";

import { useApiQuery } from "../../hooks/useApiQuery";
import { ApiService } from "../../services/interfaces";
import { ProtectedPage } from "../ProtectedPage";
import { ErrorMessage, LoadingSpinner } from "../shared";
import { useThemeContext } from "../../context/ThemeContext";

interface TournamentListProps {
  onTournamentClick: (id: number) => void;
  apiService: ApiService;
}

const TournamentList: React.FC<TournamentListProps> = ({
  onTournamentClick,
  apiService,
}) => {
  const { theme } = useThemeContext();
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
        <div className={`${theme.colors.cardBackground} rounded-lg shadow-md p-6`}>
          <h2 className={`text-2xl font-bold mb-6 ${theme.colors.textPrimary}`}>
            Tournaments
          </h2>
          <LoadingSpinner message="Loading tournaments..." />
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <div className={`${theme.colors.cardBackground} rounded-lg shadow-md p-6`}>
        <h2 className={`text-2xl font-bold mb-6 ${theme.colors.textPrimary}`}>Tournaments</h2>

        <ErrorMessage error={error} />

        <div className="space-y-4">
          {!tournaments || (tournaments.length === 0 && !error) ? (
            <div className={theme.colors.textSecondary}>No tournaments found.</div>
          ) : (
            tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className={`p-4 ${theme.colors.cardBackground} border ${theme.colors.secondaryBorder} rounded
                       ${theme.colors.hoverBackground} cursor-pointer transition-colors`}
                onClick={() => onTournamentClick(tournament.id)}
              >
                <h3 className={`font-semibold text-lg ${theme.colors.textPrimary}`}>
                  {tournament.name}
                </h3>
                <p className={theme.colors.textSecondary}>
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
