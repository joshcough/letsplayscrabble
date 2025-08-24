cat > tools/README.md << EOF
# Tournament Tools

## Tournament Generator

Generates realistic Scrabble tournament files using actual player data.

### Usage
\`\`\`bash
# From project root
node tools/tournament-generator.js [divisions] [rounds] [player-data.json] [players-per-division]
\`\`\`

### Examples
\`\`\`bash
# 3 divisions, 7 rounds, 8 players each
node tools/tournament-generator.js 3 7 tools/players.json

# 4 divisions, 5 rounds, 6 players each
node tools/tournament-generator.js 4 5 tools/players.json 6
\`\`\`

### Output
Generates tournament files in \`./generated-tournament/\` directory.
EOF