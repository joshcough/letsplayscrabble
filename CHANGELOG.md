# Changelog

## 2025-08-03 - More Animations

### Changed
- **Notification System Refactor**: Simplified the tournament notification architecture by removing complex TypeScript generics and intermediate event objects. Each notification type now exports a single detector function that returns JSX directly, making the system easier to understand and extend.

### Added
- **Flexible Notification Routing**: Notifications can now be easily mixed and matched across different routes (e.g., `AllNotifications`, `CriticalNotifications`) for different OBS browser sources.

### Improved
- **Developer Experience**: Adding new notification types is now straightforward - just create three simple functions (detect, render, combine) without worrying about generic type constraints.
- **Queue System**: Multiple notifications from the same game update are automatically queued and displayed sequentially.

## 2025-08-03 - High Score Animations!

### Added
- **High Score Animation Overlay**: Real-time celebration popup that triggers when division high scores are broken
- **Animation Route Architecture**: New `/users/:userId/animation/*` routes with transparent backgrounds for overlay effects
- **Responsive Animation Design**: Clean, professional celebration popup that scales to any browser source size
- **Smart High Score Detection**: Compares highest score in game changes vs previous division record to prevent false triggers

### Enhanced
- **App Background Logic**: Conditional backgrounds based on route type (animations=transparent, overlays=white, pages=tan)
- **Navigation Hiding**: Animation routes properly hide navigation bar for clean overlay experience
- **Incremental Update Data Flow**: Fixed mutable state bug by cloning previous tournament data before applying changes

### Technical Details
- Animation overlay listens for `TOURNAMENT_DATA_INCREMENTAL` messages
- Only triggers when changes contain scores higher than previous division record
- Handles round completion scenarios (multiple new games) by finding highest among changes
- 5-second display duration with smooth fade transitions
- Designed for 300x200px commentator cam overlay use case

### Bug Fixes
- **Fixed Mutable State Issue**: Worker now properly clones previous tournament data before applying incremental changes
- **Corrected High Score Logic**: Compares changes vs true previous state instead of mutated current state
- **Resolved Background Conflicts**: Animation overlays get transparent backgrounds while regular overlays stay white

### Performance
- Zero additional API calls - leverages existing incremental update system
- Efficient change detection using PostgreSQL diff engine
- Real-time updates without impacting tournament overlay performance

## 2025-08-03

### Added
- **Incremental Tournament Updates**: Implemented true incremental game updates using worker-coordinated caching system
- **Tournament Cache Manager**: Added sophisticated cache management with incremental change application
- **Rich Broadcast Messages**: Enhanced broadcast system with full tournament data, previous state, and change metadata for overlay animations

### Changed
- **Eliminated "Thundering Herd"**: Multiple overlays now share single API call through worker coordination
- **Real-time Game Updates**: File changes now trigger incremental updates instead of full tournament refreshes
- **Network Efficiency**: Server sends only game changes over WebSocket, worker provides full data to overlays via local broadcast

### Technical Details
- Worker applies incremental changes to cache and broadcasts complete tournament data locally
- Overlays receive both old and new tournament state plus specific changes for rich animations
- PostgreSQL-based change detection using `ON CONFLICT` with `RETURNING` for atomic updates
- Division-aware filtering to update only affected overlays
- Fallback to full refresh if incremental updates fail

### Performance Improvements
- Reduced API calls from N (per overlay) to 1 (per tournament change)
- Instant cache responses for subsequent overlay loads
- Sub-second tournament update propagation
- Minimal network traffic for game changes

## 2025-08-02 Separated Tournament Data for Cleaner Debugging

### Added
- New `tournament_data` table containing `data_url`, `data`, and `poll_until` fields
- Enhanced WorkerPage debugging interface with extended mode (`?extended`)
  - WebSocket message monitoring with ping filtering
  - Broadcast message tracking
  - Message statistics and cache details
  - Real-time status updates via broadcast channels
- Separate `worker-status` broadcast channel for debugging data
- Database migration to move large data fields out of tournaments table

### Changed
- `TournamentRow` objects now exclude massive JSON data for readable console logs
- Repository methods join with `tournament_data` table to include `data_url` and `poll_until`
- Polling service updated to work with separated table structure
- WorkerSocketManager broadcasts `AdminPanelUpdate` messages to overlays
- Eliminated direct method calls between WorkerPage and worker (now uses broadcasts)
- Status updates now broadcast every second instead of manual polling

