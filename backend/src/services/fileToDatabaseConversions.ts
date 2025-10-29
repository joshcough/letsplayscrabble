// backend/src/services/fileToDatabaseConversions.ts
import * as DB from "../types/database";
import * as File from "../types/scrabbleFileFormat";
import { stripXtidFromPlayerName, extractXtidFromEtc } from "../utils/xtidHelpers";
import { CrossTablesPlayerRepository } from "../repositories/crossTablesPlayerRepository";

// File Format → Database (complete conversion)
export async function convertFileToDatabase(
  fileData: File.TournamentData,
  metadata: DB.TournamentMetadata,
  userId: number,
): Promise<DB.CreateTournament> {
  // Convert tournament metadata
  const tournament = {
    name: metadata.name,
    city: metadata.city,
    year: metadata.year,
    lexicon: metadata.lexicon,
    long_form_name: metadata.longFormName,
    data_url: metadata.dataUrl,
    data: fileData,
    poll_until: null,
    user_id: userId,
  };

  // Get all xtids from the tournament to validate them
  const allXtids: number[] = [];
  fileData.divisions.forEach(division => {
    division.players
      .filter((player): player is File.Player => player != null && player.id !== undefined)
      .forEach(player => {
        // Only extract from etc.xtid - never from name suffix
        const xtid = extractXtidFromEtc(player.etc?.xtid);
        if (typeof xtid === 'number' && !isNaN(xtid)) {
          allXtids.push(xtid);
        }
      });
  });

  // Check which xtids exist in the database
  const validXtids = new Set<number>();
  if (allXtids.length > 0) {
    const crossTablesRepo = new CrossTablesPlayerRepository();
    const existingPlayers = await crossTablesRepo.getPlayers(allXtids);
    existingPlayers.forEach(player => {
      validXtids.add(player.cross_tables_id);
    });
    console.log(`Validated ${validXtids.size} of ${allXtids.length} xtids from cross_tables_players`);
  }

  // Convert divisions with their players and games
  const divisions: DB.CreateDivisionWithData[] = fileData.divisions.map(
    (fileDivision, divisionIndex) => {
      // Create division
      const division = {
        name: fileDivision.name,
        position: divisionIndex,
      };

      // Convert players for this division
      const players = fileDivision.players
        .filter((player): player is File.Player => player != null && player.id !== undefined)
        .map((player) => {
          // Always clean the name - :XT suffix is noise in real tournament files
          const cleanName = stripXtidFromPlayerName(player.name);

          // Only extract xtid from etc.xtid - never from name suffix
          const xtid = extractXtidFromEtc(player.etc?.xtid);

          // Only set xtid if it exists in the cross_tables_players table
          let safeXtid: number | null = null;
          if (typeof xtid === 'number' && !isNaN(xtid)) {
            if (validXtids.has(xtid)) {
              safeXtid = xtid;
            } else {
              console.warn(`⚠️ Skipping xtid ${xtid} for player "${cleanName}" - not found in cross_tables_players`);
            }
          }

          return {
            seed: player.id,
            name: cleanName,
            initial_rating: player.rating,
            photo: player.photo,
            etc_data: player.etc,
            xtid: safeXtid,
          };
        });

      // Convert games for this division
      const games: DB.CreateGameRow[] = [];
      const processedPairings = new Set<string>();

      fileDivision.players.forEach((player) => {
        if (!player || !player.pairings || !player.scores) return;

        // Skip game creation for players with no pairings (player is still added to tournament)
        if (player.pairings.length === 0) return;

        for (
          let roundIndex = 0;
          roundIndex < player.pairings.length;
          roundIndex++
        ) {
          const roundNum = roundIndex + 1;
          const opponentId = player.pairings[roundIndex];

          // Get player score, default to null if scores array is shorter or empty
          const playerScore =
            roundIndex < player.scores.length
              ? player.scores[roundIndex]
              : null;

          // Handle bye
          if (opponentId === 0) {
            const pairingKey = `${roundNum}-${player.id}-bye`;
            if (!processedPairings.has(pairingKey)) {
              games.push({
                round_number: roundNum,
                player1_seed: player.id,
                player2_seed: player.id, // Same player for bye
                player1_score: playerScore,
                player2_score: 0,
                is_bye: true,
                pairing_id: player.id,
              });
              processedPairings.add(pairingKey);
            }
            continue;
          }

          // Regular game - avoid duplicate insertion
          const opponent = fileDivision.players.find(
            (p) => p?.id === opponentId,
          );
          if (!opponent || !opponent.scores) continue;

          // Get opponent score, default to null if scores array is shorter or empty
          const opponentScore =
            roundIndex < opponent.scores.length
              ? opponent.scores[roundIndex]
              : null;

          // Create a consistent pairing key (smaller ID first)
          const pairingKey = `${roundNum}-${Math.min(player.id, opponentId)}-${Math.max(player.id, opponentId)}`;

          if (!processedPairings.has(pairingKey)) {
            // Determine player order based on p12 values, with safe array access
            const p12Value = player.etc?.p12?.[roundIndex];
            const isPlayer1First = p12Value === 1;

            const [player1Seed, player2Seed, score1, score2] = isPlayer1First
              ? [player.id, opponentId, playerScore, opponentScore]
              : [opponentId, player.id, opponentScore, playerScore];

            games.push({
              round_number: roundNum,
              player1_seed: player1Seed,
              player2_seed: player2Seed,
              player1_score: score1,
              player2_score: score2,
              is_bye: false,
              pairing_id: Math.min(player.id, opponentId),
            });

            processedPairings.add(pairingKey);
          }
        }
      });

      return {
        division,
        players,
        games,
      };
    },
  );

  return {
    tournament,
    divisions,
  };
}

// Helper: Convert file Etc to better format (if needed later)
export function convertEtcFromFile(etc: File.Etc) {
  return {
    ratingHistory: etc.newr,
    goingFirstHistory: etc.p12.map((val) => {
      switch (val) {
        case 0:
          return "bye" as const;
        case 1:
          return "first" as const;
        case 2:
          return "second" as const;
        default:
          return "bye" as const;
      }
    }),
  };
}

// Helper: Format player name
export function formatName(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(" ")}`;
  }
  return name;
}
