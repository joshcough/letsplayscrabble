import React from "react";

import * as Stats from "../../types/stats";
import { ThemeProvider } from "./ThemeProvider";
import * as Domain from "@shared/types/domain";
import { Theme } from "../../types/theme";
import { getPageTextColor } from "../../utils/themeUtils";

interface Column {
  key: string;
  label: string;
}

// Type for PlayerStats with rank added by ranking calculator
type RankedPlayerStats = Stats.PlayerStats & { rank: number };

interface TournamentTableOverlayProps {
  tournament: Domain.Tournament;
  standings: RankedPlayerStats[];
  columns: Column[];
  title: string;
  divisionName: string;
  renderPlayerName: (player: RankedPlayerStats) => React.ReactNode;
  renderCell: (player: RankedPlayerStats, columnKey: string, theme: Theme) => React.ReactNode;
}

export const TournamentTableOverlay: React.FC<TournamentTableOverlayProps> = ({
  tournament,
  standings,
  columns,
  title,
  divisionName,
  renderPlayerName,
  renderCell,
}) => {
  return (
    <ThemeProvider
      tournamentId={tournament.id}
      tournamentTheme={tournament.theme || 'scrabble'}
    >
      {(theme, themeClasses) => (
        <div className={`${themeClasses.pageBackground} min-h-screen flex items-center justify-center p-6`}>
      <div className="max-w-7xl w-full">
        <div className="text-center mb-8">
          <h1 className={`text-6xl font-black leading-tight mb-4 ${themeClasses.text}`}>
            {title}
          </h1>
          <div className={`text-3xl font-bold ${getPageTextColor(theme, 'secondary')}`}>
            {tournament.name} {tournament.lexicon} • Division {divisionName}
          </div>
        </div>
        
        <div className={`${theme.colors.cardBackground} rounded-2xl px-6 py-3 border-2 ${theme.colors.primaryBorder} shadow-2xl ${theme.colors.shadowColor}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b-2 ${theme.colors.primaryBorder}`}>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-1 text-xl font-black uppercase tracking-wider ${themeClasses.text} ${
                        column.key === "name" ? "text-left" : "text-center"
                      }`}
                      style={{
                        minWidth: column.key === "name" ? "200px" : "100px",
                      }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 10).map((player, index) => (
                  <tr
                    key={player.playerId}
                    className={themeClasses.tableRow}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-1 text-xl font-bold ${themeClasses.text} ${
                          column.key === "name" ? "text-left" : "text-center"
                        }`}
                      >
                        {column.key === "name" ? (
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <span className="text-lg">
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                              </span>
                            )}
                            {renderPlayerName(player)}
                          </div>
                        ) : (
                          renderCell(player, column.key, theme)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </div>
      )}
    </ThemeProvider>
  );
};

export default TournamentTableOverlay;