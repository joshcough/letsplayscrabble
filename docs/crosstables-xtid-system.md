# CrossTables XTID System

This document explains the complete algorithm for handling CrossTables IDs (xtids) throughout the tournament system.

## Overview

The xtid system connects tournament players to their CrossTables.com profiles, enabling rich overlays with player stats, ratings, photos, and head-to-head records. The system handles multiple xtid sources and gracefully falls back to name-based lookup when embedded IDs are missing.

---

## Phase 1: Tournament File Format (Input)

Players in tournament files can have xtids in **two places**:

1. **`etc.xtid` field**: Embedded array like `[17175]` or single number `17175`
2. **Name suffix**: Like `"Tunnicliffe, Matthew:XT017175"`

### Helper Functions (`backend/src/utils/xtidHelpers.ts`)

- **`extractXtidFromEtc(xtidValue)`** - Extracts from `etc.xtid` field (handles both arrays and numbers)
- **`extractXtidFromPlayerName(name)`** - Extracts xtid from `:XT######` suffix
- **`stripXtidFromPlayerName(name)`** - Removes `:XT######` suffix to get clean name
- **`getBestXtid(name, etcXtid)`** - Gets best available xtid with priority:
  1. `etc.xtid` first (most reliable)
  2. Name suffix second (fallback)
  3. `null` if neither exists

**Example:**
```typescript
// Input variations:
player1 = {
  name: "Nigel Richards",
  etc: { xtid: [6003] }
}
// getBestXtid() → 6003

player2 = {
  name: "Joey Krafchick:XT017589",
  etc: {}
}
// getBestXtid() → 17589

player3 = {
  name: "Unknown Player",
  etc: {}
}
// getBestXtid() → null (needs name lookup)
```

---

## Phase 2: CrossTables Sync (Before Tournament Creation)

When a tournament is loaded, **`CrossTablesSyncService.syncPlayersFromTournament()`** runs to populate the global `cross_tables_players` table.

### Step 1 - Player Analysis (`analyzeTournamentPlayers`)

Scans all players in the tournament file and separates them into two groups:

1. **Embedded xtids**: Players with `etc.xtid` → extract immediately
2. **Players without xtids**: Players without `etc.xtid` → need name-based lookup

**Example Output:**
```
📊 Tournament analysis: 56 embedded xtids, 2 players without xtids
📌 Found embedded xtid 6003 for player "Nigel Richards:XT006003"
📌 Found embedded xtid 17589 for player "Joey Krafchick:XT017589"
🔍 Player "Orry Swift" needs xtid lookup
🔍 Player "Carol Robbins" needs xtid lookup
```

**Note:** The `:XT` suffix is stripped from names during this phase to get clean names for lookup.

### Step 2 - Name-Based Discovery (`discoverXtidsForPlayers`)

For players without embedded xtids:

1. **Fetches complete CrossTables player list** (21,527+ players with IDs and names)
   ```
   GET https://cross-tables.com/rest/allplayersidsonly.php
   ```

2. **For each player needing lookup:**
   - Strip `:XT` suffix if present
   - Convert name format: `"Last, First"` → `"First Last"`
   - Try exact match first
   - Fall back to case-insensitive match
   - **Only accept if exactly 1 match found** (avoids ambiguity)

3. **Returns discovered xtids**

**Example:**
```
🔄 Converting "Orry Swift" to "Orry Swift" for matching
✅ Matched "Orry Swift" to xtid 451

🔄 Converting "Carol Robbins" to "Carol Robbins" for matching
✅ Matched "Carol Robbins" to xtid 20984

✅ Discovered 2 additional xtids from name matching
```

**Edge Cases:**
- Multiple matches → skip (ambiguous)
- No matches → skip (player not in CrossTables)
- Name format mismatches → try both formats

### Step 3 - Fetch CrossTables Data (`fetchAndStorePlayerData`)

Takes all xtids (embedded + discovered) and fetches their CrossTables data:

1. **Batch API calls** (50 players at a time):
   ```
   GET https://cross-tables.com/rest/players.php?p=6003+17589+19535+...
   ```

2. **Stores in `cross_tables_players` table** with clean names (no `:XT` suffix):
   ```sql
   INSERT INTO cross_tables_players (
     cross_tables_id,
     name,
     rating,
     wins,
     losses,
     ties,
     spread,
     -- ... other fields
   ) VALUES (6003, 'Nigel Richards', 2170, 1447, 341, 21, +76234, ...)
   ON CONFLICT (cross_tables_id) DO UPDATE ...
   ```

