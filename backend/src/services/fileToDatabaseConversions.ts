// backend/src/services/fileToDatabaseConversions.ts
import * as File from "@shared/types/scrabbleFileFormat";
import * as DB from "@shared/types/database";

// File Format → Database (complete conversion)
export function convertFileToDatabase(
  fileData: File.TournamentData,
  metadata: {
    name: string;
    city: string;
    year: number;
    lexicon: string;
    longFormName: string;
    dataUrl: string;
    userId: number;
  },
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
    user_id: metadata.userId,
  };

  // Convert divisions
  const divisions: DB.CreateDivisionRow[] = fileData.divisions.map(
    (division, index) => ({
      name: division.name,
      position: index,
    }),
  );

  // Convert players
  const players: DB.CreatePlayerRow[] = [];
  fileData.divisions.forEach((division, divisionIndex) => {
    division.players.forEach((player) => {
      if (!player) return; // Skip null players

      players.push({
        division_position: divisionIndex,
        seed: player.id,
        name: player.name,
        initial_rating: player.rating,
        photo: player.photo,
        etc_data: player.etc,
      });
    });
  });

  // Convert games
  const games: DB.CreateGameRow[] = [];
  const processedPairings = new Set<string>();

  fileData.divisions.forEach((division, divisionIndex) => {
    // Determine max rounds from player data
    const validPlayers = division.players.filter(
      (p) => p != null && p.pairings,
    );
    if (validPlayers.length === 0) return;

    division.players.forEach((player) => {
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
          const pairingKey = `${divisionIndex}-${roundNum}-${player.id}-bye`;
          if (!processedPairings.has(pairingKey)) {
            games.push({
              division_position: divisionIndex,
              round_number: roundNum,
              player1_file_id: player.id,
              player2_file_id: player.id,
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
        const opponent = division.players.find((p) => p?.id === opponentId);
        if (!opponent || !opponent.scores) continue;

        // Create a consistent pairing key (smaller ID first)
        const pairingKey = `${divisionIndex}-${roundNum}-${Math.min(player.id, opponentId)}-${Math.max(player.id, opponentId)}`;

        if (!processedPairings.has(pairingKey)) {
          const opponentScore = opponent.scores[roundIndex];

          // Determine player order based on p12 values
          const isPlayer1First = player.etc?.p12?.[roundIndex] === 1;

          const [player1FileId, player2FileId, score1, score2] = isPlayer1First
            ? [player.id, opponentId, playerScore, opponentScore]
            : [opponentId, player.id, opponentScore, playerScore];

          games.push({
            division_position: divisionIndex,
            round_number: roundNum,
            player1_file_id: player1FileId,
            player2_file_id: player2FileId,
            player1_score: score1,
            player2_score: score2,
            is_bye: false,
            pairing_id: Math.min(player.id, opponentId),
          });

          processedPairings.add(pairingKey);
        }
      }
    });
  });

  return {
    tournament,
    divisions,
    players,
    games,
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
