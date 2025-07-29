import { PlayerStats } from "@shared/types/stats";

const PointsDisplay = ({
  stats,
  side,
}: {
  stats: PlayerStats;
  side: "player1" | "player2";
}) => {
  return (
    <div className="mt-4 flex flex-col items-start" data-obs={`${side}-points`}>
      <div className="flex w-full">
        <div className="mr-6">
          <div
            className="text-base w-full text-left"
            data-obs={`${side}-points-for`}
          >
            Avg Points For: {stats.averageScoreRounded}
          </div>
          <div className="text-base w-full text-left">
            Ranked: {stats.averageScoreRankOrdinal}
          </div>
        </div>

        <div>
          <div
            className="text-base w-full text-left"
            data-obs={`${side}-points-against`}
          >
            Avg Points Against: {stats.averageOpponentScore}
          </div>
          <div className="text-base w-full text-left">
            Ranked: {stats.averageOpponentScoreRankOrdinal}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsDisplay;