3. **Fallback**: If batch fails, fetch players individually with delays

**Rate Limiting:**
- 1 second delay between batches
- 200ms delay between individual fetches

### Step 4 - Optional Detailed Data (`syncDetailedPlayerData`)

Fetches complete tournament history for each player (one by one):

```
GET https://cross-tables.com/annotate.php?u=6003
```

Stores detailed results in the same `cross_tables_players` table:
- Complete tournament history (results JSON)
- Performance trends
- Historical ratings
- Used for detailed player overlays

**Rate Limiting:**
- 500ms delay between requests

---

## Phase 3: Tournament Creation (Database Insertion)

**`fileToDatabaseConversions.ts`** converts tournament file → database records.

### Player Conversion Logic

1. **Extract and validate xtids:**
   ```typescript
   // For each player:
   const xtid = getBestXtid(player.name, player.etc?.xtid);
   const cleanName = stripXtidFromPlayerName(player.name);

   // Validate xtid exists in cross_tables_players
   const existingPlayers = await crossTablesRepo.getPlayers(allXtids);
   const validXtids = new Set(existingPlayers.map(p => p.cross_tables_id));

   // Only set xtid if validated
   const safeXtid = validXtids.has(xtid) ? xtid : null;
   ```

2. **Create player record in `players` table:**
   ```sql
   INSERT INTO players (
     tournament_id,
     division_id,
     seed,
     name,                    -- Clean name (no :XT suffix)!
     initial_rating,
     xtid,                    -- Foreign key to cross_tables_players
     etc_data                 -- Original data preserved
   ) VALUES (
     119,
     209,
     1,
     'Nigel Richards',        -- Cleaned!
     2170,
     6003,                    -- Validated FK
     '{"xtid":[6003],"p12":[1,2,...]}'
   )
   ```

**Key Design Decision:** Only store validated xtids to prevent broken foreign key constraints. If an xtid doesn't exist in `cross_tables_players`, store `NULL` instead.

### Game Conversion

Games are created from player pairings using the `p12` field to determine player order:
- `p12[round] = 1` → player went first
- `p12[round] = 2` → player went second
- `p12[round] = 0` → bye

---

## Phase 4: Post-Creation Mapping Update

**`CrossTablesSyncService.updateTournamentPlayerXtids()`** runs after tournament creation to update any missing xtids.

**Purpose:** Some players might have gotten their xtids from name lookup during the sync phase. Since they weren't embedded in the tournament file, their `players.xtid` field might be `NULL`. This step fills in those gaps.

### Algorithm

1. **For each player in tournament file:**
   ```typescript
   // Strip :XT suffix from name (IMPORTANT!)
   const cleanName = stripXtidFromPlayerName(player.name);

   // Look up in cross_tables_players by clean name
   const crossTablesPlayer = await repo.findByName(cleanName);

   if (crossTablesPlayer) {
     nameToXtidMap.set(player.name, crossTablesPlayer.cross_tables_id);
   }
   ```

2. **Bulk update player records:**
   ```sql
   UPDATE players
   SET xtid = ?
   WHERE tournament_id = ? AND name = ?
   ```

**Bug Note:** This phase initially failed to strip `:XT` suffixes before lookup, causing players like `"Nigel Richards:XT006003"` to not match `"Nigel Richards"` in the database. This was fixed by adding `stripXtidFromPlayerName()` before the lookup.

**Example Output:**
```
🔗 Mapped Nigel Richards:XT006003 (seed 1) -> xtid 6003
🔗 Mapped Joey Krafchick:XT017589 (seed 2) -> xtid 17589
🔗 Mapped Orry Swift (seed 28) -> xtid 451
🔗 Mapped Carol Robbins (seed 30) -> xtid 20984
```

---

## Phase 5: Head-to-Head Data Sync (Optional)

**`CrossTablesHeadToHeadService.syncHeadToHeadForDivision()`** fetches historical matchups between players in each division.

### Algorithm

For each division with players that have xtids:

1. **Single bulk API call with all xtids:**
   ```
   GET https://cross-tables.com/rest/headtohead.php?players=6003+17589+19535+20032+...
   ```

2. **Store results in `cross_tables_head_to_head` table:**
   ```sql
   INSERT INTO cross_tables_head_to_head (
     player1_xtid,
     player2_xtid,
     player1_name,
     player2_name,
     player1_score,
     player2_score,
     tournament_name,
     game_date,
     lexicon
   ) VALUES (6003, 17589, 'Nigel Richards', 'Joey Krafchick', 459, 423, 'Lake George', '2023-09-15', 'NWL')
   ```

