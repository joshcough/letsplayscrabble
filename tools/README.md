# Tournament Tools

## Tournament Generator

Generates realistic Scrabble tournament files using actual player data.

### Usage
```bash
# From project root
node tools/tournament-generator.js [divisions] [rounds] [player-data.json] [players-per-division] [flags...]
```

### Parameters
- `divisions`: Number of divisions (2-4 for random, 1 for custom, default: 3)
- `rounds`: Number of rounds (default: 7)
- `player-data.json`: JSON file with player data (required)
- `players-per-division`: Number of players per division (default: 8, ignored with --custom-players)
- `--no-xt-ids`: Exclude cross-tables IDs from generated files (optional, for testing enrichment)
- `--custom-players file.txt`: Use specific players from file (requires divisions=1)

### Examples
```bash
# 3 divisions, 7 rounds, 8 players each (with xt-ids)
node tools/tournament-generator.js 3 7 tools/players.json

# 4 divisions, 5 rounds, 6 players each
node tools/tournament-generator.js 4 5 tools/players.json 6

# Generate tournament without xt-ids (for testing cross-tables enrichment)
node tools/tournament-generator.js 3 7 tools/players.json 8 --no-xt-ids

# Generate tournament with custom players from file
node tools/tournament-generator.js 1 7 tools/players.json 8 --custom-players my-players.txt

# Custom players with no xt-ids (for testing enrichment with specific players)
node tools/tournament-generator.js 1 7 tools/players.json 8 --custom-players my-players.txt --no-xt-ids
```

### Custom Players File Format
Create a text file with one player name per line in "Last, First" format:
```
Smith, John
Doe, Jane
Johnson, Bob
Richards, Nigel
```

### Cross-Tables Integration
By default, the generator includes cross-tables IDs (`xtid`) in the `player.etc.xtid` field when player data is available. Use the `--no-xt-ids` flag to exclude these IDs and test the automatic cross-tables enrichment system that looks up missing player IDs.

### Output
Generates tournament files in `./tools/generated-tournament/` directory.