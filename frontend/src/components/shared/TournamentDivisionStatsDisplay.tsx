import React from "react";
import { ProcessedTournament } from "@shared/types/tournament";
import { DivisionStats } from "../../utils/tournamentStatsCalculators";

interface TournamentDivisionStatsDisplayProps {
  tournament: ProcessedTournament;
  divisionName: string;
  stats: DivisionStats;
}

export const TournamentDivisionStatsDisplay: React.FC<TournamentDivisionStatsDisplayProps> = ({
  tournament,
  divisionName,
  stats
}) => {
  return (
    <div className="flex flex-col items-center pt-8 font-bold">
      <div className="text-black text-4xl font-bold text-center mb-8">
        {tournament.name} {tournament.lexicon} Div{" "}
        {divisionName} - Total Tournament Stats
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