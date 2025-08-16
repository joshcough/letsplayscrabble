import { CreateTournament } from "../types/database";

/**
 * Debug helper to cleanly print CreateTournament data
 * Usage: debugPrintCreateTournament(myTournamentData)
 */
export function debugPrintCreateTournament(data: CreateTournament): void {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("                    CREATE TOURNAMENT DATA                   ");
  console.log("═══════════════════════════════════════════════════════════");

  // Tournament info
  console.log("\n📋 TOURNAMENT METADATA:");
  console.log("───────────────────────");
  const { data: rawData, ...tournamentDisplay } = data.tournament;
  console.table(tournamentDisplay);

  // Raw data summary
  console.log("\n📊 RAW DATA SUMMARY:");
  console.log("───────────────────");
  console.log(
    `  Size: ${JSON.stringify(rawData).length.toLocaleString()} bytes`,
  );
  console.log(`  Keys: ${Object.keys(rawData || {}).join(", ")}`);

  // Divisions overview
  console.log("\n🏆 DIVISIONS:", `(${data.divisions.length} total)`);
  console.log("─────────────");
  if (data.divisions.length > 0) {
    console.table(
      data.divisions.map((div) => ({
        Position: div.division.position,
        Name: div.division.name,
        Players: div.players.length,
        Games: div.games.length,
      })),
    );
  } else {
    console.log("  No divisions");
  }

  // Detailed division breakdown
  console.log("\n📁 DETAILED DIVISION BREAKDOWN:");
  console.log("════════════════════════════════");

  data.divisions.forEach((divData) => {
    const { division, players, games } = divData;

    console.log(
      `\n┌─ Division ${division.name} (position ${division.position})`,
    );
    console.log(`│  ────────────────────────────────────────`);

    // Players in this division
    console.log(`│  👥 PLAYERS: ${players.length} total`);
    const playersToShow = players.slice(0, 5);
    playersToShow.forEach((p) => {
      console.log(
        `│     Seed #${p.seed.toString().padStart(2)} - ${p.name.padEnd(25)} (Rating: ${p.initial_rating})`,
      );
    });
    if (players.length > 5) {
      console.log(`│     ... and ${players.length - 5} more players`);
    }

    // Games in this division grouped by round
    console.log(`│`);
    console.log(`│  🎮 GAMES: ${games.length} total`);

    if (games.length > 0) {
      // Group games by round
      const gamesByRound: Record<number, typeof games> = {};
      games.forEach((game) => {
        if (!gamesByRound[game.round_number]) {
          gamesByRound[game.round_number] = [];
        }
        gamesByRound[game.round_number].push(game);
      });

      const rounds = Object.keys(gamesByRound)
        .map(Number)
        .sort((a, b) => a - b);
      console.log(
        `│     Rounds: ${Math.min(...rounds)} - ${Math.max(...rounds)}`,
      );

      rounds.slice(0, 3).forEach((round) => {
        const roundGames = gamesByRound[round];
        const completed = roundGames.filter(
          (g) => g.player1_score !== null || g.player2_score !== null,
        ).length;
        const byes = roundGames.filter((g) => g.is_bye).length;

        console.log(`│`);
        console.log(
          `│     Round ${round}: ${roundGames.length} games (${completed} completed, ${byes} byes)`,
        );

        // Show first few games with player names
        const gamesToShow = roundGames.slice(0, 2);
        gamesToShow.forEach((g) => {
          const p1 = players.find((p) => p.seed === g.player1_seed);
          const p2 = players.find((p) => p.seed === g.player2_seed);
          const p1Name = p1?.name || `Unknown(seed ${g.player1_seed})`;
          const p2Name = p2?.name || `Unknown(seed ${g.player2_seed})`;

          const scores =
            g.player1_score !== null && g.player2_score !== null
              ? `${g.player1_score}-${g.player2_score}`
              : "not played";

          const byeIndicator = g.is_bye ? " [BYE]" : "";
          const pairingInfo =
            g.pairing_id !== null ? ` (pair:${g.pairing_id})` : "";

          console.log(
            `│       • ${p1Name.padEnd(20)} vs ${p2Name.padEnd(20)} : ${scores}${byeIndicator}${pairingInfo}`,
          );
        });

        if (roundGames.length > 2) {
          console.log(`│       ... and ${roundGames.length - 2} more games`);
        }
      });

      if (rounds.length > 3) {
        console.log(`│     ... and ${rounds.length - 3} more rounds`);
      }
    } else {
      console.log(`│     No games in this division`);
    }

    console.log(`└──────────────────────────────────────────────`);
  });

  // Overall statistics
  console.log("\n📈 OVERALL TOURNAMENT STATISTICS:");
  console.log("──────────────────────────────────");

  const totalPlayers = data.divisions.reduce(
    (sum, div) => sum + div.players.length,
    0,
  );
  const totalGames = data.divisions.reduce(
    (sum, div) => sum + div.games.length,
    0,
  );
  const totalCompleted = data.divisions.reduce(
    (sum, div) =>
      sum +
      div.games.filter(
        (g) => g.player1_score !== null || g.player2_score !== null,
      ).length,
    0,
  );
  const totalByes = data.divisions.reduce(
    (sum, div) => sum + div.games.filter((g) => g.is_bye).length,
    0,
  );

  console.log(`  Total Divisions: ${data.divisions.length}`);
  console.log(`  Total Players: ${totalPlayers}`);
  console.log(`  Total Games: ${totalGames}`);
  console.log(
    `  Completed Games: ${totalCompleted} (${totalGames > 0 ? Math.round((totalCompleted / totalGames) * 100) : 0}%)`,
  );
  console.log(`  Bye Games: ${totalByes}`);

  console.log("\n═══════════════════════════════════════════════════════════");
}