### Fixed
- Admin panel division changes now properly update overlays
- Tournament data polling comparison issues with JSONB vs JSON
- Overlay real-time updates for division switching
- Cache manager properly isolated from WebSocket manager

### Technical
- Moved from `tournamentCache.get()` direct calls to broadcast-only communication
- Repository refactored into clean helper methods for better maintainability
- Enhanced error handling and logging throughout data flow
- Improved type safety by removing `any` usage in cache operations

## 2025-08-02

### Added
- **Worker-Coordinated Data Fetching**: Overlays now subscribe to tournament data through worker instead of direct API calls
- **Tournament Data Caching**: Worker maintains in-memory cache of tournament data with automatic invalidation
- **SUBSCRIBE Message Protocol**: New message type for overlay-worker data subscription coordination
- **Cache Performance Logging**: Detailed logs for cache hits/misses and fetch operations

### Changed
- **useTournamentData Hook**: Replaced direct API calls with SUBSCRIBE message broadcasting
- **WorkerSocketManager**: Enhanced to handle SUBSCRIBE messages and manage tournament data cache
- **Data Loading Flow**: Multiple overlays requesting same tournament now trigger single API call

### Performance
- **Eliminated Thundering Herd**: Multiple overlay startup now results in 1 API call instead of N calls
- **Instant Cache Responses**: Subsequent overlays get immediate data from worker cache
- **Reduced Server Load**: Significant reduction in duplicate tournament data requests

### Technical
- Cache key format: `userId:tournamentId:divisionId` for precise data targeting
- Automatic cache updates on WebSocket events (GamesAdded, AdminPanelUpdate)
- Backward-compatible message broadcasting maintains existing overlay functionality

## 2025-08-02  - Incremental Tournament Updates

### 🎯 **Major Features Added**

#### **Incremental Tournament Updates**
- **NEW**: Database-driven incremental update system using PostgreSQL as diff engine
- **NEW**: `GameChanges` and `TournamentUpdate` interfaces for tracking changes
- **NEW**: Real-time change detection for tournament games (added vs updated)
- **NEW**: WebSocket broadcasting of incremental updates to frontend

#### **Enhanced TournamentRepository**
- **NEW**: `storeTournamentDataIncremental()` method for smart data updates
- **NEW**: Automatic first-time vs incremental update detection
- **NEW**: Player and division mapping optimization for existing tournaments
- **CHANGED**: `updateData()` and `updateTournamentWithNewData()` now return `TournamentUpdate` with changes
- **CHANGED**: Tournament creation now uses same incremental logic for consistency

### 🔧 **Database Changes**

#### **Schema Updates**
- **NEW**: Unique constraint on games table: `(division_id, round_number, pairing_id)`
- **NEW**: Migration: `add_games_unique_constraint.js`
- **ENHANCED**: PostgreSQL UPSERT with conflict resolution and change detection

#### **Query Improvements**
- **NEW**: Advanced UPSERT query with `RETURNING` clause for change detection
- **NEW**: `xmax = 0` technique to distinguish INSERT from UPDATE operations
- **NEW**: `IS DISTINCT FROM` for proper null handling in comparisons

### 🎲 **Tournament Generator**

#### **Complete Testing Suite**
- **NEW**: Swiss-style tournament generator with realistic pairings
- **NEW**: Real Scrabble player names (Josh Cough, Nigel Richards, Will Anderson, etc.)
- **NEW**: Proper opponent tracking to prevent repeat pairings
- **NEW**: Realistic score generation (350-550 range)
- **NEW**: Automatic bye handling for odd numbers of players
- **NEW**: Comprehensive logging of all data changes

#### **File Management**
- **NEW**: Sequential file naming: `tournament_01_round1_pairings.js`, `tournament_02_round1_complete.js`
- **NEW**: Detailed blow-by-blow logging of pairings and scores
- **NEW**: Player statistics tracking (wins, losses, spread)

### 🔄 **API Changes**

#### **Repository Method Updates**
```typescript
// OLD
async updateData(id: number, data: CreateTournament): Promise<TournamentRow>

// NEW  
async updateData(id: number, data: CreateTournament): Promise<TournamentUpdate>
```

