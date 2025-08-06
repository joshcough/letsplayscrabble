// backend/src/services/fileToDatabaseConversions.ts
import * as DB from "@shared/types/database";
import * as File from "@shared/types/scrabbleFileFormat";

// File Format → Database (complete conversion)
export function convertFileToDatabase(
  fileData: File.TournamentData,
  metadata: DB.TournamentMetadata,
  userId: number,
): DB.CreateTournament {
  // Convert tournament metadata
  const tournament: DB.CreateTournamentRow = {
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

  // Convert divisions with their players and games
  const divisions: DB.CreateDivisionWithData[] = fileData.divisions.map(
    (fileDivision, divisionIndex) => {
      // Create division
      const division: DB.CreateDivisionRow = {
        name: fileDivision.name,
        position: divisionIndex,
      };

      // Convert players for this division
      const players: DB.CreatePlayerRow[] = [];
      fileDivision.players.forEach((player) => {
        if (!player) return; // Skip null players

        players.push({
          seed: player.id,
          name: player.name,
          initial_rating: player.rating,
          photo: player.photo,
          etc_data: player.etc,
        });
      });

      // Convert games for this division
      const games: DB.CreateGameRow[] = [];
      const processedPairings = new Set<string>();

      fileDivision.players.forEach((player) => {
        if (!player || !player.pairings || !player.scores) return;

        for (
          let roundIndex = 0;
          roundIndex < player.pairings.length;
          roundIndex++
        ) {
          const roundNum = roundIndex + 1;
          const opponentId = player.pairings[roundIndex];
          const playerScore = player.scores[roundIndex];

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

          // Create a consistent pairing key (smaller ID first)
          const pairingKey = `${roundNum}-${Math.min(player.id, opponentId)}-${Math.max(player.id, opponentId)}`;

          if (!processedPairings.has(pairingKey)) {
            const opponentScore = opponent.scores[roundIndex];

            // Determine player order based on p12 values
            const isPlayer1First = player.etc?.p12?.[roundIndex] === 1;

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
