import React from "react";

import * as Stats from "../../types/stats";
import { BaseModernOverlay } from "./BaseModernOverlay";
import * as Domain from "@shared/types/domain";
import { Theme } from "../../types/theme";
import { getPageTextColor } from "../../utils/themeUtils";

interface Column {
  key: string;
  label: string;
}

// Type for PlayerStats with rank added by ranking calculator
type RankedPlayerStats = Stats.PlayerStats & { rank: number };

interface TournamentTableModernOverlayProps {
  tournament: Domain.Tournament;
  standings: RankedPlayerStats[];
  columns: Column[];
  title: string;
  divisionName: string;
  renderPlayerName: (player: RankedPlayerStats) => React.ReactNode;
  renderCell: (player: RankedPlayerStats, columnKey: string, theme: Theme) => React.ReactNode;
}

export const TournamentTableModernOverlay: React.FC<TournamentTableModernOverlayProps> = ({
  tournament,
  standings,
  columns,
  title,
  divisionName,
  renderPlayerName,
  renderCell,
}) => {
  return (
    <BaseModernOverlay
      tournamentId={tournament.id}
      tournamentTheme={tournament.theme || 'scrabble'}
    >
      {(theme, themeClasses) => (
        <div className={`${themeClasses.pageBackground} min-h-screen flex items-center justify-center p-6`}>
      <div className="max-w-7xl w-full">
        <div className="text-center mb-8">
          <h1 className={`${themeClasses.title} mb-3`}>
            {title}
          </h1>
          <div className={`text-xl ${getPageTextColor(theme, 'secondary')}`}>
            {tournament.name} {tournament.lexicon} • Division {divisionName}
          </div>
        </div>
        
        <div className={themeClasses.card}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b-2 ${theme.colors.primaryBorder}`}>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 ${themeClasses.text} font-black uppercase tracking-wider text-sm ${
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
                {standings.slice(0, 20).map((player, index) => (
                  <tr
                    key={player.playerId}
                    className={themeClasses.tableRow}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 ${themeClasses.text} ${
                          column.key === "name" ? "text-left font-semibold" : "text-center"
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
    </BaseModernOverlay>
  );
};

export default TournamentTableModernOverlay;