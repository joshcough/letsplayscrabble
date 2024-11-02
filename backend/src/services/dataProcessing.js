// backend/src/services/dataProcessing.js
async function loadTournamentFile(jsUrl) {
  try {
    const response = await fetch(jsUrl);
    const jsContent = await response.text();

    // Dynamically evaluate the content of the JS file to extract the `newt` variable
    let newt;
    eval(jsContent); // This will execute the file and assign the `newt` variable

    if (!newt) {
      throw new Error("Could not find the 'newt' variable in the JS file.");
    }

    return newt;
  } catch (error) {
    console.error("Error loading tournament file:", error);
    return null;
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
        name: playerData.name,
        wins,
        losses,
        ties,
        spread: totalSpread,
        averageScore,
        highScore,
      };
      return res;
    });

  return processedPlayers;
}

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
