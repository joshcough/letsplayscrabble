import React from "react";

import * as Stats from "../../types/stats";
import { TournamentDisplayData } from "./BaseOverlay";

interface Column {
  key: string;
  label: string;
}

// Type for PlayerStats with rank added by ranking calculator
type RankedPlayerStats = Stats.PlayerStats & { rank: number };

interface TournamentTableModernOverlayProps {
  tournament: TournamentDisplayData;
  standings: RankedPlayerStats[];
  columns: Column[];
  title: string;
  divisionName: string;
  renderPlayerName: (player: RankedPlayerStats) => React.ReactNode;
  renderCell: (player: RankedPlayerStats, columnKey: string) => React.ReactNode;
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
    <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-3">
            {title}
          </h1>
          <div className="text-xl text-gray-300">
            {tournament.name} {tournament.lexicon} • Division {divisionName}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-900/50 to-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border-2 border-blue-400/50 shadow-2xl shadow-blue-400/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-blue-400/30">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-blue-300 font-semibold uppercase tracking-wider text-sm ${
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
                    className={`border-b border-blue-600/20 hover:bg-blue-800/20 transition-colors ${
                      index < 3 ? "bg-gradient-to-r from-purple-900/20 to-transparent" : ""
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-white ${
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
                          renderCell(player, column.key)
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
  );
};

export default TournamentTableModernOverlay;