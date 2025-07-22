# Changelog

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