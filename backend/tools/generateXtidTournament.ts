#!/usr/bin/env ts-node

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface CrossTablesPlayerSimple {
  playerid: string;
  name: string;
}

interface GeneratedPlayer {
  id: number;
  name: string;
  scores: number[];
  pairings: number[];
  rating: number;
  etc: {
    newr: number[];
    p12: number[];
    xtid?: number[];
  };
  photo: string;
}

interface GeneratedDivision {
  name: string;
  players: (GeneratedPlayer | null)[];
}

interface GeneratedTournament {
  divisions: GeneratedDivision[];
}

class XtidTournamentGenerator {
  private realPlayers: CrossTablesPlayerSimple[] = [];

  async fetchRealPlayers(): Promise<void> {
    console.log('🌐 Fetching real player data from CrossTables...');

    try {
      const response = await axios.get<{players: CrossTablesPlayerSimple[]}>('https://cross-tables.com/rest/players.php?idsonly=1');
      this.realPlayers = response.data.players || [];
      console.log(`✅ Loaded ${this.realPlayers.length} real players from CrossTables`);
    } catch (error) {
      console.error('❌ Failed to fetch real players:', error);
      throw error;
    }
  }

  private getRandomRealPlayer(): CrossTablesPlayerSimple {
    const randomIndex = Math.floor(Math.random() * this.realPlayers.length);
    return this.realPlayers[randomIndex];
  }

  private generateRandomScore(): number {
    // Generate realistic Scrabble scores (200-500 range)
    return Math.floor(Math.random() * 300) + 200;
  }

  private generateRandomRating(): number {
    // Generate realistic ratings (1000-2000 range)
    return Math.floor(Math.random() * 1000) + 1000;
  }

  private generatePlayer(id: number, includeEmbeddedXtid: boolean = true, addXtidToName: boolean = false): GeneratedPlayer {
    const realPlayer = this.getRandomRealPlayer();
    const xtid = parseInt(realPlayer.playerid);

    // Generate name with optional XT suffix
    let playerName = realPlayer.name;
    if (addXtidToName) {
      playerName = `${realPlayer.name}:XT${realPlayer.playerid.padStart(6, '0')}`;
    }

    // Generate some game data (3 rounds)
    const scores = [
      this.generateRandomScore(),
      this.generateRandomScore(),
      this.generateRandomScore()
    ];

    // Generate pairings (will be set properly when we assign all players)
    const pairings = [0, 0, 0]; // Placeholder

    // Generate p12 data (who goes first)
    const p12 = [
      Math.random() < 0.5 ? 1 : 2, // Round 1
      Math.random() < 0.5 ? 1 : 2, // Round 2
      Math.random() < 0.5 ? 1 : 2  // Round 3
    ];

    // Generate rating progression
    const initialRating = this.generateRandomRating();
    const newr = [
      initialRating + Math.floor(Math.random() * 40) - 20, // Round 1 rating change
      initialRating + Math.floor(Math.random() * 40) - 20, // Round 2 rating change
      initialRating + Math.floor(Math.random() * 40) - 20  // Round 3 rating change
    ];

    const player: GeneratedPlayer = {
      id,
      name: playerName,
      scores,
      pairings,
      rating: initialRating,
      etc: {
        newr,
        p12
      },
      photo: `player${id}.jpg`
    };

    // Add embedded xtid if requested (as array format like in xtid-tourney.js)
    if (includeEmbeddedXtid) {
      player.etc.xtid = [xtid];
    }

    return player;
  }

  private assignPairings(players: GeneratedPlayer[]): void {
    // Simple round-robin pairing assignment
    for (let round = 0; round < 3; round++) {
      const availablePlayers = [...players];
      const paired = new Set<number>();

      while (availablePlayers.length >= 2) {
        const player1Index = Math.floor(Math.random() * availablePlayers.length);
        const player1 = availablePlayers[player1Index];
        availablePlayers.splice(player1Index, 1);

        if (paired.has(player1.id)) continue;

        const player2Index = Math.floor(Math.random() * availablePlayers.length);
        const player2 = availablePlayers[player2Index];
        availablePlayers.splice(player2Index, 1);

        if (paired.has(player2.id)) continue;

        // Assign pairings
        player1.pairings[round] = player2.id;
        player2.pairings[round] = player1.id;

        paired.add(player1.id);
        paired.add(player2.id);
      }

      // Handle bye if odd number of players
      for (const player of players) {
        if (!paired.has(player.id)) {
          player.pairings[round] = 0; // Bye
        }
      }
    }
  }

  generateTournament(): GeneratedTournament {
    console.log('🏗️ Generating tournament with embedded xtids...');

    const tournament: GeneratedTournament = {
      divisions: []
    };

    // Create Division 1 - mix of embedded xtids and players without
    console.log('📋 Creating Division 1...');
    const div1Players: (GeneratedPlayer | null)[] = [];

    // Add players with embedded xtids (most players)
    for (let i = 1; i <= 7; i++) {
      const addXtidToName = Math.random() < 0.6; // 60% chance to add XT suffix to name
      const player = this.generatePlayer(i, true, addXtidToName);
      div1Players.push(player);

      if (addXtidToName) {
        console.log(`🎯 Player ${i} (${player.name}) has embedded xtid AND name suffix`);
      } else {
        console.log(`📌 Player ${i} (${player.name}) has embedded xtid but NO name suffix`);
      }
    }

    // Add one player WITHOUT embedded xtid (for fallback testing)
    const playerWithoutXtid = this.generatePlayer(8, false, false);
    div1Players.push(playerWithoutXtid);
    console.log(`⚠️ Player 8 (${playerWithoutXtid.name}) has NO embedded xtid - will test name lookup fallback`);

    this.assignPairings(div1Players.filter(p => p !== null) as GeneratedPlayer[]);

    tournament.divisions.push({
      name: 'Division 1',
      players: div1Players
    });

    // Create Division 2 - smaller division
    console.log('📋 Creating Division 2...');
    const div2Players: (GeneratedPlayer | null)[] = [];

    // Add players with embedded xtids
    for (let i = 9; i <= 11; i++) {
      const addXtidToName = Math.random() < 0.5; // 50% chance
      const player = this.generatePlayer(i, true, addXtidToName);
      div2Players.push(player);

      if (addXtidToName) {
        console.log(`🎯 Player ${i} (${player.name}) has embedded xtid AND name suffix`);
      } else {
        console.log(`📌 Player ${i} (${player.name}) has embedded xtid but NO name suffix`);
      }
    }

    // Add one player WITHOUT embedded xtid (for fallback testing)
    const player12 = this.generatePlayer(12, false, false);
    div2Players.push(player12);
    console.log(`⚠️ Player 12 (${player12.name}) has NO embedded xtid - will test name lookup fallback`);

    this.assignPairings(div2Players.filter(p => p !== null) as GeneratedPlayer[]);

    tournament.divisions.push({
      name: 'Division 2',
      players: div2Players
    });

    return tournament;
  }

  async generate(): Promise<void> {
    await this.fetchRealPlayers();
    const tournament = this.generateTournament();

    // Write to file in the format expected by the system
    const outputContent = `newt = ${JSON.stringify({ divisions: tournament.divisions }, null, 2)};`;
    const outputPath = path.join(__dirname, '..', '__fixtures__', 'xtid-test-tourney.js');

    fs.writeFileSync(outputPath, outputContent);
    console.log(`✅ Generated tournament with embedded xtids at: ${outputPath}`);

    // Print summary
    const totalPlayers = tournament.divisions.reduce((sum, div) => sum + div.players.filter(p => p !== null).length, 0);
    const playersWithXtid = tournament.divisions.reduce((sum, div) =>
      sum + div.players.filter(p => p !== null && p?.etc?.xtid).length, 0
    );
    const playersWithNameSuffix = tournament.divisions.reduce((sum, div) =>
      sum + div.players.filter(p => p !== null && p?.name.includes(':XT')).length, 0
    );

    console.log('📊 Tournament Summary:');
    console.log(`   Total players: ${totalPlayers}`);
    console.log(`   Players with embedded xtid: ${playersWithXtid}`);
    console.log(`   Players with ":XT" name suffix: ${playersWithNameSuffix}`);
    console.log(`   Players needing name lookup: ${totalPlayers - playersWithXtid}`);
  }
}

// Run the generator
async function main() {
  const generator = new XtidTournamentGenerator();
  try {
    await generator.generate();
    console.log('🎉 Tournament generation complete!');
  } catch (error) {
    console.error('💥 Tournament generation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}