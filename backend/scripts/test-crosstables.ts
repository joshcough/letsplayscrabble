import { CrossTablesSyncService } from "../src/services/crossTablesSync";

/**
 * Test script to scrape CrossTables data for a specific player
 * Usage: npx ts-node scripts/test-crosstables.ts <xtid>
 * Example: npx ts-node scripts/test-crosstables.ts 17362
 */

const xtid = parseInt(process.argv[2]);

if (isNaN(xtid)) {
  console.error("Usage: npx ts-node scripts/test-crosstables.ts <xtid>");
  console.error("Example: npx ts-node scripts/test-crosstables.ts 17362");
  process.exit(1);
}

const service = new CrossTablesSyncService();

console.log(`\n🔍 Fetching CrossTables data for xtid: ${xtid}\n`);

service.fetchPlayerData(xtid)
  .then((data) => {
    console.log("✅ Success! Player data:");
    console.log(JSON.stringify(data, null, 2));

    if (data.results && data.results.length > 0) {
      console.log("\n📋 Tournament Results:");
      data.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.name || '(no name)'}`);
        console.log(`   Date: ${result.date}`);
        console.log(`   Division: ${result.division}`);
        console.log(`   Record: ${result.wins}-${result.losses}-${result.ties}`);
        console.log(`   Place: ${result.place}/${result.totalplayers}`);
      });
    }
  })
  .catch((error) => {
    console.error("❌ Error fetching player data:", error);
    process.exit(1);
  });
