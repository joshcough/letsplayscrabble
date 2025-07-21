import React from 'react';
import { ProcessedTournament, PlayerStats } from '@shared/types/tournament';

interface Column {
  key: string;
  label: string;
}

interface TournamentTableOverlayProps {
  tournament: ProcessedTournament;
  standings: PlayerStats[];
  columns: Column[];
  title: string;
  divisionName: string;
  renderPlayerName: (player: PlayerStats) => React.ReactNode;
  renderCell: (player: PlayerStats, columnKey: string) => React.ReactNode;
}

export const TournamentTableOverlay: React.FC<TournamentTableOverlayProps> = ({
  tournament,
  standings,
  columns,
  title,
  divisionName,
  renderPlayerName,
  renderCell
}) => {
  return (
    <div className="flex flex-col items-center pt-2 font-bold">
      <div className="text-black text-4xl font-bold text-center mb-2">
        {tournament.name} {tournament.lexicon} Div {divisionName} {title}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-white">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 py-1 ${column.key === "name" ? "text-left" : "text-center"}`}
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
            {standings.map((player) => (
              <tr key={player.name} className="bg-white">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-1 ${column.key === "name" ? "" : "text-center"}`}
                  >
                    {column.key === "name" ? renderPlayerName(player) : renderCell(player, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};