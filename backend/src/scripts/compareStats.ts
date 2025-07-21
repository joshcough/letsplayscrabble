// backend/src/scripts/compareStats.ts
import { pool, knexDb } from "../config/database";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { TournamentStatsService } from "../services/tournamentStatsService";
import { PlayerStats } from "@shared/types/tournament";

interface StatsComparison {
  tournamentId: number;
  tournamentName: string;
  divisionsMatch: boolean;
  differences: {
    divisionIndex: number;
    playerId: number;
    playerName: string;
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

async function compareTournament(tournamentId: number): Promise<StatsComparison> {
  console.log(`\n🔍 Comparing tournament ID: ${tournamentId}`);

  const tournamentRepo = new TournamentRepository(pool);
  const statsService = new TournamentStatsService(knexDb);

  // Get tournament info
  const tournament = await tournamentRepo.findById(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  console.log(`   Tournament: ${tournament.name}`);

  // OLD method: Calculate stats from JS file
  console.log(`   📁 Calculating stats from JS file...`);
  const oldStandings = tournament.standings;

  // NEW method: Calculate stats from normalized tables
  console.log(`   🗃️  Calculating stats from normalized tables...`);
  const newStandings = await statsService.calculateStandings(tournamentId);

  console.log(`   📊 Old method: ${oldStandings.length} divisions`);
  console.log(`   📊 New method: ${newStandings.length} divisions`);

  // Initialize comparison result
  const comparison: StatsComparison = {
    tournamentId,
    tournamentName: tournament.name,
    divisionsMatch: oldStandings.length === newStandings.length,
    differences: [],
  };

  // Compare each division
  for (let divIndex = 0; divIndex < Math.min(oldStandings.length, newStandings.length); divIndex++) {
    console.log(`   🏆 Comparing Division ${divIndex + 1}...`);

    const oldDivision = oldStandings[divIndex];
    const newDivision = newStandings[divIndex];

    console.log(`      Old: ${oldDivision.length} players`);
    console.log(`      New: ${newDivision.length} players`);

    const divisionDiffs = compareDivisionStandings(oldDivision, newDivision, divIndex);
    comparison.differences.push(...divisionDiffs);

    if (divisionDiffs.length === 0) {
      console.log(`      ✅ Division ${divIndex + 1}: Perfect match!`);
    } else {
      console.log(`      ⚠️  Division ${divIndex + 1}: ${divisionDiffs.length} differences found`);
    }
  }

  return comparison;
}

function compareDivisionStandings(
  oldStandings: PlayerStats[],
  newStandings: PlayerStats[],
  divisionIndex: number
) {
  const differences: StatsComparison['differences'] = [];

  // Create maps for easier comparison (by player ID)
  const oldMap = new Map(oldStandings.map(p => [p.id, p]));
  const newMap = new Map(newStandings.map(p => [p.id, p]));

  // Check each player in old standings
  for (const oldPlayer of oldStandings) {
    const newPlayer = newMap.get(oldPlayer.id);
    if (!newPlayer) {
      differences.push({
        divisionIndex,
        playerId: oldPlayer.id,
        playerName: oldPlayer.name,
        field: 'player_missing_in_new',
        oldValue: 'exists',
        newValue: 'missing',
      });
      continue;
    }

    // Compare important fields
    const fieldsToCompare: (keyof PlayerStats)[] = [
      'wins', 'losses', 'ties', 'spread', 'averageScore', 'highScore',
      'initialRating', 'currentRating', 'ratingDiff', 'rank',
      'averageScoreRank', 'averageOpponentScoreRank'
    ];

    for (const field of fieldsToCompare) {
      const oldValue = oldPlayer[field];
      const newValue = newPlayer[field];

      // Handle floating point comparisons
      if (typeof oldValue === 'number' && typeof newValue === 'number') {
        if (Math.abs(oldValue - newValue) > 0.01) {
          differences.push({
            divisionIndex,
            playerId: oldPlayer.id,
            playerName: oldPlayer.name,
            field: field as string,
            oldValue,
            newValue,
          });
        }
      } else if (oldValue !== newValue) {
        differences.push({
          divisionIndex,
          playerId: oldPlayer.id,
          playerName: oldPlayer.name,
          field: field as string,
          oldValue,
          newValue,
        });
      }
    }
  }

  // Check for players in new standings but not in old
  for (const newPlayer of newStandings) {
    if (!oldMap.has(newPlayer.id)) {
      differences.push({
        divisionIndex,
        playerId: newPlayer.id,
        playerName: newPlayer.name,
        field: 'player_extra_in_new',
        oldValue: 'missing',
        newValue: 'exists',
      });
    }
  }

  return differences;
}

async function generateReport(comparisons: StatsComparison[]): Promise<string> {
  let report = "Tournament Stats Comparison Report\n";
  report += "===================================\n\n";

  let totalDifferences = 0;
  let tournamentsWithDifferences = 0;

  for (const comparison of comparisons) {
    report += `Tournament: ${comparison.tournamentName} (ID: ${comparison.tournamentId})\n`;
    report += `Divisions Match: ${comparison.divisionsMatch}\n`;
    report += `Differences Found: ${comparison.differences.length}\n`;

    if (comparison.differences.length > 0) {
      tournamentsWithDifferences++;
      totalDifferences += comparison.differences.length;

      report += "\nDifferences:\n";
      for (const diff of comparison.differences.slice(0, 10)) { // Show first 10
        report += `  Division ${diff.divisionIndex + 1}, Player ${diff.playerId} (${diff.playerName})\n`;
        report += `    Field: ${diff.field}\n`;
        report += `    Old: ${diff.oldValue}, New: ${diff.newValue}\n`;
      }

      if (comparison.differences.length > 10) {
        report += `  ... and ${comparison.differences.length - 10} more differences\n`;
      }
    } else {
      report += "✅ PERFECT MATCH!\n";
    }

    report += "\n" + "-".repeat(50) + "\n\n";
  }

  report += `Summary:\n`;
  report += `Total Tournaments: ${comparisons.length}\n`;
  report += `Tournaments with Differences: ${tournamentsWithDifferences}\n`;
  report += `Total Differences: ${totalDifferences}\n`;

  return report;
}

async function compareAllTournaments(): Promise<void> {
  console.log("🚀 Starting comprehensive stats comparison...\n");

  // Get all tournaments
  const result = await pool.query('SELECT id, name FROM tournaments ORDER BY id');
  const tournaments = result.rows;

  if (tournaments.length === 0) {
    console.log("No tournaments found");
    return;
  }

  console.log(`Found ${tournaments.length} tournaments to compare`);

  const comparisons: StatsComparison[] = [];

  for (const tournament of tournaments) {
    try {
      const comparison = await compareTournament(tournament.id);
      comparisons.push(comparison);
    } catch (error) {
      console.error(`❌ Failed to compare tournament ${tournament.id}:`, error);
    }
  }

  // Generate and display report
  const report = await generateReport(comparisons);
  console.log("\n" + "=".repeat(60));
  console.log(report);

  // Save report to file
  const fs = require('fs');
  fs.writeFileSync('stats_comparison_report.txt', report);
  console.log("Report saved to stats_comparison_report.txt");
}

async function compareSingleTournament(tournamentId?: number): Promise<void> {
  let targetId = tournamentId;

  if (!targetId) {
    // Get first tournament if none specified
    const result = await pool.query('SELECT id FROM tournaments ORDER BY id LIMIT 1');
    if (result.rows.length === 0) {
      throw new Error("No tournaments found");
    }
    targetId = result.rows[0].id;
  }

  const comparison = await compareTournament(targetId!);
  const report = await generateReport([comparison]);
  console.log(report);
}

// Run if executed directly
if (require.main === module) {
  const arg = process.argv[2];

  if (arg === '--all') {
    compareAllTournaments()
      .then(() => {
        console.log("\n🎉 Comparison completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\nComparison failed:", error);
        process.exit(1);
      });
  } else {
    const tournamentId = arg ? parseInt(arg) : undefined;
    compareSingleTournament(tournamentId)
      .then(() => {
        console.log("\n🎉 Comparison completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\nComparison failed:", error);
        process.exit(1);
      });
  }
}

export { compareSingleTournament, compareAllTournaments };