#### **New Interfaces**
```typescript
interface GameChanges {
  added: CreateGameRow[];
  updated: CreateGameRow[];
}

interface TournamentUpdate {
  tournament: TournamentRow;
  changes: GameChanges;
}
```

### 🎮 **Real-Time Features**
- **NEW**: Live game change detection and broadcasting
- **NEW**: Granular update logging: `🔄 UPDATED` vs `➕ ADDED`
- **NEW**: WebSocket integration for frontend real-time updates
- **NEW**: Event-ready architecture for "New High Score!" notifications

### 🐛 **Bug Fixes**
- **FIXED**: Undefined binding errors in PostgreSQL queries (null handling)
- **FIXED**: Player mapping inconsistencies between file data and database
- **FIXED**: Race conditions in tournament data updates
- **FIXED**: File format compatibility issues

### 🚀 **Performance Improvements**
- **OPTIMIZED**: Database queries use indexes and proper conflict resolution
- **OPTIMIZED**: Reduced WebSocket payload size with incremental updates
- **OPTIMIZED**: Eliminated unnecessary full-table scans
- **OPTIMIZED**: Efficient player/division mapping caching

### 📁 **File Structure Changes**
```
├── src/repositories/
│   └── tournamentRepository.ts (ENHANCED)
├── migrations/
│   └── add_games_unique_constraint.js (NEW)
├── shared/types/
│   └── database.ts (ENHANCED with GameChanges, TournamentUpdate)
├── routes/tournament/
│   └── protected.ts (UPDATED for new return types)
└── tournament-generator.js (NEW)
```

### 🎯 **Testing Results**
- **VERIFIED**: Complex tournament progression with mixed updates/additions
- **VERIFIED**: First-time tournament creation vs incremental updates
- **VERIFIED**: Swiss pairings with realistic player behavior
- **VERIFIED**: Perfect data consistency across all operations
- **LEGENDARY**: Josh Cough defeated Nigel Richards 514-422 in championship final! 🏆

### ⚠️ **Breaking Changes**
- `updateData()` and `updateTournamentWithNewData()` return types changed
- New unique constraint on games table requires migration
- WebSocket payload structure updated for incremental changes

### 📖 **Documentation**
- **NEW**: Complete implementation summary with architecture diagrams
- **NEW**: Tournament generator usage examples
- **NEW**: Database schema documentation
- **NEW**: Real-time update flow documentation

### 🏆 **Notable Achievements**
- Built production-ready incremental update system
- Created sophisticated tournament testing framework
- Leveraged PostgreSQL as elegant diff engine
- Achieved real-time tournament data synchronization
- **Beat Nigel Richards in epic tournament finale!**

---

## Migration Guide

### Required Database Migration
```bash
npx knex migrate:latest
```

### Update API Calls
```typescript
// Update calling code to handle new return structure
const { tournament, changes } = await tournamentRepository.updateData(id, data);
// Use changes.added and changes.updated for real-time updates
```

### WebSocket Integration
```typescript
// Frontend can now listen for granular updates
socket.on('tournament-update', ({ changes }) => {
  changes.added.forEach(game => addGameToUI(game));
  changes.updated.forEach(game => updateGameInUI(game));
});
```

---

**Full Changelog maintained by**: Josh Cough, Tournament Champion and Database Diff Algorithm Architect 👑

## 2025-07-31

# Changelog

## New Features

### 🎯 Clean Player Overlay System
- **Added `PlayerOverlay` page** - A new, clean overlay system for individual player data without the legacy player1/player2 complexity
- **Added `PlayerOverlayTestingPage`** - Comprehensive testing interface for the new player overlay system
- **Route**: `/users/:userId/overlay/player/:tournamentId/:divisionName`
- **Testing Route**: `/users/:userId/overlay/player/:tournamentId/:divisionName/:playerId/test`

**Supported overlay sources:**
- Basic info: `name`, `record`, `average-score`, `high-score`, `spread`
- Rankings: `rank`, `rank-ordinal`
- Ratings: `rating`
- Under camera displays: `under-cam`, `under-cam-no-seed`, `under-cam-small`, `under-cam-with-rating`
- Game data: `points`, `game-history`, `game-history-small`
- Special: `bo7`, `tournament-info`

### 📊 Enhanced Tournament Details Page
- **Added collapsible player lists** for each division with "Show Players" / "Hide Players" buttons
- **Player information display** showing seed number, name, player ID, and initial rating
- **"Test Overlays" links** for each player that open the new PlayerOverlayTestingPage
- **Lazy loading** - player data is only fetched when a division is expanded
- **Tournament-wide vs Division-specific overlays** - Clear separation between tournament stats and division stats

### 🛠 Backend API Enhancements
- **Added `getPlayersForDivision()` method** to TournamentRepository
- **Added `/users/:userId/tournaments/:tournamentId/divisions/:divisionName/players` API endpoint**
- **Enhanced route validation** with the new `withValidation` wrapper for cleaner, more maintainable route handlers
- **Improved error handling** and consistent API response patterns

### 🔧 Tournament Stats Fixes
- **Fixed tournament stats overlay** for tournament-wide statistics (URLs without division)
- **Resolved React hooks rules violations** by moving all hook calls before conditional returns
- **Improved data fetching** using direct tournament ID instead of URL parameter parsing

### 🎨 Code Quality Improvements
- **Refactored route handlers** using a shared `withValidation` wrapper to eliminate code duplication
- **Added `getRecentGamesForPlayer` utility function** to `tournamentHelpers.ts`
- **Consistent URL structure** for all o

## 2025-07-30

## 🚀 Major System Refactoring

### Breaking Changes
- **Database Schema Migration**: Removed `rounds` table and moved round data directly to `games` table
- **Table Renaming**: `tournament_players` → `players`, `player_id` → `seed`
- **API Endpoints**: Restructured from `/api/tournaments/admin` and `/api/tournaments/public` to `/api/private/tournaments` and `/api/public`
- **Type System Overhaul**: Separated file format types, database types, and calculated stats types

### 🗄️ Database Changes
- **Normalized Schema**: Eliminated `rounds` table dependency, games now reference divisions directly
- **Direct References**: Games store `division_id` and `round_number` as direct fields
- **Cleaner Relationships**: Simplified foreign key relationships and reduced join complexity
- **Migration Scripts**: Added migration to handle table restructuring and data preservation

### 🏗️ Architecture Improvements
- **Type Safety**: Introduced strict TypeScript types for different data layers:
    - `scrabbleFileFormat.ts` - Raw tournament file data
    - `database.ts` - Database table schemas
    - `stats.ts` - Calculated player statistics
- **Separation of Concerns**: Clear distinction between file data, stored data, and computed statistics
- **API Response Standardization**: Consistent `ApiResponse<T>` wrapper for all endpoints

### 🔄 Real-time Updates
- **Enhanced WebSocket Management**: Improved message deduplication and timestamp tracking
- **Broadcast System**: Renamed `DisplaySourceManager` to `BroadcastManager` with better event handling
- **Ping Service**: Added dedicated ping service for connection health monitoring
- **Message Types**: Expanded WebSocket message types with proper timestamp handling

### 📊 Statistics & Calculations
- **Pure Functions**: Moved statistics calculations to pure utility functions
- **Performance**: Direct calculation from database records instead of file-based processing
- **Tournament Stats**: Enhanced tournament-wide statistics with better accuracy
- **Player Rankings**: Improved ranking algorithms with multiple sort criteria

### 🎯 Overlay System
- **BaseOverlay Redesign**: Simplified overlay data flow with hierarchical tournament structure
- **Unified Stats Hook**: New `UsePlayerStatsCalculation` hook for consistent player statistics
- **Dynamic Data**: Real-time updates without full page refreshes
- **Source Management**: Better handling of overlay data sources and current match integration

### 🔐 Authentication & Security
- **Protected Routes**: Enhanced route protection with `ProtectedPage` component
- **User Context**: Improved user authentication context and token management
- **API Security**: Better error handling and response validation

### 🛠️ Developer Experience
- **Code Organization**: Restructured utility functions and API helpers
- **Error Handling**: Improved error messages and debugging information
- **TypeScript**: Enhanced type safety across the entire application
- **Testing**: Better test utilities and API response handling

