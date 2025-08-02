#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TournamentGenerator {
  constructor(players, config = {}) {
    this.config = {
      eventName: config.eventName || 'Test Tournament',
      eventDate: config.eventDate || 'January 1, 2025',
      maxRounds: config.maxRounds || 10,
      outputDir: config.outputDir || './tournament-files',
      ...config
    };

    this.players = this.initializePlayers(players);
    this.currentRound = 0;
    this.completedRounds = [];
    this.playedPairings = new Set(); // Track who has played whom

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  initializePlayers(playerNames) {
    return playerNames.map((name, index) => ({
      etc: {
        p12: []
      },
      id: index + 1,
      name: name,
      newr: undefined,
      pairings: [],
      photo: `pix/${name.toLowerCase().replace(/[^a-z]/g, '_')}.jpg`,
      rating: Math.floor(Math.random() * 1000) + 1500, // Random rating 1500-2500
      scores: [],

      // Track tournament statistics
      wins: 0,
      losses: 0,
      spread: 0,
      opponentIds: [], // Track all opponents played
    }));
  }

  // Get current standings for Swiss pairings
  getStandings() {
    return [...this.players].sort((a, b) => {
      // Sort by wins first, then by spread, then by rating
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.spread !== b.spread) return b.spread - a.spread;
      return b.rating - a.rating;
    });
  }

  // Check if two players have already played each other
  havePlayedBefore(player1Id, player2Id) {
    const player1 = this.players.find(p => p.id === player1Id);
    return player1.opponentIds.includes(player2Id);
  }

  generateSwissPairings(roundNumber) {
    console.log(`📋 Generating Swiss pairings for Round ${roundNumber}`);

    const standings = this.getStandings();
    const unpaired = [...standings];
    const pairings = [];

    console.log(`📊 Pre-round standings:`);
    standings.forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.name} (${player.wins}-${player.losses}, +${player.spread})`);
    });
    console.log();

    while (unpaired.length > 1) {
      const player1 = unpaired.shift();
      let player2 = null;

      // Find best opponent for player1 (closest in standings who hasn't played them)
      for (let i = 0; i < unpaired.length; i++) {
        const candidate = unpaired[i];
        if (!this.havePlayedBefore(player1.id, candidate.id)) {
          player2 = candidate;
          unpaired.splice(i, 1);
          break;
        }
      }

      // If no valid opponent found, pair with next available (shouldn't happen in early rounds)
      if (!player2 && unpaired.length > 0) {
        player2 = unpaired.shift();
        console.log(`⚠️  Repeat pairing: ${player1.name} vs ${player2.name}`);
      }

      if (player2) {
        pairings.push({ player1, player2 });

        // Update pairings arrays
        player1.pairings[roundNumber - 1] = player2.id;
        player2.pairings[roundNumber - 1] = player1.id;

        // Track opponents
        player1.opponentIds.push(player2.id);
        player2.opponentIds.push(player1.id);

        // Determine who goes first (alternate or by rating)
        const player1First = (pairings.length % 2 === 1) || (player1.rating > player2.rating);
        player1.etc.p12[roundNumber - 1] = player1First ? 1 : 2;
        player2.etc.p12[roundNumber - 1] = player1First ? 2 : 1;

        console.log(`🤝 Pairing ${pairings.length}: ${player1.name} (ID:${player1.id}) vs ${player2.name} (ID:${player2.id})`);
        console.log(`   📝 ${player1.name}.pairings[${roundNumber-1}] = ${player2.id}, p12 = ${player1First ? 1 : 2}`);
        console.log(`   📝 ${player2.name}.pairings[${roundNumber-1}] = ${player1.id}, p12 = ${player1First ? 2 : 1}`);
      }
    }

    // Handle bye if odd number of players
    if (unpaired.length === 1) {
      const byePlayer = unpaired[0];
      byePlayer.pairings[roundNumber - 1] = byePlayer.id;
      byePlayer.etc.p12[roundNumber - 1] = 0;
      console.log(`🛌 Bye: ${byePlayer.name} (ID:${byePlayer.id})`);
      console.log(`   📝 ${byePlayer.name}.pairings[${roundNumber-1}] = ${byePlayer.id} (self), p12 = 0`);
    }

    console.log();
    return pairings;
  }

  generateRealisticScores() {
    // Generate realistic Scrabble scores
    const baseScore = 350 + Math.random() * 200; // 350-550 base
    const variation = (Math.random() - 0.5) * 100; // +/- 50 points variation
    return Math.round(baseScore + variation);
  }

  addScores(roundNumber) {
    console.log(`🎯 Adding scores for Round ${roundNumber}`);
    console.log(`📊 Game results:`);

    const processedPairs = new Set();

    this.players.forEach(player => {
      const opponentId = player.pairings[roundNumber - 1];

      if (opponentId === player.id) {
        // Bye game - standard 50 points
        player.scores[roundNumber - 1] = 50;
        player.wins += 1;
        player.spread += 50;
        console.log(`🛌 ${player.name}: BYE → scores[${roundNumber-1}] = 50, wins = ${player.wins}, spread = +${player.spread}`);
      } else if (opponentId && !processedPairs.has(`${Math.min(player.id, opponentId)}-${Math.max(player.id, opponentId)}`)) {
        // Generate game scores (only process each pair once)
        const opponent = this.players.find(p => p.id === opponentId);

        const playerScore = this.generateRealisticScores();
        const opponentScore = this.generateRealisticScores();

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

        console.log(`🎮 ${player.name} ${playerScore} - ${opponentScore} ${opponent.name} ${playerWon ? '(W)' : isTie ? '(T)' : '(L)'}`);
        console.log(`   📝 ${player.name}.scores[${roundNumber-1}] = ${playerScore}, wins = ${player.wins}, spread = +${player.spread}`);
        console.log(`   📝 ${opponent.name}.scores[${roundNumber-1}] = ${opponentScore}, wins = ${opponent.wins}, spread = +${opponent.spread}`);

        // Mark this pair as processed
        processedPairs.add(`${Math.min(player.id, opponentId)}-${Math.max(player.id, opponentId)}`);
      }
    });
    console.log();
  }

  generateTournamentFile(stage) {
    const tournamentData = {
      divisions: this.createDivisions()
    };

    const filename = `tournament_${stage}.js`;
    const filepath = path.join(this.config.outputDir, filename);
    const content = `// ${stage}\n// Generated: ${new Date().toISOString()}\n\nnewt = ${JSON.stringify(tournamentData, null, 2)};`;

    fs.writeFileSync(filepath, content);
    console.log(`📁 Generated: ${filepath}`);

    return filepath;
  }

  createDivisions() {
    // For simplicity, put all players in one division
    // Clean up the player data (remove our tracking fields)
    const cleanPlayers = this.players.map(player => ({
      etc: { p12: [...player.etc.p12] },
      id: player.id,
      name: player.name,
      newr: player.newr,
      pairings: [...player.pairings],
      photo: player.photo,
      rating: player.rating,
      scores: [...player.scores]
    }));

    return [
      {
        name: 'A',
        players: [undefined, ...cleanPlayers] // 1-based indexing
      }
    ];
  }

  // Generate pairings for round
  addRoundPairings(roundNumber) {
    console.log(`\n🎯 === GENERATING ROUND ${roundNumber} PAIRINGS ===`);
    this.currentRound = roundNumber;
    this.generateSwissPairings(roundNumber);

    // Show current state of all players
    console.log(`📋 Current player data after pairings:`);
    this.players.forEach(player => {
      console.log(`   ${player.name} (ID:${player.id}):`);
      console.log(`     pairings: [${player.pairings.join(', ')}]`);
      console.log(`     p12: [${player.etc.p12.join(', ')}]`);
      console.log(`     scores: [${player.scores.join(', ')}]`);
    });
    console.log();

    const fileNumber = (roundNumber * 2 - 1).toString().padStart(2, '0');
    const filename = this.generateTournamentFile(`${fileNumber}_round${roundNumber}_pairings`);
    console.log(`✅ Pairings file generated: ${filename}\n`);
    return filename;
  }

  // Add scores for round
  addRoundScores(roundNumber) {
    console.log(`\n🎯 === ADDING ROUND ${roundNumber} SCORES ===`);
    this.addScores(roundNumber);
    this.completedRounds.push(roundNumber);

    // Show current state of all players
    console.log(`📋 Current player data after scores:`);
    this.players.forEach(player => {
      console.log(`   ${player.name} (ID:${player.id}):`);
      console.log(`     pairings: [${player.pairings.join(', ')}]`);
      console.log(`     scores: [${player.scores.join(', ')}]`);
      console.log(`     record: ${player.wins}-${player.losses}, spread: +${player.spread}`);
    });
    console.log();

    const fileNumber = (roundNumber * 2).toString().padStart(2, '0');
    const filename = this.generateTournamentFile(`${fileNumber}_round${roundNumber}_complete`);
    console.log(`✅ Scores file generated: ${filename}\n`);
    return filename;
  }

  // Simulate one complete round
  simulateFullRound(roundNumber) {
    console.log(`\n🎲 ===== SIMULATING ROUND ${roundNumber} =====`);

    const pairingsFile = this.addRoundPairings(roundNumber);
    const scoresFile = this.addRoundScores(roundNumber);

    console.log(`📊 Final standings after Round ${roundNumber}:`);
    this.getStandings().forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.name} (${player.wins}-${player.losses}, +${player.spread})`);
    });
    console.log(`\n🎯 Round ${roundNumber} complete!\n`);

    return { pairingsFile, scoresFile };
  }

  // Generate initial empty tournament
  generateInitialTournament() {
    console.log(`🏆 Creating tournament: ${this.config.eventName}`);
    console.log(`👥 Players: ${this.players.length}`);
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
    console.log(`🏆 Final Standings:`);
    this.getStandings().forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.name} (${player.wins}-${player.losses}, +${player.spread})`);
    });
    console.log(`📁 Generated ${files.length} files in: ${this.config.outputDir}`);

    return files;
  }
}

// Example usage and CLI interface
if (require.main === module) {
  const players = [
    "Josh Cough",           // You!
    "Will Anderson",
    "Joel Wapnick",
    "David Gibson",
    "Chris Lipe",
    "Nigel Richards",
    "Dave Wiegand",
    "Joey Mallick",
    "Conrad Bassett-Bouchard",
    "Jackson Smylie",
    "Matthew Tunnicliffe"
  ];

  const generator = new TournamentGenerator(players, {
    eventName: 'Josh Test Tournament',
    eventDate: 'August 2, 2025',
    maxRounds: 7,
    outputDir: './generated-tournament'
  });

  // Generate a full 7-round tournament
  generator.simulateFullTournament(7);

  console.log('\n📖 Usage examples:');
  console.log('  generator.generateInitialTournament()           // Empty tournament');
  console.log('  generator.addRoundPairings(1)                   // Add Round 1 pairings');
  console.log('  generator.addRoundScores(1)                     // Add Round 1 scores');
  console.log('  generator.simulateFullRound(2)                  // Full Round 2');
  console.log('  generator.simulateFullTournament(5)             // 5-round tournament');
}