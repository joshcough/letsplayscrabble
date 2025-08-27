# Tournament Tools

## Tournament Generator

Generates realistic Scrabble tournament files using actual player data.

### Usage
```bash
# From project root
node tools/tournament-generator.js [divisions] [rounds] [player-data.json] [players-per-division] [--no-xt-ids]
```

### Parameters
- `divisions`: Number of divisions (2-4, default: 3)
- `rounds`: Number of rounds (default: 7)
- `player-data.json`: JSON file with player data (required)
- `players-per-division`: Number of players per division (default: 8)
- `--no-xt-ids`: Exclude cross-tables IDs from generated files (optional, for testing enrichment)

### Examples
```bash
# 3 divisions, 7 rounds, 8 players each (with xt-ids)
node tools/tournament-generator.js 3 7 tools/players.json

# 4 divisions, 5 rounds, 6 players each
node tools/tournament-generator.js 4 5 tools/players.json 6

# Generate tournament without xt-ids (for testing cross-tables enrichment)
node tools/tournament-generator.js 3 7 tools/players.json 8 --no-xt-ids
```

### Cross-Tables Integration
By default, the generator includes cross-tables IDs (`xtid`) in the `player.etc.xtid` field when player data is available. Use the `--no-xt-ids` flag to exclude these IDs and test the automatic cross-tables enrichment system that looks up missing player IDs.

### Output
Generates tournament files in `./generated-tournament/` directory.