# Tournament Overlay System Architecture Goals

## Current State vs Vision

### Current Architecture (Working but Inefficient)

```
Admin Panel → WebSocket → Worker → API Call → Full Tournament Data
                          ↓
                     BroadcastChannel
                          ↓
                     100 Overlays

Overlay Startup → 100 API Calls → Same Tournament Data x100

File Change → Nuke Entire DB → Refetch Everything → Send Full Tournament
```

**Problems:**
- 100 overlays = 100 API calls on startup (thundering herd)
- File changes trigger complete DB overwrites
- Full tournament refetches for single game updates
- No real-time granular updates
- Overlays have direct API access (not controlled)

### Target Architecture (Efficient & Real-time)

```
Admin Panel → WebSocket → Worker → DataManager Singleton
                                        ↓
                                  Smart Cache + Request Deduplication
                                        ↓
100 Overlays → Subscribe to DataManager → Single API Call → Shared Data

File Change → Detect Game Diffs → Incremental DB Updates → GameAdded/GameUpdated Events
                                                               ↓
                                                    Update In-Memory Tournament
                                                               ↓
                                                     Broadcast Updated State
                                                               ↓
Rich Events → HighScoreAchieved/GameCompleted → Overlay Animations/Popups
```

## Goal 1: Eliminate Thundering Herd with DataManager

### Problem Statement
Currently, when 100 overlays start up, they each make individual API calls for the same tournament data, overwhelming the server with identical requests.

### Solution: Centralized DataManager

**DataManager Responsibilities:**
- Single source of truth for all tournament data
- Request deduplication (multiple requests for same data = 1 API call)
- Smart caching with cache invalidation
- Subscription-based data access for overlays
- Only component allowed to make API calls

**Implementation Strategy:**
```typescript
interface DataManager {
  // Subscribe to tournament data
  subscribeTo(tournamentId: number, divisionId?: number): Observable<Tournament>
  
  // Request data (with deduplication)
  getTournamentData(tournamentId: number, divisionId?: number): Promise<Tournament>
  
  // Update cache from broadcasts
  updateCache(tournamentId: number, data: Tournament): void
  
  // Invalidate cache
  invalidateCache(tournamentId: number): void
}
```

**Overlay Changes:**
- Remove all direct `fetchTournament` calls
- Replace `useTournamentData` with `useDataManager`
- Subscribe to needed data via DataManager
- Receive data through subscription callbacks

**Benefits:**
- Startup: 1 API call instead of 100
- Guaranteed data consistency across overlays
- Clean separation of concerns
- Controlled data access

### Example Usage
```typescript
// Current (bad)
const { tournamentData } = useTournamentData({ tournamentId: 20 })

// Target (good)
const tournamentData = useDataManager().subscribe(20, 61)
```

## Goal 2: Incremental Game Updates

### Problem Statement
Currently, when scrabble data files change:
1. Entire database gets nuked and rebuilt
2. Frontend refetches entire tournament (838 games)
3. No granular real-time updates
4. No ability to show game-specific events (high scores, completions)

### Solution: Incremental Update System

**Game Diff Algorithm:**
```typescript
interface GameDiff {
  added: GameRow[]
  updated: GameRow[]
  removed: GameRow[]
}

function calculateGameDiff(
  oldTournament: Tournament, 
  newFileData: any
): GameDiff {
  // Compare game arrays, detect changes
  // Return only what changed
}
```

**Event-Driven Updates:**
```typescript
// Rich WebSocket events
interface GameAddedEvent {
  type: 'GameAdded'
  tournamentId: number
  divisionId: number
  game: GameRow
  metadata: {
    isHighScore?: boolean
    isUpset?: boolean
    completesRound?: boolean
  }
}

interface GameUpdatedEvent {
  type: 'GameUpdated'
  tournamentId: number
  divisionId: number
  game: GameRow
  changes: Partial<GameRow>
}
```

**In-Memory Tournament Updates:**
```typescript
function applyGameUpdate(tournament: Tournament, event: GameAddedEvent): Tournament {
  // Find correct division
  // Add/update game in games array
  // Maintain referential integrity
  // Return updated tournament
}
```

**Backward Compatibility:**
- Existing overlays continue to work unchanged
- They still receive full `TOURNAMENT_DATA` broadcasts
- New overlays can opt into granular events for special features

### Data Flow
```
File System → Server (calculate game diff) → Server (update DB incrementally)
                                                    ↓
                                          Worker (GameAdded event)
                                                    ↓
                                    DataManager (update in-memory tournament)
                                                    ↓
                                 DataManager (apply game to tournament state)
                                                    ↓
                              Overlays (broadcast TOURNAMENT_DATA - full state)
                                                    ↓
                                Worker → Overlays (GameAdded event for animations)
```

## Implementation Phases

### Phase 1: DataManager (Eliminate Startup Thundering Herd)
1. Create DataManager singleton
2. Implement request deduplication
3. Add subscription system
4. Replace `useTournamentData` with `useDataManager`
5. Remove direct API access from overlays

### Phase 2: Incremental Updates (Real-time Granular Updates)
1. Build game diff algorithm
2. Implement incremental DB updates
3. Create rich WebSocket events
4. Add in-memory tournament state management
5. Build overlay features (popups, animations)

### Phase 3: Advanced Features
1. High score detection and alerts
2. Round completion notifications
3. Upset detection (lower-rated player wins)
4. Real-time leaderboard animations
5. Game completion streaks

## Success Metrics

**Performance:**
- Startup API calls: 100 → 1
- Update payload size: 838 games → 1 game
- Update latency: ~2s (full refetch) → ~50ms (incremental)

**Features:**
- Real-time game completion notifications
- High score alerts with player details
- Smooth leaderboard updates
- Rich overlay animations

**Architecture:**
- Clean separation of data fetching vs consumption
- Scalable to 1000+ overlays
- Event-driven real-time updates
- Backward compatible with existing overlays

## Current Tournament Type (Perfect for Diffs)
```typescript
export interface Tournament {
  tournament: TournamentRow;
  divisions: {
    division: DivisionRow;
    players: PlayerRow[];
    games: GameRow[];  // Easy to diff and merge
  }[];
}
```

This structure makes it straightforward to:
- Find games by ID for updates
- Add new games to the correct division
- Calculate diffs between tournament states
- Maintain data consistency

---

*This architecture transforms the overlay system from a simple display
layer into a rich, real-time tournament experience while maintaining 
clean separation of concerns and eliminating performance bottlenecks.*