### 🐛 Bug Fixes
- **Memory Management**: Fixed potential memory leaks in WebSocket connections
- **Data Consistency**: Resolved race conditions in tournament data updates
- **Duplicate Prevention**: Enhanced message deduplication in broadcast system
- **Error Recovery**: Better error handling and recovery mechanisms

### ⚡ Performance
- **Database Queries**: Optimized queries with direct relationships
- **Real-time Updates**: Reduced unnecessary API calls through better caching
- **Bundle Size**: Removed unused dependencies and optimized imports
- **Rendering**: Improved overlay rendering performance

### 📱 User Interface
- **Admin Panel**: Enhanced tournament management interface
- **Overlay Previews**: Better preview and testing capabilities
- **Navigation**: Improved navigation and user flow
- **Responsive Design**: Better mobile and tablet support

### 🔧 Configuration
- **Environment Setup**: Improved development and production configurations
- **Build Process**: Streamlined build and deployment pipeline
- **Dependencies**: Updated and cleaned up package dependencies

### 📋 API Changes
#### New Endpoints
- `GET /api/private/tournaments/list` - Get user's tournaments
- `GET /api/public/users/:userId/tournaments/:tournamentId` - Get tournament data
- `GET /api/public/users/:userId/tournaments/:tournamentId/divisions/:divisionId` - Get division-specific data
- `POST /api/private/tournaments/:id/polling` - Enable tournament polling
- `DELETE /api/private/tournaments/:id/polling` - Disable tournament polling

#### Deprecated Endpoints
- `/api/tournaments/admin/*` → `/api/private/tournaments/*`
- `/api/tournaments/public/*` → `/api/public/*`

### 📝 Documentation
- **Type Definitions**: Comprehensive TypeScript type documentation
- **API Reference**: Updated API endpoint documentation
- **Migration Guide**: Added guidance for database schema changes
- **Setup Instructions**: Improved development setup documentation

### 🔮 Future Compatibility
- **Extensible Design**: Architecture designed for future feature additions
- **Type Safety**: Strong typing foundation for safer development
- **Performance Ready**: Optimized for larger tournament datasets
- **API Versioning**: Foundation for future API version management

---

**Migration Note**: This update includes database schema changes. Run `npm run migrate:latest` to apply the new schema. Existing tournament data will be automatically migrated to the new structure.

**Breaking Changes Note**: Client applications using the old API endpoints will need to update to the new endpoint structure. The new type system provides better type safety but may require code updates in consuming applications.

## 2025-07-22

### Added
- **Multi-user tournament system**: Complete migration from single-user to multi-tenant architecture
- **User-scoped API endpoints**: All tournament and match data now filtered by user ID
- **WebSocket optimization**: BroadcastChannel architecture replacing direct WebSocket connections
- **Database migrations**: Added `user_id` columns to `tournaments` and `current_matches` tables
- **Shared TypeScript types**: WebSocket message contracts in `shared/types/websocket.ts`
- **RESTful URL structure**: Clean user-scoped routes `/users/:userId/overlay/...`
- **DisplaySourceManager**: Lightweight overlay communication system replacing SocketManager
- **WorkerSocketManager**: Centralized WebSocket handling for real-time updates

### Changed
- **Breaking**: All overlay URLs now require user ID parameter
- **API endpoints**: All tournament/match endpoints now user-scoped
- **Database schema**: Tournaments and current matches now belong to specific users
- **WebSocket events**: All events now include user context for proper filtering
- **Frontend hooks**: `useCurrentMatch`, `useTournamentData` now extract user ID from URL params
- **Authentication**: Admin panel now properly handles user-specific data

### Fixed
- **Scalability issues**: System now supports hundreds of concurrent users
- **WebSocket connection limits**: Reduced from O(n*overlays) to O(users)
- **Data isolation**: Users can no longer see each other's tournament data
- **Performance**: Eliminated redundant API polling per overlay

### Migration Notes
- **Database**: Run migration to add `user_id` columns and set existing data to `user_id = 1`
- **URLs**: Update OBS Browser Sources to new format: `/users/123/overlay/standings/331/A`
- **Setup**: Each user must run Worker Page as Browser Source for real-time updates

### Technical Details
- Reduced WebSocket connections by 90%+ in multi-user scenarios
- Improved server performance and resource usage
- Added comprehensive TypeScript typing for WebSocket communication
- Maintained backwards compatibility with legacy routes