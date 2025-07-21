// backend/src/scripts/testServices.ts
import { knexDb, pool } from "../config/database";
import { TournamentDataService } from "../services/tournamentDataService";
import { TournamentStatsService } from "../services/tournamentStatsService";

async function migrateExistingTournaments(limitToFirst = false) {
  console.log("🚀 Migrating existing tournament data to normalized tables...\n");

  const dataService = new TournamentDataService(knexDb);

  // Get existing tournaments
  const query = limitToFirst
    ? 'SELECT * FROM tournaments ORDER BY id LIMIT 1'
    : 'SELECT * FROM tournaments ORDER BY id';

  const result = await pool.query(query);
  const tournaments = result.rows;

  if (tournaments.length === 0) {
    console.log("No tournaments found in database");
    return { migrated: 0, failed: 0 };
  }

  console.log(`Found ${tournaments.length} tournament(s) to migrate`);

  let migrated = 0;
  let failed = 0;

  for (const tournament of tournaments) {
    try {
      console.log(`\nMigrating: "${tournament.name}" (ID: ${tournament.id})...`);

      // Check if already migrated
      const existingData = await knexDb('divisions')
        .where('tournament_id', tournament.id)
        .count('* as count');

      const count = String(existingData[0].count);
      if (parseInt(count) > 0) {
        console.log(`  ⚠️  Already migrated (${count} divisions found)`);
        continue;
      }

      // Migrate this tournament
      await dataService.storeTournamentData(tournament.id, tournament.data);

      // Verify migration
      const divisionCount = await knexDb('divisions').where('tournament_id', tournament.id).count('* as count');
      const playerCount = await knexDb('tournament_players').where('tournament_id', tournament.id).count('* as count');
      const gameCount = await knexDb('games')
        .join('rounds', 'games.round_id', 'rounds.id')
        .join('divisions', 'rounds.division_id', 'divisions.id')
        .where('divisions.tournament_id', tournament.id)
        .count('* as count');

      console.log(`  ✅ Migrated: ${divisionCount[0].count} divisions, ${playerCount[0].count} players, ${gameCount[0].count} games`);
      migrated++;

    } catch (error) {
      console.error(`  ❌ Failed to migrate tournament ${tournament.id}:`, error);
      failed++;
    }
  }

  console.log(`\n📊 Migration Summary: ${migrated} successful, ${failed} failed`);
  return { migrated, failed };
}

async function testServices() {
  console.log("Testing TournamentDataService and TournamentStatsService with real data...\n");

  const statsService = new TournamentStatsService(knexDb);

  try {
    // First, migrate existing data (just first tournament for testing)
    await migrateExistingTournaments(true);

    // Get an existing tournament from your database
    const result = await pool.query('SELECT * FROM tournaments ORDER BY id LIMIT 1');
    if (result.rows.length === 0) {
      throw new Error("No tournaments found in database");
    }

    const tournament = result.rows[0];
    const tournamentId = tournament.id;
    console.log(`\nTesting with tournament: "${tournament.name}" (ID: ${tournamentId})`);

    // Test: Calculate standings from normalized tables
    console.log("\n1. Testing TournamentStatsService.calculateStandings()...");
    const standings = await statsService.calculateStandings(tournamentId);
    console.log("✅ Successfully calculated standings from normalized tables");
    console.log(`   Found ${standings.length} divisions`);

    // Show division info
    standings.forEach((divisionStandings, divIndex) => {
      console.log(`   Division ${divIndex + 1}: ${divisionStandings.length} players`);
    });

    // Test: Show top players from first division
    if (standings[0] && standings[0].length > 0) {
      console.log("\n2. Top 5 players in Division 1:");
      standings[0].slice(0, 5).forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.firstLast}: ${player.wins}-${player.losses} (${player.spread > 0 ? '+' : ''}${player.spread}) avg: ${player.averageScoreRounded}`);
      });
    }

    // Test: Get recent games for first player
    console.log("\n3. Testing TournamentStatsService.getPlayerRecentGames()...");
    if (standings[0] && standings[0].length > 0) {
      const firstPlayer = standings[0][0];
      console.log(`   Testing with player: ${firstPlayer.firstLast} (ID: ${firstPlayer.id})`);

      // Get the actual division database ID for the first division
      const divisionInfo = await knexDb('divisions')
        .select('id')
        .where('tournament_id', tournamentId)
        .orderBy('position')
        .first();

      console.log(`   Division database ID: ${divisionInfo?.id}`);

      const recentGames = await statsService.getPlayerRecentGames(tournamentId, divisionInfo!.id, firstPlayer.id);
      console.log(`✅ Got ${recentGames.length} recent games for ${firstPlayer.firstLast}:`);
      recentGames.forEach(game => {
        const result = game.playerScore > game.opponentScore ? "W" :
                      game.playerScore < game.opponentScore ? "L" : "T";
        console.log(`   Round ${game.round}: ${result} vs ${game.opponentName} (${game.playerScore}-${game.opponentScore})`);
      });
    }

    console.log("\n✅ All tests completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const arg = process.argv[2];

  if (arg === '--migrate-all') {
    migrateExistingTournaments(false)
      .then((result) => {
        console.log(`\n🎉 Migration completed! ${result.migrated} tournaments migrated.`);
        process.exit(0);
      })
      .catch((error) => {
        console.error("\nMigration failed:", error);
        process.exit(1);
      });
  } else {
    testServices()
      .then(() => {
        console.log("\nAll tests passed! 🎉");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\nTests failed:", error);
        process.exit(1);
      });
  }
}

export { testServices, migrateExistingTournaments };