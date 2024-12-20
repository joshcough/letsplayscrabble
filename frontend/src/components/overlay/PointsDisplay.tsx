import { PlayerStats } from "@shared/types/tournament";


const PointsDisplay = ({
  stats,
  side
}: {
  stats: PlayerStats;
  side: "player1" | "player2";
}) => {
  return (
    <div className="mt-4 flex flex-col items-start" data-obs={`${side}-points`}>
      <div className="flex w-full">
        <div className="mr-6">
          <div className="text-base w-full text-left" data-obs={`${side}-points-for`}>
            Avg Points For: {stats.averageScore}
          </div>
          <div className="text-base w-full text-left">
            Ranked: {stats.averageScoreRankOrdinal} of 28
          </div>
        </div>

        <div>
          <div className="text-base w-full text-left" data-obs={`${side}-points-against`}>
            Avg Points Against: {stats.averageOpponentScore}
          </div>
          <div className="text-base w-full text-left">
            Ranked: {stats.averageOpponentScoreRankOrdinal} of 28
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsDisplay;