import path from "path";
import { calculateStandings, loadTournamentFile } from "../dataProcessing";
import { TournamentData } from "@shared/types/tournament";

describe("calculateStandings", () => {
  let tournamentData: TournamentData;

  beforeAll(async () => {
    const dataUrl = path.join(
      __dirname,
      "..",
      "..",
      "__fixtures__",
      "tourney.js",
    );
    tournamentData = await loadTournamentFile(dataUrl);
  });

  it("should calculate correct standings for division 0", () => {
    const standings = calculateStandings(tournamentData.divisions[0]);

    expect(standings).toHaveLength(24);

    expect(standings[0]).toMatchObject({
      id: 1,
      name: "Krafchick, Joey",
      rating: 2035,
      firstLast: "Joey Krafchick",
      wins: 22,
      losses: 5,
      ties: 0,
      spread: 2244,
      averageScoreRounded: "451.04",
      highScore: 607,
      rank: 2,
      rankOrdinal: "2nd",
    });

    expect(standings[standings.length - 1]).toMatchObject({
      id: 24,
      name: "Bigall, Vera",
      rating: 1485,
      firstLast: "Vera Bigall",
      wins: 10,
      losses: 17,
      ties: 0,
      spread: -668,
      averageScoreRounded: "385.31",
      highScore: 530,
      rank: 18,
      rankOrdinal: "18th",
    });
  });
});