3. **Use for "Previous Meetings" overlay**

**Example Output:**
```
🔄 Syncing head-to-head data for 27 players: 6003, 17589, 19535, ...
📊 API Response: Found 3296 games for players
✅ Stored/updated 3296 head-to-head games
```

**Performance:** Much more efficient than calling the API once per player pair (27 players → 1 API call instead of 351 calls).

---

## Phase 6: Frontend/Overlay Usage

### API Endpoints

Backend endpoints serve tournament data with CrossTables joins:

```sql
-- Get player with CrossTables data
SELECT
  p.id,
  p.name,
  p.seed,
  p.initial_rating,
  p.xtid,
  ct.rating AS current_rating,
  ct.wins,
  ct.losses,
  ct.ties,
  ct.spread,
  ct.photo_url,
  ct.results AS tournament_history
FROM players p
LEFT JOIN cross_tables_players ct
  ON p.xtid = ct.cross_tables_id
WHERE p.tournament_id = ? AND p.division_id = ?
ORDER BY p.seed
```

### OBS Overlays

Overlays fetch enriched player data to display:

- **Basic stats**: Rating, record (W-L-T), spread
- **Photo URLs**: Player photos (if available in CrossTables)
- **Tournament history**: Past performance, trends
- **Head-to-head records**: "These players have met 12 times, Richards leads 8-4"

**Example Overlay Data:**
```json
{
  "player": {
    "name": "Nigel Richards",
    "seed": 1,
    "xtid": 6003,
    "crossTables": {
      "rating": 2170,
      "record": "1447-341-21",
      "spread": 76234,
      "photoUrl": "https://cross-tables.com/pix/nigel_richards.jpg",
      "recentTournaments": [...]
    }
  }
}
```

---

## Complete Flow Diagram

```
┌──────────────────────┐
│  Tournament File     │
│  (tourney.js)        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  [Phase 2] CrossTables Sync              │
│  (Before tournament creation)            │
├──────────────────────────────────────────┤
│  1. Analyze Players                      │
│     ├─ Extract embedded xtids            │
│     └─ Identify players needing lookup   │
│                                          │
│  2. Discover Missing XTIDs               │
│     ├─ Fetch all CrossTables players     │
│     ├─ Match by name (Last,First → First Last) │
│     └─ Return discovered xtids           │
│                                          │
│  3. Fetch CrossTables Data               │
│     ├─ Basic profile (batches of 50)    │
│     ├─ Detailed history (optional)       │
│     └─ Store in cross_tables_players     │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  [Phase 3] Create Tournament             │
├──────────────────────────────────────────┤
│  ├─ Validate xtids exist in DB           │
│  ├─ Clean player names (strip :XT)       │
│  └─ Insert into players table with xtid  │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  [Phase 4] Update Player XTIDs           │
├──────────────────────────────────────────┤
│  ├─ Map file players → cross_tables      │
│  └─ Update players.xtid for matched      │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  [Phase 5] Sync Head-to-Head (optional)  │
├──────────────────────────────────────────┤
│  └─ Store inter-player game history      │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  [Phase 6] Overlays Use Data             │
├──────────────────────────────────────────┤
│  └─ JOIN players with cross_tables_players │
└──────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Two-Phase Xtid Discovery
- **Embedded IDs** avoid unnecessary API calls (fast path)
- **Name lookup** handles missing IDs gracefully (fallback)

### 2. Clean Names Everywhere
- `:XT` suffixes are **always stripped** before database storage
- Prevents mismatches during lookups
- Keeps data clean and consistent

### 3. Xtid Validation
- Only store xtids that exist in `cross_tables_players`
- Prevents broken foreign key constraints
- Gracefully handles invalid/stale IDs

### 4. Batch Optimization
- Fetch 50 players at once (not one-by-one)
- Reduces API calls from 58 → 2 for typical tournament
- Respects rate limits with delays

### 5. Global Player Cache
- `cross_tables_players` table shared across **all tournaments**
- Once fetched, player data is reused
- Reduces redundant API calls over time

### 6. Graceful Degradation
- Players without xtids still work in tournaments
- Just no CrossTables data in overlays
- System never blocks tournament creation

### 7. Name Matching Strategy
- Handles both "First Last" and "Last, First" formats
- Requires **exactly 1 match** to avoid ambiguity
- Falls back to case-insensitive matching

---

## Database Schema

### `cross_tables_players` (Global Cache)

```sql
CREATE TABLE cross_tables_players (
  cross_tables_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  rating INTEGER,
  wins INTEGER,
  losses INTEGER,
  ties INTEGER,
  spread INTEGER,
  photo_url TEXT,
  results JSON,  -- Detailed tournament history
  last_updated TIMESTAMP,
  -- ... other fields
);
```

### `players` (Tournament-Specific)

```sql
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  division_id INTEGER NOT NULL,
  seed INTEGER NOT NULL,
  name TEXT NOT NULL,  -- Clean name, no :XT suffix
  initial_rating INTEGER,
  xtid INTEGER,  -- Foreign key to cross_tables_players
  etc_data JSON,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (division_id) REFERENCES divisions(id),
  FOREIGN KEY (xtid) REFERENCES cross_tables_players(cross_tables_id)
);
```

### `cross_tables_head_to_head`

```sql
CREATE TABLE cross_tables_head_to_head (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1_xtid INTEGER NOT NULL,
  player2_xtid INTEGER NOT NULL,
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  player1_score INTEGER,
  player2_score INTEGER,
  tournament_name TEXT,
  game_date TEXT,
  lexicon TEXT,
  FOREIGN KEY (player1_xtid) REFERENCES cross_tables_players(cross_tables_id),
  FOREIGN KEY (player2_xtid) REFERENCES cross_tables_players(cross_tables_id)
);
```

---

## Common Issues and Fixes

### Issue 1: Players Not Matching After Sync

**Symptom:**
```
⚠️  No CrossTables data found for Nigel Richards:XT006003 (seed 1)
```

**Cause:** Tournament file has names with `:XT######` suffix, but database has clean names.

