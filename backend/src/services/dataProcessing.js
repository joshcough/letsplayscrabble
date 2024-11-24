const axios = require("axios");

async function loadTournamentFile(jsUrl) {
  try {
    const response = await axios.get(jsUrl, {
      timeout: 25000,
      transformResponse: [(data) => data], // Prevent axios from trying to parse response
    });

    const jsContent = response.data;

    // Create a new Function that returns the object portion
    const objectText = jsContent.substring(jsContent.indexOf("{"));
    const evaluator = new Function("return " + objectText);
    const data = evaluator();

    if (!data) {
      throw new Error("Could not parse tournament data from the JS file.");
    }

    return data;
  } catch (error) {
    console.error("Error loading tournament file:", error);
    throw error;
  }
}

function calculateStandings(division) {
  const processedPlayers = division.players
    .filter((playerData) => playerData !== null && playerData !== undefined) // Remove any null players (e.g., byes)
    .map((playerData) => {
      let totalSpread = 0;
      let totalScore = 0;
      let highScore = 0;
      let wins = 0;
      let losses = 0;
      let ties = 0;
      let gamesPlayed = 0; // Tracks only real games (excluding byes)

      playerData.scores.forEach((score, index) => {
        const opponentIdx = playerData.pairings[index];

        if (opponentIdx === 0) {
          // It's a bye or forfeit
          totalSpread += score; // Add bye score to spread
          if (score > 0) {
            wins += 1; // Bye counts as a win, but not a real game
          } else {
            losses += 1;
          }
        } else {
          const opponent = division.players[opponentIdx];
          const opponentScore = opponent.scores[index];
          const spread = score - opponentScore;
          totalSpread += spread;

          if (score > opponentScore) {
            wins += 1;
          } else if (score < opponentScore) {
            losses += 1;
          } else {
            ties += 1;
          }

          totalScore += score;
          highScore = Math.max(highScore, score);
          gamesPlayed += 1; // Increment only for real games
        }
      });

      const averageScore =
        gamesPlayed > 0 ? (totalScore / gamesPlayed).toFixed(2) : 0;

      const res = {
        id: playerData.id,
        name: playerData.name,
        rating: playerData.etc.newr.at(-1),
        firstLast: formatName(playerData.name),
        wins,
        losses,
        ties,
        spread: totalSpread,
        averageScore,
        highScore,
      };
      return res;
    });

  return calculateRanks(processedPlayers);
}

const getOrdinal = (n) => {
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;

  // Special case for 11, 12, 13
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return n + "th";
  }

  switch (lastDigit) {
    case 1:
      return n + "st";
    case 2:
      return n + "nd";
    case 3:
      return n + "rd";
    default:
      return n + "th";
  }
};

const formatName = (name) => {
  const [last, first] = name.split(", ");
  return `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;
};

const calculateRanks = (players) => {
  // Create a sorted array just to determine ranks
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.spread - a.spread;
  });

  // Create a map of player to rank based on their position in sorted array
  const rankMap = new Map();
  sortedPlayers.forEach((player, index) => {
    // Create a unique key for each player (assuming no ID field)
    const playerKey = `${player.wins}-${player.losses}-${player.spread}-${player.name}`;
    rankMap.set(playerKey, index + 1);
  });

  // Map over original array to preserve order, adding ranks from our map
  return players.map((player) => {
    const playerKey = `${player.wins}-${player.losses}-${player.spread}-${player.name}`;
    const rank = rankMap.get(playerKey);
    return {
      ...player,
      rank,
      rankOrdinal: getOrdinal(rank),
    };
  });
};

// Shared function to process tournament data
const processTournament = async (tournamentRecord) => {
  if (!tournamentRecord) {
    return null;
  }

  const tourneyData = await loadTournamentFile(tournamentRecord.data_url);
  const standings = tourneyData.divisions.map((division) => {
    return calculateStandings(division);
  });

  return {
    ...tournamentRecord,
    divisions: tourneyData.divisions,
    standings: standings,
  };
};

module.exports = {
  loadTournamentFile,
  calculateStandings,
  processTournament,
};
