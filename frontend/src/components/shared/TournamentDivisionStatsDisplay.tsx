import React from "react";
import { useSearchParams } from "react-router-dom";
import { ProcessedTournament, DivisionStats, TournamentStats } from "@shared/types/tournament";

interface TournamentDivisionStatsDisplayProps {
  tournament: ProcessedTournament;
  divisionName?: string; // Optional for tournament-wide stats
  stats: DivisionStats;
}

export const TournamentDivisionStatsDisplay: React.FC<TournamentDivisionStatsDisplayProps> = ({
  tournament,
  divisionName,
  stats
}) => {
  const [searchParams] = useSearchParams();
  const renderBubbles = searchParams.get("render_bubbles") !== "false";

  const title = divisionName
    ? `${tournament.name} ${tournament.lexicon} Div ${divisionName} - Total Tournament Stats`
    : `${tournament.name} ${tournament.lexicon} - Total Tournament Stats`;

  const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
    if (renderBubbles) {
      return (
        <div className="flex flex-col items-center">
          <div className="text-black text-lg font-bold mb-2">{label}</div>
          <div className="bg-white rounded-full px-8 py-6 shadow-lg border-4 border-black">
            <div className="text-4xl font-bold text-black text-center">{value}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center">
          <div className="text-black text-lg font-bold mb-2">{label}</div>
          <div className="text-4xl font-bold text-black text-center">{value}</div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col items-center pt-8 font-bold">
      <div className="text-black text-4xl font-bold text-center mb-8">
        {title}
      </div>

      <div className="flex justify-center gap-8 max-w-6xl overflow-x-auto">
        <StatItem label="Games Played" value={stats.gamesPlayed} />
        <StatItem label="Points Scored" value={stats.pointsScored.toLocaleString()} />
        <StatItem label="Average Score" value={`${stats.averageWinningScore}-${stats.averageLosingScore}`} />
        <StatItem label="Higher Rated Win%" value={`${stats.higherSeedWinPercentage}%`} />
        <StatItem label="Going First Win%" value={`${stats.goingFirstWinPercentage}%`} />
      </div>
    </div>
  );
};