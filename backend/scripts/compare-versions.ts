import { Pool } from "pg";

/**
 * Compare two tournament data versions and show the differences
 * Usage:
 *   Local: npx ts-node scripts/compare-versions.ts <version_id_1> <version_id_2>
 *   Prod:  DATABASE_URL=$(heroku config:get DATABASE_URL --app letsplayscrabble-dev-test) npx ts-node scripts/compare-versions.ts <version_id_1> <version_id_2>
 */

// Create pool based on DATABASE_URL env var or use default local config
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: "localhost",
        port: 5432,
        database: "scrabble_stats",
        user: "scrabble_user",
        password: "scrabble_pass",
      }
);

// Diff with context
interface DiffChunk {
  context: string[];
  removed: string[];
  added: string[];
}

function diffWithContext(text1: string, text2: string, contextLines: number = 2): { chunks: DiffChunk[], unchanged: number } {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const chunks: DiffChunk[] = [];
  let unchanged = 0;

  // Find all different lines with their positions
  const diffs: Array<{ index: number, line1?: string, line2?: string }> = [];
  const maxLen = Math.max(lines1.length, lines2.length);

  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i];
    const line2 = lines2[i];

    if (line1 !== line2) {
      diffs.push({ index: i, line1, line2 });
    } else {
      unchanged++;
    }
  }

  // Group nearby diffs into chunks with context
  let i = 0;
  while (i < diffs.length) {
    const startIdx = diffs[i].index;
    let endIdx = startIdx;

    // Find consecutive or nearby diffs (within contextLines*2 of each other)
    while (i < diffs.length && diffs[i].index <= endIdx + contextLines * 2) {
      endIdx = diffs[i].index;
      i++;
    }

    // Extract context and changes
    const contextStart = Math.max(0, startIdx - contextLines);
    const contextEnd = Math.min(lines1.length - 1, endIdx + contextLines);

    const context: string[] = [];
    const removed: string[] = [];
    const added: string[] = [];

    for (let j = contextStart; j <= contextEnd; j++) {
      const diff = diffs.find(d => d.index === j);
      if (diff) {
        if (diff.line1 !== undefined && (!lines2.includes(diff.line1) || diff.line2 === undefined)) {
          removed.push(diff.line1);
        }
        if (diff.line2 !== undefined && (!lines1.includes(diff.line2) || diff.line1 === undefined)) {
          added.push(diff.line2);
        }
      } else {
        // Same line in both - add as context
        if (lines1[j] !== undefined) {
          context.push(lines1[j]);
        }
      }
    }

    chunks.push({ context, removed, added });
  }

  return { chunks, unchanged };
}

async function compareVersions(versionId1: number, versionId2: number) {
  try {
    // Fetch both versions
    const result1 = await pool.query(
      "SELECT id, tournament_id, data, created_at FROM tournament_data_versions WHERE id = $1",
      [versionId1]
    );

    const result2 = await pool.query(
      "SELECT id, tournament_id, data, created_at FROM tournament_data_versions WHERE id = $1",
      [versionId2]
    );

    if (result1.rows.length === 0) {
      console.error(`❌ Version ${versionId1} not found`);
      return;
    }

    if (result2.rows.length === 0) {
      console.error(`❌ Version ${versionId2} not found`);
      return;
    }

    const v1 = result1.rows[0];
    const v2 = result2.rows[0];

    console.log("\n📊 VERSION COMPARISON");
    console.log("=".repeat(80));
    console.log(`Version 1: ID=${v1.id}, Tournament=${v1.tournament_id}, Created=${v1.created_at}`);
    console.log(`Version 2: ID=${v2.id}, Tournament=${v2.tournament_id}, Created=${v2.created_at}`);
    console.log("=".repeat(80));

    // Pretty-print both JSONs for comparison
    const json1 = JSON.stringify(v1.data, null, 2);
    const json2 = JSON.stringify(v2.data, null, 2);

    // Calculate sizes
    const size1 = Buffer.byteLength(json1, 'utf8');
    const size2 = Buffer.byteLength(json2, 'utf8');
    console.log(`\n📏 Size: ${size1} bytes → ${size2} bytes (${size2 - size1 >= 0 ? '+' : ''}${size2 - size1} bytes)`);

    // Check if identical
    if (json1 === json2) {
      console.log("\n✅ IDENTICAL - No differences found!");
      return;
    }

    // Generate diff with context
    console.log("\n🔍 DIFFERENCES (with context):");
    console.log("-".repeat(80));

    const { chunks, unchanged } = diffWithContext(json1, json2, 3);

    let totalRemoved = 0;
    let totalAdded = 0;

    // Show first 5 chunks
    chunks.slice(0, 5).forEach((chunk, idx) => {
      if (idx > 0) console.log('\n' + '·'.repeat(80));

      // Show context before changes
      chunk.context.slice(0, 2).forEach(line => {
        console.log(`  ${line}`);
      });

      // Show removed lines
      chunk.removed.forEach(line => {
        console.log(`\x1b[31m- ${line}\x1b[0m`);
        totalRemoved++;
      });

      // Show added lines
      chunk.added.forEach(line => {
        console.log(`\x1b[32m+ ${line}\x1b[0m`);
        totalAdded++;
      });

      // Show context after changes
      chunk.context.slice(-2).forEach(line => {
        console.log(`  ${line}`);
      });
    });

    if (chunks.length > 5) {
      console.log(`\n... and ${chunks.length - 5} more change sections`);
    }

    console.log("-".repeat(80));
    console.log(`\n📈 Summary: ${totalRemoved}+ lines changed in ${chunks.length} sections, ${unchanged} lines unchanged`);

    // Try to identify what changed
    console.log("\n🔬 CHANGE ANALYSIS:");
    const data1 = v1.data;
    const data2 = v2.data;

    // Check for game changes
    if (data1.divisions && data2.divisions) {
      for (let i = 0; i < Math.max(data1.divisions.length, data2.divisions.length); i++) {
        const div1 = data1.divisions[i];
        const div2 = data2.divisions[i];

        if (div1 && div2) {
          const games1 = div1.games || [];
          const games2 = div2.games || [];

          if (games1.length !== games2.length) {
            console.log(`  • Division "${div1.name}": Games count changed (${games1.length} → ${games2.length})`);
          }

          // Check for score changes in existing games
          const minGames = Math.min(games1.length, games2.length);
          let scoreChanges = 0;
          for (let g = 0; g < minGames; g++) {
            const game1 = games1[g];
            const game2 = games2[g];
            if (game1 && game2) {
              if (game1.player1Score !== game2.player1Score || game1.player2Score !== game2.player2Score) {
                scoreChanges++;
                console.log(`  • Division "${div1.name}", Game ${g}: Score changed (${game1.player1Score}-${game1.player2Score} → ${game2.player1Score}-${game2.player2Score})`);
              }
            }
          }
          if (scoreChanges === 0 && games1.length === games2.length) {
            console.log(`  • Division "${div1.name}": No score changes detected`);
          }
        }
      }
    }

  } catch (error) {
    console.error("Error comparing versions:", error);
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error("Usage: npx ts-node scripts/compare-versions.ts <version_id_1> <version_id_2>");
  console.error("Example: npx ts-node scripts/compare-versions.ts 100 101");
  process.exit(1);
}

const versionId1 = parseInt(args[0]);
const versionId2 = parseInt(args[1]);

if (isNaN(versionId1) || isNaN(versionId2)) {
  console.error("Error: Both arguments must be valid version IDs (numbers)");
  process.exit(1);
}

compareVersions(versionId1, versionId2);
