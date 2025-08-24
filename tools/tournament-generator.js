#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TournamentGenerator {
  constructor(playersByDivision, config = {}) {
    console.log(`🏗️  TournamentGenerator constructor called`);

    this.config = {
      eventName: config.eventName || 'Test Tournament',
      eventDate: config.eventDate || 'January 1, 2025',
      maxRounds: config.maxRounds || 10,
      outputDir: config.outputDir || './tools/generated-tournament',
      playerDataFile: config.playerDataFile || null, // Path to CSV player data
      ...config
    };

    console.log(`📊 Config: ${JSON.stringify(this.config, null, 2)}`);

    // Load player data from CSV if provided
    console.log(`📂 Loading player data...`);
    this.playerData = this.loadPlayerData();
    console.log(`✅ Player data loaded: ${this.playerData.size} players`);

    // Accept either array of arrays or object with division names
    console.log(`🏗️  Initializing divisions...`);
    this.divisions = this.initializeDivisions(playersByDivision);
    console.log(`✅ Divisions initialized: ${this.divisions.length} divisions`);

    this.currentRound = 0;
    this.completedRounds = [];

    // Ensure output directory exists
    console.log(`📁 Ensuring output directory exists: ${this.config.outputDir}`);
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
      console.log(`✅ Created output directory`);
    } else {
      console.log(`✅ Output directory already exists`);
    }

    console.log(`✅ TournamentGenerator constructor complete`);
  }

  loadPlayerData() {
    if (!this.config.playerDataFile || !fs.existsSync(this.config.playerDataFile)) {
      console.log('⚠️  No player data file provided or file not found. Using generated data.');
      return new Map();
    }

    try {
      const jsonContent = fs.readFileSync(this.config.playerDataFile, 'utf8');
      const data = JSON.parse(jsonContent);

      // Check if it's the expected format with players array
      const players = data.players || data;

      if (!Array.isArray(players)) {
        console.log('⚠️  JSON file does not contain a players array. Using generated data.');
        return new Map();
      }

      const playerMap = new Map();

      players.forEach(player => {
        if (player.name && player.playerid) {
          playerMap.set(player.name, {
            playerid: player.playerid.toString(),
            rating: parseInt(player.twlrating) || 1500,
            city: player.city || '',
            country: player.country || '',
            state: player.state || '',
            naspa_id: player.naspa_id || '',
            prizemoney: parseInt(player.prizemoney) || 0
          });
        }
      });

      console.log(`📊 Loaded ${playerMap.size} players from JSON data`);
      return playerMap;
    } catch (error) {
      console.log(`⚠️  Error loading player data: ${error.message}. Using generated data.`);
      return new Map();
    }
  }

  initializeDivisions(playersByDivision) {
    console.log(`🏗️  initializeDivisions called with:`, typeof playersByDivision, Array.isArray(playersByDivision));

    // Convert to array and assign division names A, B, C, etc.
    const divisionsArray = Array.isArray(playersByDivision)
      ? playersByDivision
      : Object.values(playersByDivision);

    console.log(`📊 Processing ${divisionsArray.length} divisions`);

    return divisionsArray.map((playerNames, divIndex) => {
      const divName = String.fromCharCode(65 + divIndex); // A, B, C, etc.
      console.log(`📋 Initializing Division ${divName} with ${playerNames.length} players`);

      // Calculate rating range for division
      const baseRating = 2200 - (divIndex * 400); // A: 2200, B: 1800, C: 1400, etc.
      console.log(`  📊 Base rating for division: ${baseRating}`);

      const players = playerNames.map((name, index) => {
        // Try to get player data from CSV
        const playerInfo = this.playerData.get(name);

        let rating, playerid;
        if (playerInfo) {
          rating = playerInfo.rating;
          playerid = playerInfo.playerid;
          console.log(`    ✅ Found ${name} in player data (ID: ${playerid}, Rating: ${rating})`);
        } else {
          // Fallback to generated data
          rating = baseRating - (index * 20) + Math.floor(Math.random() * 40) - 20;
          playerid = `GEN${divIndex}${(index + 1).toString().padStart(3, '0')}`; // Generated ID like GEN0001
          console.log(`    ⚠️  ${name} not found in player data, using generated (ID: ${playerid}, Rating: ${rating})`);
        }

        const player = {
          etc: {
            p12: [],
            xtid: playerid // Store the external player ID here
          },
          id: index + 1, // Division-specific ID (1-based)
          name: name,
          newr: undefined,
          pairings: [],
          photo: `pix/${name.toLowerCase().replace(/[^a-z]/g, '_')}.jpg`,
          rating: rating,
          scores: [],

          // Track tournament statistics
          wins: 0,
          losses: 0,
          spread: 0,
          opponentIds: [], // Track all opponents played within division
          currentRating: rating, // Same as rating field
          ratingHistory: [rating], // Track rating after each round
        };

        if (index < 2) { // Log first 2 players per division
          console.log(`    👤 Player ${index + 1}: ${JSON.stringify(player, null, 2)}`);
        }

        return player;
      });

      const division = {
        name: divName,
        players: players,
        playedPairings: new Set() // Track who has played whom in this division
      };

      console.log(`  ✅ Division ${divName} initialized with ${players.length} players`);
      return division;
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
          newr: isInitial ? [] : [...player.ratingHistory.slice(1)], // Skip the initial rating, only include post-game ratings
          xtid: player.etc.xtid // Include the external player ID
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
  const playerDataFile = args[2] || null;      // Optional player data JSON file
  const playersPerDivision = parseInt(args[3]) || 8; // Default to 8 players per division

  if (numDivisions < 2 || numDivisions > 4) {
    console.error('❌ Number of divisions must be between 2 and 4');
    console.log('Usage: node tournament-generator.js [divisions] [rounds] [player-data.json] [players-per-division]');
    console.log('Example: node tournament-generator.js 3 7 players.json 8');
    process.exit(1);
  }

  if (!playerDataFile) {
    console.error('❌ Player data JSON file is required');
    console.log('Usage: node tournament-generator.js [divisions] [rounds] [player-data.json] [players-per-division]');
    console.log('Example: node tournament-generator.js 3 7 players.json 8');
    process.exit(1);
  }

  console.log(`\n🏆 Generating tournament with ${numDivisions} divisions, ${numRounds} rounds, ${playersPerDivision} players per division\n`);

  // Function to randomly select players and organize into divisions
  function selectPlayersForTournament(playerDataFile, numDivisions, playersPerDivision) {
    console.log(`🔍 Loading player data from: ${playerDataFile}`);

    try {
      const jsonContent = fs.readFileSync(playerDataFile, 'utf8');
      console.log(`✅ File read successfully, size: ${jsonContent.length} characters`);

      const data = JSON.parse(jsonContent);
      console.log(`✅ JSON parsed successfully`);

      const players = data.players || data;
      console.log(`📊 Raw player count: ${Array.isArray(players) ? players.length : 'Not an array'}`);

      if (!Array.isArray(players)) {
        console.error('❌ JSON file does not contain a players array');
        process.exit(1);
      }

      console.log(`🔍 Filtering valid players...`);

      // Filter out players without valid data
      const validPlayers = players.filter(p => {
        const isValid = p.name &&
                       p.playerid &&
                       p.twlrating &&
                       parseInt(p.twlrating) > 0 && // Convert string to number
                       p.deceased !== "1"; // Check string value, not boolean

        if (!isValid && Math.random() < 0.01) { // Log 1% of invalid players for debugging
          console.log(`  ⚠️  Invalid player example: ${JSON.stringify({
            name: p.name || 'MISSING',
            playerid: p.playerid || 'MISSING',
            twlrating: p.twlrating || 'MISSING',
            twlrating_parsed: parseInt(p.twlrating) || 'INVALID',
            deceased: p.deceased,
            deceased_check: p.deceased !== "1"
          })}`);
        }

        return isValid;
      });

      console.log(`📊 Found ${validPlayers.length} valid players in database`);

      const totalPlayersNeeded = numDivisions * playersPerDivision;
      console.log(`🎯 Need ${totalPlayersNeeded} players total (${numDivisions} divisions × ${playersPerDivision} players)`);

      if (validPlayers.length < totalPlayersNeeded) {
        console.error(`❌ Not enough valid players in database. Need ${totalPlayersNeeded}, have ${validPlayers.length}`);
        process.exit(1);
      }

      console.log(`🔄 Sorting players by rating...`);
      // Sort players by rating (highest first)
      validPlayers.sort((a, b) => (parseInt(b.twlrating) || 0) - (parseInt(a.twlrating) || 0));

      console.log(`📊 Rating range: ${validPlayers[0].twlrating} (highest) to ${validPlayers[validPlayers.length-1].twlrating} (lowest)`);

      console.log(`🎲 Creating divisions...`);
      // Divide players into rating tiers for more realistic divisions
      const divisions = [];
      const playersPerTier = Math.ceil(validPlayers.length / numDivisions);

      for (let divIndex = 0; divIndex < numDivisions; divIndex++) {
        console.log(`  📋 Processing Division ${String.fromCharCode(65 + divIndex)}...`);

        // Always include specific top players in Division A for testing
        const guaranteedPlayers = [];
        if (divIndex === 0) { // Division A only
          const topPlayers = [
            'Nigel Richards',     // World #1, lots of wins
            'Joey Krafchick',     // Top US player
            'Will Anderson',      // Another top player
            'Jackson Smylie',     // Top Canadian
            'Brooke Mosesman',    // Low-rated player (54 rating) - likely no wins for testing
          ];
          
          console.log(`    ⭐ Adding guaranteed top players to Division A...`);
          for (const playerName of topPlayers) {
            const player = validPlayers.find(p => p.name === playerName);
            if (player && guaranteedPlayers.length < playersPerDivision - 1) {
              guaranteedPlayers.push(player);
              console.log(`    ✅ Added ${playerName} (rating: ${player.twlrating})`);
            }
          }
        }

        const tierStart = divIndex * playersPerTier;
        const tierEnd = Math.min((divIndex + 1) * playersPerTier, validPlayers.length);
        const tierPlayers = validPlayers.slice(tierStart, tierEnd)
          .filter(p => !guaranteedPlayers.some(gp => gp.playerid === p.playerid)); // Exclude already selected

        console.log(`    🎯 Tier range: players ${tierStart} to ${tierEnd-1} (${tierPlayers.length} available after exclusions)`);
        console.log(`    📊 Rating range for this tier: ${tierPlayers[0]?.twlrating} to ${tierPlayers[tierPlayers.length-1]?.twlrating}`);

        // Start with guaranteed player names, then randomly select from tier
        const selectedPlayers = guaranteedPlayers.map(p => p.name);
        const shuffledTier = [...tierPlayers].sort(() => 0.5 - Math.random());

        console.log(`    🎲 Randomly selecting ${Math.min(playersPerDivision, shuffledTier.length)} players...`);

        const remainingSlots = playersPerDivision - selectedPlayers.length;
        for (let i = 0; i < Math.min(remainingSlots, shuffledTier.length); i++) {
          selectedPlayers.push(shuffledTier[i].name);
          if (i < 3) { // Log first 3 selections
            console.log(`      ✅ Selected: ${shuffledTier[i].name} (Rating: ${shuffledTier[i].twlrating})`);
          }
        }

        const divName = String.fromCharCode(65 + divIndex);
        const avgRating = selectedPlayers.reduce((sum, name) => {
          const player = validPlayers.find(p => p.name === name);
          return sum + (parseInt(player.twlrating) || 0);
        }, 0) / selectedPlayers.length;

        console.log(`    📋 Division ${divName}: ${selectedPlayers.length} players (avg rating: ${Math.round(avgRating)})`);
        divisions.push(selectedPlayers);
      }

      console.log(`✅ Player selection complete!`);
      return divisions;
    } catch (error) {
      console.error(`❌ Error reading player data: ${error.message}`);
      console.error(`Stack trace:`, error.stack);
      process.exit(1);
    }
  }

  // Select random players from the database
  console.log(`🎲 Starting player selection...`);
  const divisions = selectPlayersForTournament(playerDataFile, numDivisions, playersPerDivision);
  console.log(`✅ Player selection complete!`);

  console.log(`🏗️  Creating tournament generator...`);
  const generator = new TournamentGenerator(
    divisions,
    {
      eventName: `Tournament (${numDivisions} Divisions)`,
      eventDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      maxRounds: numRounds,
      outputDir: './generated-tournament',
      playerDataFile: playerDataFile
    }
  );
  console.log(`✅ Tournament generator created!`);

  // Generate the full tournament
  console.log(`🎪 Starting tournament simulation...`);
  generator.simulateFullTournament(numRounds);
  console.log(`✅ Tournament simulation complete!`);

  console.log('\n✅ Tournament files generated successfully!');
  console.log('\n📖 Usage:');
  console.log('  node tools/tournament-generator.js [divisions] [rounds] [player-data.json] [players-per-division]');
  console.log('  divisions: 2-4 (default: 3)');
  console.log('  rounds: number of rounds (default: 7)');
  console.log('  player-data.json: JSON file with player data (required)');
  console.log('  players-per-division: number of players per division (default: 8)');
  console.log('\nExamples:');
  console.log('  node tools/tournament-generator.js 3 7 tools/players.json     # 3 divisions, 7 rounds, 8 players each');
  console.log('  node tools/tournament-generator.js 4 5 tools/players.json 6   # 4 divisions, 5 rounds, 6 players each');
  console.log('  node tools/tournament-generator.js 2 9 tools/players.json 12  # 2 divisions, 9 rounds, 12 players each');
}