**Fix:** Strip suffix before lookup in `updateTournamentPlayerXtids()`:
```typescript
const cleanName = stripXtidFromPlayerName(player.name);
const crossTablesPlayer = await this.repo.findByName(cleanName);
```

### Issue 2: Name Format Mismatches

**Symptom:**
```
❌ No matches found for "Smith, John"
```

**Cause:** Tournament file has "Last, First" but CrossTables has "First Last".

**Fix:** Convert format before matching:
```typescript
if (name.includes(', ')) {
  const [last, first] = name.split(', ');
  convertedName = `${first.trim()} ${last.trim()}`;
}
```

### Issue 3: Duplicate Player Ambiguity

**Symptom:**
```
⚠️ Found 3 matches for "John Smith" - skipping ambiguous match
```

**Cause:** Multiple CrossTables players with same name.

**Fix:** Cannot auto-resolve. Requires manual intervention or embedded xtid in tournament file.

### Issue 4: Foreign Key Constraint Violations

**Symptom:**
```
FOREIGN KEY constraint failed on players.xtid
```

**Cause:** Trying to insert xtid that doesn't exist in `cross_tables_players`.

**Fix:** Validate xtids before insertion:
```typescript
const validXtids = await crossTablesRepo.getPlayers(allXtids);
const safeXtid = validXtids.has(xtid) ? xtid : null;
```

---

## Testing Notes

### Tournament Generator Behavior

The `tournament-generator.js` tool adds `:XT######` suffixes to player names for testing:

```javascript
// Example generated player:
{
  name: "Nigel Richards:XT006003",
  etc: { xtid: [6003] }
}
```

**Last player per division** intentionally has **no xtid** to test fallback lookup:

```javascript
// Division A player 28:
{
  name: "Orry Swift",  // No :XT suffix
  etc: {}              // No xtid
}
```

This ensures the name-based lookup code path is always exercised.

---

## Future Improvements

1. **Caching**: Store name→xtid mappings to avoid repeated bulk lookups
2. **Fuzzy Matching**: Handle typos/variations in player names
3. **Photo Fetching**: Download and serve photos locally (avoid external dependencies)
4. **Background Sync**: Update player data periodically without blocking tournaments
5. **Admin Override**: UI for manually mapping ambiguous players to xtids

---

## Related Files

- `backend/src/utils/xtidHelpers.ts` - Core helper functions
- `backend/src/services/crossTablesSync.ts` - Main sync orchestration
- `backend/src/services/fileToDatabaseConversions.ts` - Tournament creation
- `backend/src/services/crossTablesClient.ts` - API client
- `backend/src/repositories/crossTablesPlayerRepository.ts` - Database operations
- `tools/tournament-generator.js` - Test data generation
