#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TournamentGenerator {
  constructor(playersByDivision, config = {}) {
    this.config = {
      eventName: config.eventName || 'Test Tournament',
      eventDate: config.eventDate || 'January 1, 2025',
      maxRounds: config.maxRounds || 10,
      outputDir: config.outputDir || './tournament-files',
      ...config
    };

    // Accept either array of arrays or object with division names
    this.divisions = this.initializeDivisions(playersByDivision);
    this.currentRound = 0;
    this.completedRounds = [];

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  initializeDivisions(playersByDivision) {
    // Convert to array and assign division names A, B, C, etc.
    const divisionsArray = Array.isArray(playersByDivision)
      ? playersByDivision
      : Object.values(playersByDivision);

    return divisionsArray.map((playerNames, divIndex) => {
      const divName = String.fromCharCode(65 + divIndex); // A, B, C, etc.
      console.log(`📋 Initializing Division ${divName} with ${playerNames.length} players`);

      // Calculate rating range for division
      const baseRating = 2200 - (divIndex * 400); // A: 2200, B: 1800, C: 1400, etc.

      const players = playerNames.map((name, index) => {
        const initialRating = baseRating - (index * 20) + Math.floor(Math.random() * 40) - 20;
        
        return {
          etc: {
            p12: []
          },
          id: index + 1, // Division-specific ID (1-based)
          name: name,
          newr: undefined,
          pairings: [],
          photo: `pix/${name.toLowerCase().replace(/[^a-z]/g, '_')}.jpg`,
          rating: initialRating, // Decreasing by seed with some randomness
          scores: [],

          // Track tournament statistics
          wins: 0,
          losses: 0,
          spread: 0,
          opponentIds: [], // Track all opponents played within division
          currentRating: initialRating, // Same as rating field
          ratingHistory: [initialRating], // Track rating after each round
        };
      });

      return {
        name: divName,
        players: players,
        playedPairings: new Set() // Track who has played whom in this division
      };
    });
  }

  // Get current standings for a division
  getStandings(division) {
    return [...division.players].sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.spread !== b.spread) return b.spread - a.spread;
      return b.rating - a.rating;
    });
  }

  // Check if two players have already played each other in a division
  havePlayedBefore(division, player1Id, player2Id) {
    const player1 = division.players.find(p => p.id === player1Id);
    return player1.opponentIds.includes(player2Id);
  }

  generateSwissPairings(division, roundNumber) {
    console.log(`  📋 Generating Swiss pairings for Division ${division.name}, Round ${roundNumber}`);

    const standings = this.getStandings(division);
    const unpaired = [...standings];
    const pairings = [];

    while (unpaired.length > 1) {
      const player1 = unpaired.shift();
      let player2 = null;

      // Find best opponent for player1
      for (let i = 0; i < unpaired.length; i++) {
        const candidate = unpaired[i];
        if (!this.havePlayedBefore(division, player1.id, candidate.id)) {
          player2 = candidate;
          unpaired.splice(i, 1);
          break;
        }
      }

      // If no valid opponent found, pair with next available
      if (!player2 && unpaired.length > 0) {
        player2 = unpaired.shift();
        console.log(`    ⚠️  Repeat pairing: ${player1.name} vs ${player2.name}`);
      }

      if (player2) {
        pairings.push({ player1, player2 });

        // Update pairings arrays
        player1.pairings[roundNumber - 1] = player2.id;
        player2.pairings[roundNumber - 1] = player1.id;

        // Track opponents
        player1.opponentIds.push(player2.id);
        player2.opponentIds.push(player1.id);

        // Determine who goes first
        const player1First = (pairings.length % 2 === 1) || (player1.rating > player2.rating);
        player1.etc.p12[roundNumber - 1] = player1First ? 1 : 2;
        player2.etc.p12[roundNumber - 1] = player1First ? 2 : 1;

        console.log(`    🤝 Pair ${pairings.length}: ${player1.name} vs ${player2.name}`);
      }
    }

    // Handle bye if odd number of players
    if (unpaired.length === 1) {
      const byePlayer = unpaired[0];
      byePlayer.pairings[roundNumber - 1] = 0; // Use 0 for bye
      byePlayer.etc.p12[roundNumber - 1] = 0;
      console.log(`    🛌 Bye: ${byePlayer.name}`);
    }

    return pairings;
  }

  generateRealisticScores(divisionLevel) {
    // Generate realistic Scrabble scores based on division level
    // Higher divisions have higher average scores
    const baseScore = 400 - (divisionLevel * 30); // A: 400, B: 370, C: 340
    const variation = Math.random() * 150; // 0-150 points variation
    return Math.round(baseScore + variation);
  }

  // Calculate rating change based on result and opponent rating
  calculateRatingChange(playerRating, opponentRating, result) {
    // Simplified Elo-style rating calculation for Scrabble
    // result: 1 for win, 0.5 for tie, 0 for loss
    const K = 32; // K-factor
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const ratingChange = K * (result - expectedScore);
    return Math.round(ratingChange);
  }

  addScores(division, divisionLevel, roundNumber) {
    console.log(`  🎯 Adding scores for Division ${division.name}, Round ${roundNumber}`);

    const processedPairs = new Set();

    division.players.forEach(player => {
      const opponentId = player.pairings[roundNumber - 1];

      if (opponentId === 0) {
        // Bye game - standard 50 points
        player.scores[roundNumber - 1] = 50;
        player.wins += 1;
        player.spread += 50;
        // No rating change for bye, but add current rating to history
        player.ratingHistory.push(player.currentRating);
        console.log(`    🛌 ${player.name}: BYE (50 points)`);
      } else if (opponentId && !processedPairs.has(`${Math.min(player.id, opponentId)}-${Math.max(player.id, opponentId)}`)) {
        // Generate game scores
        const opponent = division.players.find(p => p.id === opponentId);

        const playerScore = this.generateRealisticScores(divisionLevel);
        const opponentScore = this.generateRealisticScores(divisionLevel);

        player.scores[roundNumber - 1] = playerScore;
        opponent.scores[roundNumber - 1] = opponentScore;

        // Update wins/losses
        const playerWon = playerScore > opponentScore;
        const isTie = playerScore === opponentScore;

        if (playerWon) {
          player.wins += 1;
          opponent.losses += 1;
        } else if (!isTie) {
          opponent.wins += 1;
          player.losses += 1;
        }

        // Update spreads
        const playerSpreadChange = playerScore - opponentScore;
        player.spread += playerSpreadChange;
        opponent.spread -= playerSpreadChange;

        // Calculate rating changes
        const playerResult = isTie ? 0.5 : (playerWon ? 1 : 0);
        const opponentResult = isTie ? 0.5 : (playerWon ? 0 : 1);

        const playerRatingChange = this.calculateRatingChange(player.currentRating, opponent.currentRating, playerResult);
        const opponentRatingChange = this.calculateRatingChange(opponent.currentRating, player.currentRating, opponentResult);

        // Update current ratings
        player.currentRating += playerRatingChange;
        opponent.currentRating += opponentRatingChange;

        // Add to rating history
        player.ratingHistory.push(player.currentRating);
        opponent.ratingHistory.push(opponent.currentRating);

        console.log(`    🎮 ${player.name} ${playerScore} - ${opponentScore} ${opponent.name} (Rating: ${playerRatingChange > 0 ? '+' : ''}${playerRatingChange}, ${opponentRatingChange > 0 ? '+' : ''}${opponentRatingChange})`);

        // Mark this pair as processed
        processedPairs.add(`${Math.min(player.id, opponentId)}-${Math.max(player.id, opponentId)}`);
      }
    });
  }

  generateTournamentFile(stage) {
    const isInitial = stage.includes('initial');
    const tournamentData = {
      config: {
        event_name: this.config.eventName,
        event_date: this.config.eventDate,
        max_rounds: this.config.maxRounds
      },
      divisions: this.createDivisionsForFile(isInitial)
    };

    const filename = `tournament_${stage}.js`;
    const filepath = path.join(this.config.outputDir, filename);
    const content = `// ${stage}\n// Generated: ${new Date().toISOString()}\n\nnewt = ${JSON.stringify(tournamentData, null, 2)};`;

    fs.writeFileSync(filepath, content);
    console.log(`📁 Generated: ${filepath}`);

    return filepath;
  }

  createDivisionsForFile(isInitial = false) {
    // Create divisions array for the file format
    return this.divisions.map(division => {
      // Clean up the player data (remove our tracking fields)
      const cleanPlayers = division.players.map(player => ({
        etc: {
          p12: isInitial ? [] : [...player.etc.p12],
          newr: isInitial ? [] : [...player.ratingHistory], // Use the rating history we've been tracking
          board: [],
          excwins: [],
          penalty: [],
          rcrank: undefined,
          rmood: undefined,
          rrank: [],
          rtime: [],
          seat: [],
          time: []
        },
        id: player.id,
        name: player.name,
        newr: player.newr,
        pairings: isInitial ? [] : [...player.pairings],
        photo: player.photo,
        photomood: undefined,
        rating: player.rating,
        scores: isInitial ? [] : [...player.scores]
      }));

      return {
        name: division.name,
        players: [undefined, ...cleanPlayers], // 1-based indexing with undefined at index 0
        // Add other division properties that might be expected
        classes: undefined,
        first_out_of_the_money: [],
        maxr: this.config.maxRounds,
        maxrp: 0,
        rating_list: "nsa",
        rating_system: "nsa2008",
        seeds: cleanPlayers.map(p => p.id)
      };
    });
  }

  // Generate pairings for all divisions for a round
  addRoundPairings(roundNumber) {
    console.log(`\n🎯 === GENERATING ROUND ${roundNumber} PAIRINGS FOR ALL DIVISIONS ===`);
    this.currentRound = roundNumber;

    this.divisions.forEach((division, divIndex) => {
      console.log(`\n Division ${division.name}:`);
      this.generateSwissPairings(division, roundNumber);
    });

    const fileNumber = (roundNumber * 2 - 1).toString().padStart(2, '0');
    const filename = this.generateTournamentFile(`${fileNumber}_round${roundNumber}_pairings`);
    console.log(`\n✅ Pairings file generated: ${filename}\n`);
    return filename;
  }

  // Add scores for all divisions for a round
  addRoundScores(roundNumber) {
    console.log(`\n🎯 === ADDING ROUND ${roundNumber} SCORES FOR ALL DIVISIONS ===`);

    this.divisions.forEach((division, divIndex) => {
      console.log(`\n Division ${division.name}:`);
      this.addScores(division, divIndex, roundNumber);
    });

    this.completedRounds.push(roundNumber);

    const fileNumber = (roundNumber * 2).toString().padStart(2, '0');
    const filename = this.generateTournamentFile(`${fileNumber}_round${roundNumber}_complete`);
    console.log(`\n✅ Scores file generated: ${filename}\n`);
    return filename;
  }

  // Simulate one complete round for all divisions
  simulateFullRound(roundNumber) {
    console.log(`\n🎲 ===== SIMULATING ROUND ${roundNumber} =====`);

    const pairingsFile = this.addRoundPairings(roundNumber);
    const scoresFile = this.addRoundScores(roundNumber);

    console.log(`\n📊 Standings after Round ${roundNumber}:`);
    this.divisions.forEach(division => {
      console.log(`\n Division ${division.name}:`);
      this.getStandings(division).slice(0, 5).forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.name} (${player.wins}-${player.losses}, +${player.spread})`);
      });
      if (division.players.length > 5) {
        console.log(`   ... and ${division.players.length - 5} more`);
      }
    });

    console.log(`\n🎯 Round ${roundNumber} complete!\n`);
    return { pairingsFile, scoresFile };
  }

  // Generate initial empty tournament
  generateInitialTournament() {
    console.log(`🏆 Creating tournament: ${this.config.eventName}`);
    console.log(`📊 Divisions: ${this.divisions.length}`);
    this.divisions.forEach(div => {
      console.log(`   Division ${div.name}: ${div.players.length} players`);
    });
    return this.generateTournamentFile('00_initial');
  }

  // Simulate full tournament
  simulateFullTournament(rounds = this.config.maxRounds) {
    console.log(`\n🎪 Simulating full tournament with ${rounds} rounds\n`);

    const files = [];
    files.push(this.generateInitialTournament());

    for (let round = 1; round <= rounds; round++) {
      const { pairingsFile, scoresFile } = this.simulateFullRound(round);
      files.push(pairingsFile, scoresFile);
    }

    console.log(`\n✅ Tournament simulation complete!`);
    console.log(`📁 Generated ${files.length} files in: ${this.config.outputDir}`);

    return files;
  }
}

// Command-line interface
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const numDivisions = parseInt(args[0]) || 3; // Default to 3 divisions
  const numRounds = parseInt(args[1]) || 7;    // Default to 7 rounds

  if (numDivisions < 2 || numDivisions > 4) {
    console.error('❌ Number of divisions must be between 2 and 4');
    console.log('Usage: node tournament-generator.js [divisions] [rounds]');
    console.log('Example: node tournament-generator.js 3 7');
    process.exit(1);
  }

  console.log(`\n🏆 Generating tournament with ${numDivisions} divisions and ${numRounds} rounds\n`);

  // Player pools for each division
  const allPlayers = {
    A: [
      "Josh Cough",
      "Nigel Richards",
      "Will Anderson",
      "Dave Wiegand",
      "Conrad Bassett-Bouchard",
      "Joel Wapnick",
      "Joey Mallick",
      "Chris Lipe"
    ],
    B: [
      "Matthew Tunnicliffe",
      "Jackson Smylie",
      "David Gibson",
      "Jeremy Hall",
      "Stefan Rau",
      "Joshua Sokol",
      "Matt Canik",
      "Cesar Del Solar"
    ],
    C: [
      "Sam Kantimathi",
      "Lisa Odom",
      "Mark Berg",
      "Terry Kang",
      "Carol Guest",
      "Samuel Heiman",
      "Russell McKinstry",
      "Joseph Waldbaum",
      "Sheldon Gartner",
      "Elizabeth Stoumen",
      "Dalton Hoffine",
      "Portia Zwicker"
    ],
    D: [
      "Pat Baron",
      "Ruth Hamilton",
      "Daniel Stock",
      "Mary Rhoades",
      "Tom Bond",
      "Jennifer Lee",
      "Alan Stern",
      "Barbara Van Alen"
    ]
  };

  // Build divisions array based on requested number
  const divisions = [];
  const divisionLetters = ['A', 'B', 'C', 'D'];
  for (let i = 0; i < numDivisions; i++) {
    divisions.push(allPlayers[divisionLetters[i]]);
  }

  const generator = new TournamentGenerator(
    divisions,
    {
      eventName: `Test Tournament (${numDivisions} Divisions)`,
      eventDate: 'August 5, 2025',
      maxRounds: numRounds,
      outputDir: './generated-tournament'
    }
  );

  // Generate the full tournament
  generator.simulateFullTournament(numRounds);

  console.log('\n✅ Tournament files generated successfully!');
  console.log('\n📖 Usage:');
  console.log('  node tournament-generator.js [divisions] [rounds]');
  console.log('  divisions: 2-4 (default: 3)');
  console.log('  rounds: number of rounds (default: 7)');
  console.log('\nExamples:');
  console.log('  node tournament-generator.js        # 3 divisions, 7 rounds');
  console.log('  node tournament-generator.js 2      # 2 divisions, 7 rounds');
  console.log('  node tournament-generator.js 4 5    # 4 divisions, 5 rounds');
}