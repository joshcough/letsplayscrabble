# Changelog

## 2025-09-06 - Overlay Structure Consolidation & File Organization

### 🧹 **Major File Structure Cleanup**

#### **Overlay Directory Reorganization**
- **REMOVED**: `/pages/overlay/original/` directory and all original overlay files
- **MOVED**: All modern overlay files from `/pages/overlay/modern/` to `/pages/overlay/`
- **RENAMED**: All `*ModernOverlayPage.tsx` files to `*OverlayPage.tsx` (removed "Modern" naming)
- **UNIFIED**: Single overlay directory structure - no more modern/original split

#### **Navigation & Routes Simplified**
- **REMOVED**: "Original Overlays" link from navigation menu
- **UPDATED**: `/overlays` page now shows unified overlay listing without "Modern" branding
- **RESTORED**: `MiscOverlayTestingPage` for testing misc overlay sources
- **FIXED**: All overlay routes now use clean paths without subdirectories

#### **Import Path Corrections**
- **FIXED**: All import paths updated from `../../../` to `../../` after directory restructure
- **RESOLVED**: Build compilation errors from incorrect relative imports
- **RESTORED**: Original misc overlay functionality (replaced modern version that was broken for OBS)

#### **Breaking Changes**
- **REMOVED**: All original overlay routes (`*_original`) - only current overlays remain
- **SIMPLIFIED**: Overlay navigation now shows single set of overlays instead of modern/original split

### 🎯 **User Impact**
- **CLEANER**: Simplified overlay selection without confusing modern/original choices
- **WORKING**: All overlay functionality preserved and working correctly
- **COMPATIBLE**: OBS compatibility maintained through proper misc overlay restoration

## 2025-08-30 - Modern Overlays Are Now Default & Theme System Implementation

### 🚀 **Modern Overlays Made Default**

#### **URL Structure Changes**
- **MAJOR**: Modern overlays are now the official overlays using standard URLs:
  - `/users/:userId/overlay/standings` (was `standings_modern`)
  - `/users/:userId/overlay/rating_gain` (was `rating_gain_modern`) 
  - `/users/:userId/overlay/head_to_head` (was `head_to_head_modern`)
  - All content overlays now use clean URLs without `_modern` suffix

#### **OBS Compatibility Preserved** 
- **PRESERVED**: Misc and Player overlays remain as original versions by default for OBS integration
  - `/users/:userId/overlay/misc` - keeps white boxes with black text for OBS
  - `/users/:userId/overlay/player` - keeps original OBS-compatible design
  - Modern versions available at `misc_modern` and `player_modern` for those who want theming

#### **Original Overlays Moved**
- **MOVED**: Original overlays now available with `_original` suffix:
  - `/users/:userId/overlay/standings_original` (was `standings`)
  - `/users/:userId/overlay/rating_gain_original` (was `rating_gain`)
  - All original overlays preserve backward compatibility

#### **Navigation Updates**
- **UPDATED**: `/overlays` now shows modern overlays (the new default)
- **ADDED**: `/overlays/original` shows original overlays listing
- **FIXED**: Navigation menu updated to reflect new structure

## 2025-08-30 - Modern Overlay Theme System & Text Visibility Fixes

### 🎨 **Modern Overlay Theme System**

#### **Dynamic Theme Support**
- **NEW**: Complete theme system for all modern overlays with scrabble, modern, and july4 themes
- **NEW**: User settings page for theme selection with real-time preview
- **NEW**: Database-backed theme persistence per user
- **ENHANCED**: BaseModernOverlay component provides centralized theme distribution
- **IMPROVED**: All 14 modern overlay pages now support dynamic theming

