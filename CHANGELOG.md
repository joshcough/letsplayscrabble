# Changelog

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