/**
 * Get a summary string without printing to console
 */
export function getCreateTournamentSummary(data: CreateTournament): string {
  const totalPlayers = data.divisions.reduce(
    (sum, div) => sum + div.players.length,
    0,
  );
  const totalGames = data.divisions.reduce(
    (sum, div) => sum + div.games.length,
    0,
  );
  const totalCompleted = data.divisions.reduce(
    (sum, div) =>
      sum +
      div.games.filter(
        (g) => g.player1_score !== null || g.player2_score !== null,
      ).length,
    0,
  );

  return `Tournament "${data.tournament.name}" - ${data.divisions.length} divisions, ${totalPlayers} players, ${totalCompleted}/${totalGames} games completed`;
}

/**
 * Validate CreateTournament data and return any issues
 */
export function validateCreateTournament(data: CreateTournament): string[] {
  const issues: string[] = [];

  // Check for duplicate division positions
  const positions = data.divisions.map((d) => d.division.position);
  const uniquePositions = new Set(positions);
  if (positions.length !== uniquePositions.size) {
    issues.push("Duplicate division positions found");
  }

  // Check each division
  data.divisions.forEach((divData, idx) => {
    const { division, players, games } = divData;

    // Check for duplicate player seeds within division
    const seeds = players.map((p) => p.seed);
    const uniqueSeeds = new Set(seeds);
    if (seeds.length !== uniqueSeeds.size) {
      issues.push(`Division ${division.name}: Duplicate player seeds found`);
    }

    // Check that all games reference valid players
    const validSeeds = new Set(players.map((p) => p.seed));
    games.forEach((game, gameIdx) => {
      if (!validSeeds.has(game.player1_seed)) {
        issues.push(
          `Division ${division.name}, Game ${gameIdx}: Invalid player1_seed ${game.player1_seed}`,
        );
      }
      if (!validSeeds.has(game.player2_seed)) {
        issues.push(
          `Division ${division.name}, Game ${gameIdx}: Invalid player2_seed ${game.player2_seed}`,
        );
      }
    });

    // Check for reasonable scores
    games.forEach((game, gameIdx) => {
      if (game.player1_score !== null && game.player1_score < 0) {
        issues.push(
          `Division ${division.name}, Game ${gameIdx}: Negative player1_score`,
        );
      }
      if (game.player2_score !== null && game.player2_score < 0) {
        issues.push(
          `Division ${division.name}, Game ${gameIdx}: Negative player2_score`,
        );
      }
    });
  });

  return issues;
}

/**
 * Get games for a specific division and optionally round
 */
export function getGamesForDivision(
  data: CreateTournament,
  divisionName: string,
  roundNumber?: number,
): Array<{
  game: (typeof data.divisions)[0]["games"][0];
  player1Name: string;
  player2Name: string;
}> {
  const divData = data.divisions.find((d) => d.division.name === divisionName);
  if (!divData) return [];

  const games = roundNumber
    ? divData.games.filter((g) => g.round_number === roundNumber)
    : divData.games;

  return games.map((game) => {
    const p1 = divData.players.find((p) => p.seed === game.player1_seed);
    const p2 = divData.players.find((p) => p.seed === game.player2_seed);
    return {
      game,
      player1Name: p1?.name || `Unknown (seed ${game.player1_seed})`,
      player2Name: p2?.name || `Unknown (seed ${game.player2_seed})`,
    };
  });
}

/**
 * Print a specific division's details
 */
export function debugPrintDivision(
  data: CreateTournament,
  divisionName: string,
): void {
  const divData = data.divisions.find((d) => d.division.name === divisionName);
  if (!divData) {
    console.log(`Division "${divisionName}" not found`);
    return;
  }

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  Division ${divisionName} Details`);
  console.log(`═══════════════════════════════════════════════════════════`);

  console.log(`\nPlayers (${divData.players.length}):`);
  divData.players.forEach((p) => {
    console.log(
      `  Seed #${p.seed.toString().padStart(2)} - ${p.name.padEnd(25)} (Rating: ${p.initial_rating})`,
    );
  });

  console.log(`\nGames by Round:`);
  const gamesByRound: Record<number, typeof divData.games> = {};
  divData.games.forEach((g) => {
    if (!gamesByRound[g.round_number]) gamesByRound[g.round_number] = [];
    gamesByRound[g.round_number].push(g);
  });

  Object.keys(gamesByRound)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((round) => {
      console.log(`\n  Round ${round}:`);
      gamesByRound[round].forEach((g) => {
        const p1 = divData.players.find((p) => p.seed === g.player1_seed);
        const p2 = divData.players.find((p) => p.seed === g.player2_seed);
        const scores =
          g.player1_score !== null && g.player2_score !== null
            ? `${g.player1_score}-${g.player2_score}`
            : "not played";
        console.log(
          `    ${p1?.name || "Unknown"} vs ${p2?.name || "Unknown"}: ${scores}${g.is_bye ? " [BYE]" : ""}`,
        );
      });
    });
}