#### **Scrabble Theme Implementation**
- **NEW**: Warm beige/brown scrabble theme matching main site design (#E4C6A0, #4A3728, #FAF1DB)
- **DEFAULT**: Scrabble theme is now the default theme for all users
- **FIXED**: Text visibility issues - replaced hardcoded `text-white` with theme-aware colors
- **IMPROVED**: Table headers, cell content, and information boxes now readable on light backgrounds
- **ENHANCED**: Tournament names, division names, and overlay descriptions use proper contrast colors

#### **Theme Architecture**
- **NEW**: Theme type definitions with comprehensive color palettes
- **NEW**: Theme utility functions for consistent class generation
- **NEW**: User settings API endpoints for theme preference storage
- **REFACTORED**: All overlay components to accept theme parameters in renderCell functions
- **STANDARDIZED**: Consistent theme color usage across modern/scrabble/july4 themes

#### **Text Readability Improvements**
- **FIXED**: Rating gain table columns (Old Rating, Wins, Losses, Ties) now use dark colors
- **FIXED**: High score columns changed from light yellow to theme primary text
- **FIXED**: Average points columns use theme colors instead of hardcoded light green
- **FIXED**: Information boxes on overlay listing page use proper theme backgrounds and text
- **REMOVED**: Gradient backgrounds from top 3 table rows (trophies provide sufficient distinction)

## 2025-08-29 - Cross-Tables API Optimization & Enhanced Overlays

### 🚀 **Cross-Tables API Performance**

#### **Bulk Head-to-Head API Integration**
- **OPTIMIZED**: Replace multiple API calls with single bulk endpoint for head-to-head data
- **PERFORMANCE**: Reduced API calls from n*(n-1)/2 to just 1 for division head-to-head sync
- **NEW**: Tournament names now displayed in overlays instead of generic "Tournament" text
- **ENHANCED**: Database schema updated to store tournament names from cross-tables data
- **IMPROVED**: API logging shows concise summaries instead of verbose JSON output

#### **Backend Architecture Improvements**
- **REFACTORED**: `CrossTablesHeadToHeadService` to use new bulk endpoint accepting multiple player IDs
- **REMOVED**: `fetchHeadToHeadForPair` method (no longer needed)
- **ADDED**: `tourneyname` field to `HeadToHeadGame` interface and database schema
- **MIGRATION**: Added database migration for `tourney_name` column in head-to-head data

### 🎨 **Enhanced Overlay Styling**

#### **Head-to-Head Modern Overlay Redesign**
- **IMPROVED**: Replaced monotone gray styling with cohesive blue theme
- **ENHANCED**: Lighter blue accents create better contrast against dark background
- **ADDED**: Purple/pink gradient VS button as striking accent color
- **REFINED**: Subtle blue glows and borders for visual depth without distraction
- **REMOVED**: Going First/Second statistics sections for cleaner layout
- **RESULT**: More engaging and professional overlay appearance for streaming

### 🔧 **Tournament Management**

#### **Default Polling Configuration**
- **NEW**: New tournaments automatically enable polling for 4 days from creation
- **IMPROVED**: Users no longer need to manually enable polling for ongoing tournaments
- **ARCHITECTURE**: Polling logic properly separated in API endpoints (not in pure conversion functions)

### 🐛 **Bug Fixes**
- **FIXED**: Tournament name display in head-to-head overlays now uses actual tournament names
- **RESOLVED**: Color harmony issues in overlay themes

### ✨ **User Experience Improvements**
- **ENHANCED**: Head-to-head overlay now displays current tournament ratings under player names
- **IMPROVED**: Games table layout with centered scores directly under "Latest Games" heading
- **ADDED**: getCurrentRating utility function for accurate current rating display (last rating in history or initial rating)

## 2025-01-27 - Bug Fixes & Tournament Generator Enhancements

### 🐛 **Bug Fixes**

#### **Bye Display Issues**
- **FIXED**: Admin panel now correctly displays "Player vs BYE" instead of "Player vs Player" for bye games
- **FIXED**: Game history overlays now show "vs BYE" instead of duplicate player names for byes
- **FIXED**: Tournament generator database integration fixed to use null xtids instead of invalid string IDs

#### **Cross-Tables Name Matching**
- **IMPROVED**: Corrected player name from "Max Panitch" to "Maxim Panitch" for perfect cross-tables matching
- **VERIFIED**: All 7 custom tournament players now successfully match and enrich with cross-tables data

### 🔧 **Tournament Generator Enhancements**

#### **Custom Player Support**
- **NEW**: `--custom-players` flag allows tournaments with client-provided player lists
- **NEW**: Support for text files with "Last, First" name format
- **NEW**: Automatic single-division mode when using custom players
- **IMPROVED**: Enhanced command-line argument parsing and validation

#### **Output Organization** 
- **CHANGED**: Tournament files now generated in `tools/generated-tournament/` directory
- **IMPROVED**: Better file organization and path handling
- **UPDATED**: Documentation with custom player usage examples

#### **Data Integrity**
- **FIXED**: Tournament generator no longer creates invalid string xtids like "GEN0001"
- **IMPROVED**: Proper null handling for players without cross-tables matches
- **ENHANCED**: Backend enrichment system now works seamlessly with generated tournaments

## 2025-01-24 - Cross-Tables Integration & Enhanced Tournament Creation

### 🌍 **Cross-Tables.com Integration**

#### **Complete External Data Integration**
- **NEW**: Full integration with cross-tables.com API for player ratings, rankings, and statistics
- **NEW**: Database table `cross_tables_players` with foreign key relationships to existing players
- **NEW**: Automated data synchronization during tournament creation and updates
- **NEW**: Rich player data including TWL/CSW ratings, rankings, career records, geographic location, and photos
- **NEW**: Tournament history tracking with results and performance data

#### **External API Services**
- **NEW**: `CrossTablesClient` service for HTTP API communication with cross-tables.com
- **NEW**: `CrossTablesSyncService` for batch and individual player data synchronization
- **NEW**: `CrossTablesPlayerRepository` with upsert operations and conflict resolution
- **NEW**: Database migration `20250824174500_cross_tables_integration.ts` with comprehensive schema

### 🎥 **Enhanced OBS Overlay System**

#### **New Player Profile Overlays**
- **NEW**: Cross-Tables Player Profile Overlay (`/users/{userId}/overlay/cross_tables_profile`)
  - Multiple display sources: name, location, rating, ranking, tournament-count, career-record, win-percentage, average-score, tournament-record, current-rating, recent-tournament, photo, full-profile
  - Works with current match system (specify `?player=1` or `?player=2`)
  - Professional styling with photos, location data, and comprehensive statistics

- **NEW**: Head-to-Head Comparison Overlay (`/users/{userId}/overlay/head_to_head`)
  - Side-by-side player comparison with photos and cross-tables data
  - Head-to-head record calculation from tournament history
  - Average scores between the specific players
  - Last match result display with round information
  - Current tournament standings for both players
  - Professional layout matching provided mockups

### 🔧 **Technical Enhancements**

#### **Database & Data Management**
- **NEW**: Foreign key relationships between players and cross-tables data
- **NEW**: JSON storage for complete tournament history and results
- **NEW**: Cached tournament count and average score fields for performance
- **NEW**: Proper indexing and conflict resolution for player data updates

#### **Frontend Architecture**
- **NEW**: Integration with existing BaseOverlay system for consistent overlay behavior
- **ENHANCED**: TypeScript interfaces for cross-tables data throughout the application
- **IMPROVED**: Error boundaries and loading states for new overlay components

#### **Performance Optimizations**
- **OPTIMIZED**: Cross-tables data synchronization with batch operations
- **ENHANCED**: Database queries with proper foreign key relationships
- **CACHED**: Player statistics and tournament data for faster overlay loading

### 🎯 **User Experience**

#### **Broadcast Overlays**
- **NEW**: Professional player profile displays with comprehensive statistics
- **NEW**: Head-to-head comparison overlays matching broadcast requirements
- **ENHANCED**: Cross-tables data integration for richer player information
- **IMPROVED**: Photo display and location data for enhanced viewer experience

---

## 2025-08-17 - Error Handling Standardization & API Hooks

### 🚀 **Major Developer Experience Improvements**

#### **Reusable UI Components**
- **NEW**: `ErrorMessage` component with variants (error, warning, info) for consistent error display
- **NEW**: `LoadingSpinner` component with customizable sizes and messages  
- **NEW**: `SuccessMessage` component with auto-hide functionality for user feedback
- **NEW**: `FormFeedback` component for unified loading/error/success states
- **NEW**: Barrel exports in `components/shared/index.ts` for cleaner imports

#### **API Hooks Suite**
- **NEW**: `useApiCall` hook for generic API operations with built-in state management
- **NEW**: `useApiMutation` hook for POST/PUT/DELETE with callbacks and success handling
- **NEW**: `useApiQuery` hook for GET operations with auto-fetching and refetch capabilities
- **NEW**: `useApiForm` hook for complete form handling with API integration
- **NEW**: Barrel exports in `hooks/index.ts` for centralized hook imports

### 🔧 **Error Handling Standardization**

#### **Consistent Error Patterns**
- **FIXED**: Inconsistent error handling across components (console.error vs state management vs throwing)
- **STANDARDIZED**: All UI components now use proper error state with user feedback
- **ENHANCED**: All API calls follow consistent error handling patterns
- **IMPROVED**: User experience with proper loading states and error messages

#### **Component Refactoring**
- **REFACTORED**: `AddTournament` to use `useApiForm` (reduced from ~100 to ~75 lines)
- **REFACTORED**: `TournamentList` to use `useApiQuery` (automatic fetching and error handling)
- **REFACTORED**: `AdminLogin` to use consistent error feedback patterns
- **UPDATED**: All overlay components to use proper `RankedPlayerStats` types

### 🎯 **Code Quality Improvements**

#### **TypeScript Enhancements**
- **ELIMINATED**: Critical `any` types in overlay components and services
- **FIXED**: Type mismatches between `PlayerStats` and `RankedPlayerStats`
- **ENHANCED**: `PictureDisplay` component to use `RankedPlayerStats` for type safety
- **IMPROVED**: Generic type support throughout API hooks

#### **Code Reduction**
- **ACHIEVED**: 75% reduction in API call boilerplate (from ~45 lines to ~10 lines)
- **REMOVED**: Duplicate error display code across components
- **CONSOLIDATED**: Common loading and error patterns into reusable hooks
- **SIMPLIFIED**: Component logic focused on UI rather than API state management

### 🗂️ **Architecture Cleanup**

#### **Dependency Injection Completion**
- **COMPLETED**: Removal of `ServiceContext.tsx` (finished prop-based injection migration)
- **UPDATED**: All components now use prop-based API service injection
- **ENHANCED**: Type safety across service interfaces

#### **Import Organization**
- **CREATED**: Centralized exports for shared components and hooks
- **IMPROVED**: Cleaner import statements across the codebase
- **STANDARDIZED**: Import patterns for better maintainability

### 🔨 **Build & Development**

#### **Build Optimization**
- **FIXED**: All TypeScript compilation errors
- **RESOLVED**: Type safety issues in overlay components
- **OPTIMIZED**: Build process now passes successfully with full type checking
- **CLEANED**: Unused imports and variables

---

## 2025-08-16 - Complete Domain Model Architecture Migration

### 🏗️ **Major Architecture Refactoring**

#### **Domain-Driven Design Implementation**
- **COMPLETE**: Frontend now exclusively uses domain types (camelCase, tree structure)
- **COMPLETE**: Backend owns database types (snake_case, flat structure)
- **NEW**: Clean separation of concerns with transformation layer at backend boundary
- **NEW**: Domain types in `shared/types/domain.ts` serve as the contract between frontend and backend

#### **Type System Organization**
- **MOVED**: `currentMatch` types from shared to backend (`backend/src/types/currentMatch.ts`)
- **MOVED**: `stats` types from shared to frontend (`frontend/src/types/stats.ts`) - only used by frontend
- **MOVED**: `broadcast` types from shared to frontend (`frontend/src/types/broadcast.ts`) - only used by frontend  
- **MOVED**: `admin` types from shared to backend (`backend/src/types/admin.ts`) - only used by backend
- **DELETED**: `shared/types/tournament.ts` - unused legacy types
- **MINIMIZED**: Shared directory now contains only truly shared interfaces

### 🔄 **Current Match System Migration**

#### **Domain Type Creation**
- **NEW**: `Domain.CurrentMatch` interface with camelCase fields (`tournamentId`, `divisionId`, `divisionName`, `round`, `pairingId`, `updatedAt`)
- **NEW**: `Domain.CreateCurrentMatch` interface for admin panel API calls
- **NEW**: Transformation functions in `backend/src/utils/domainTransforms.ts`

#### **Backend API Updates**
- **ENHANCED**: Admin routes (`/api/admin/match/current`) now accept and return domain types
- **ENHANCED**: Overlay routes (`/match/current`) now return domain types
- **NEW**: `transformCurrentMatchToDomain()` and `transformCreateCurrentMatchToDatabase()` functions
- **FIXED**: Admin panel API now properly handles camelCase field names

#### **Frontend Migration**
- **UPDATED**: All components now use `Domain.CurrentMatch` instead of database types
- **UPDATED**: `useCurrentMatch` hook returns domain types
- **UPDATED**: Admin panel sends camelCase field names (`tournamentId`, `divisionId`, etc.)
- **UPDATED**: All overlay pages use domain current match types
- **FIXED**: Real-time updates via broadcast channels use domain types

### 🎯 **Frontend Components Migration**

#### **Admin Interface**
- **MIGRATED**: AdminInterface to use domain types throughout
- **ENHANCED**: Type safety with `Domain.CreateCurrentMatch` for API calls
- **UPDATED**: All current match field references from snake_case to camelCase
- **FIXED**: Admin panel current match updates now work correctly

#### **Overlay System**
- **UPDATED**: BaseOverlay to use domain current match types
- **UPDATED**: All overlay pages (PlayerOverlay, MiscOverlay, etc.) to use domain types
- **ENHANCED**: Tournament display data interface now uses camelCase (`dataUrl` instead of `data_url`)
- **MIGRATED**: Real-time updates to work with domain types

#### **Hooks & Utilities**
- **REFACTORED**: `useCurrentMatch` to return `Domain.CurrentMatch`
- **UPDATED**: All match-related utility functions to use domain types
- **ENHANCED**: Socket helpers to use domain types for type safety
- **MIGRATED**: All API functions to send/receive domain types

### 🧹 **Code Organization & Cleanup**

#### **Shared Directory Minimization**
- **BEFORE**: 6 files in `shared/types/` (admin, broadcast, currentMatch, domain, stats, tournament, websocket)
- **AFTER**: 2 files in `shared/types/` (domain, websocket)
- **ACHIEVED**: Truly minimal shared interface containing only essential contracts

#### **Local Type Definitions**
- **CREATED**: Local `GameResult` interface in `GameHistoryDisplay.tsx`
- **CREATED**: Local `CreateTournamentParams` interface in `AddTournament.tsx`
- **PRINCIPLE**: Types used in only one location are defined locally instead of shared

#### **Import Path Updates**
- **UPDATED**: 25+ files to use new import paths for moved types
- **STANDARDIZED**: All broadcast types now imported from `../types/broadcast`
- **STANDARDIZED**: All stats types now imported from `../types/stats`

### 🔧 **Backend Enhancements**

#### **Domain Transformation Layer**
- **NEW**: Comprehensive transformation functions between database and domain formats
- **ENHANCED**: Current match transformations with proper field mapping
- **MAINTAINED**: Backward compatibility while enforcing type safety
- **OPTIMIZED**: Clean separation between persistence and business logic

#### **Database Type Ownership**
- **CONSOLIDATED**: All database types now owned by backend
- **ENHANCED**: Type safety within backend components
- **IMPROVED**: Clear boundaries between database and domain concerns

### 🐛 **Bug Fixes**

#### **Admin Panel Issues**
- **FIXED**: Admin panel database constraint violation when updating current match
- **RESOLVED**: Field name mismatch between frontend (camelCase) and backend (snake_case)
- **CORRECTED**: API endpoints now properly transform between type formats

#### **Type Safety Issues**
- **RESOLVED**: TypeScript compilation errors across frontend and backend
- **FIXED**: Import path errors after type relocations
- **ENHANCED**: Strict type checking between domain and database boundaries

### ⚡ **Performance & Quality**

#### **Build Process**
- **VERIFIED**: Frontend builds successfully with all domain types
- **VERIFIED**: Backend builds successfully with reorganized types
- **ENHANCED**: Code formatting with Prettier across all changed files
- **MAINTAINED**: Zero runtime errors after type migration

#### **Code Quality**
- **IMPROVED**: Type safety across the entire application
- **ENHANCED**: Clear separation of concerns between layers
- **MAINTAINED**: Consistent code style with automated formatting
- **ACHIEVED**: Clean architecture principles throughout

### 📋 **Type Interface Changes**

#### **Before (Database Types)**
```typescript
interface CurrentMatch {
  tournament_id: number;
  division_id: number;
  division_name: string;
  round: number;
  pairing_id: number;
  updated_at: Date;
}
```

#### **After (Domain Types)**
```typescript
interface CurrentMatch {
  tournamentId: number;
  divisionId: number;
  divisionName: string;
  round: number;
  pairingId: number;
  updatedAt: Date;
}
```

### 🎯 **API Endpoint Changes**

#### **Admin Current Match API**
- **INPUT**: Now accepts `Domain.CreateCurrentMatch` with camelCase fields
- **OUTPUT**: Now returns `Domain.CurrentMatch` in camelCase format
- **TRANSFORMATION**: Backend handles conversion to/from database format

#### **Overlay Current Match API**
- **OUTPUT**: Now returns `Domain.CurrentMatch` in camelCase format
- **COMPATIBILITY**: Frontend components seamlessly work with new format

### 📁 **File Structure Changes**

#### **Type Relocations**
```
MOVED: shared/types/currentMatch.ts → backend/src/types/currentMatch.ts
MOVED: shared/types/stats.ts → frontend/src/types/stats.ts
MOVED: shared/types/broadcast.ts → frontend/src/types/broadcast.ts
MOVED: shared/types/admin.ts → backend/src/types/admin.ts
DELETED: shared/types/tournament.ts
```

#### **Shared Directory (Minimized)**
```
shared/types/
├── domain.ts     (✅ Truly shared - business domain model)
└── websocket.ts  (✅ Truly shared - real-time communication)
```

### 🏆 **Achievements**

#### **Architecture Goals**
- ✅ **Frontend never sees database types** - Complete isolation achieved
- ✅ **Backend owns persistence concerns** - Clean separation established  
- ✅ **Shared directory minimized** - Only essential interfaces remain
- ✅ **Type safety enhanced** - Strict boundaries between layers
- ✅ **Domain-driven design** - Business logic separated from persistence

#### **Code Quality**
- ✅ **Zero TypeScript errors** after migration
- ✅ **All builds passing** (frontend and backend)
- ✅ **Admin panel working** with new domain types
- ✅ **Real-time updates functioning** with domain types
- ✅ **Code formatted** and style-consistent

### 🚀 **Technical Implementation**

#### **Transformation Layer**
- Backend automatically converts between database and domain formats
- Frontend receives clean domain objects with camelCase naming
- API contracts maintained through shared domain types
- Type safety enforced at compilation time

#### **Real-time Updates**
- WebSocket messages use domain types for consistency
- Broadcast channels properly handle domain type objects
- Admin panel changes propagate correctly to overlays
- Current match updates work seamlessly across all components

### 🔮 **Future Benefits**

#### **Maintainability**
- Clear type boundaries make changes safer and easier
- Domain types can evolve independently of database schema
- New features can be built on clean domain foundation
- Testing is simplified with well-defined interfaces

#### **Scalability**  
- Architecture supports future domain complexity
- Type system scales with application growth
- Clean separation enables independent team development
- Domain logic can be extracted and reused

---

### 🏗️ **Migration Summary**

This massive refactoring successfully migrated the entire application from a mixed type system to a clean domain-driven architecture. The frontend now works exclusively with business domain types (camelCase, tree structure) while the backend owns all database concerns (snake_case, flat structure). The shared directory contains only truly shared interfaces, and the transformation layer ensures type safety across all boundaries.

**Result**: A cleaner, more maintainable, and more scalable codebase with strict type safety and clear separation of concerns. 🎉

## 2025-08-06

### Refactored
- **Frontend API Layer**: Centralized all API calls into clean, named functions
  - Created `services/api.ts` with specific functions like `createTournament()`, `updateTournament()`, `listTournaments()`
  - Moved helper functions (`baseFetch`, `parseApiResponse`, `getAuthHeaders`) to `utils/api.ts`
  - Simplified `config/api.ts` to only contain configuration and types
  - Replaced raw `fetchWithAuth()` calls throughout components with descriptive function names
  - Improved code maintainability and readability across tournament management and admin interfaces

## 2025-08-05

### Fixed
- Player ID collision bug where games were incorrectly attributed to wrong divisions
- Missing `poll_until` field in tournament queries causing polling status to not display correctly
- `updateTournamentMetadata` not updating `data_url` in the correct table after migration

### Changed
- **BREAKING**: Restructured `CreateTournament` type to use hierarchical tree format
  - Divisions now contain their own players and games
  - Player seeds are now division-scoped instead of globally unique
  - Games reference players by `player1_seed`/`player2_seed` instead of `file_id`
- Repository now processes each division independently for clearer data flow
- Tournament data migration properly separated between `tournaments` and `tournament_data` tables

### Added
- Comprehensive debug helpers for inspecting `CreateTournament` data structure
- Enhanced tournament generator with multi-division support (2-4 divisions)
- Command-line parameters for tournament generator (divisions and rounds)
- Validation functions for tournament data integrity

### Technical Debt Addressed
- Completed partial migration of tournament data fields to separate table
- Removed ambiguous global player ID mappings in favor of division-scoped references

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