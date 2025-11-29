# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **Player Image Fallback Priority**: Fixed player cards and h2h overlay to prioritize tournament file photos over CrossTables photos
  - Previously, overlays checked CrossTables photo first, causing players with file photos but no XT photos (like Crayne Spanier) to show placeholder instead of their actual photo
  - Created reusable `PlayerImage` component to encapsulate image fallback logic
  - Image fallback order now consistent across all overlays:
    1. Tournament file photo (`player.photo`)
    2. CrossTables photo (`player.xtData.photourl`)
    3. Initials placeholder
  - Files modified:
    - `frontend/src/components/shared/PlayerImage.tsx`: New reusable component for player images
    - `frontend/src/pages/overlay/CrossTablesPlayerProfileOverlayPage.tsx`: Updated to use PlayerImage component
    - `frontend/src/pages/overlay/HeadToHeadOverlayPage.tsx`: Updated to use PlayerImage component

- **CrossTables Player Discovery**: Fixed player lookup to find all players, not just first 200
  - Changed from fetching complete player list (limited to 200 results) to individual name searches
  - Now successfully finds players with any xtid, not just playerid 1-203
  - Improved logging to show individual search progress
  - Example: Tournament with 12 players now finds all 12 xtids instead of only 7
  - Files modified:
    - `backend/src/services/crossTablesSync.ts`: Updated `discoverXtidsForPlayersWithDivisions()` to use `searchPlayers()` API for each player individually
    - `backend/src/services/crossTablesClient.ts`: Already had `searchPlayers()` method with proper `search` parameter support

### Performance
- **Backend Logging**: Reduced polling noise when no changes detected
  - Removed verbose logs during tournament polling when there's nothing to update
  - Polling interval changed from 5 seconds back to 10 seconds
  - Removed "Sending ping" log from ping service
  - Only logs when actual data changes or errors occur
  - Files modified:
    - `backend/src/services/pollingService.ts`
    - `backend/src/services/pingService.ts`
    - `backend/src/services/loadTournamentFile.ts`
    - `backend/src/repositories/tournamentRepository.ts`

### Added
- **Tournament Data Versioning**: Hash-based tournament data comparison for efficient polling
  - Replaced JSON.stringify comparison with SHA-256 hash comparison
  - Reduced memory usage and improved performance for tournament data updates
  - Added version comparison script for debugging tournament data changes
  - Tournament versions are now only saved when actual data changes are detected

### Fixed
- **CrossTables Player Profile Overlay**: Fixed tournament name and record not displaying properly
  - Added proper field mapping transformation in CrossTables API client (tourneyname→name, w→wins, l→losses, t→ties, etc.)
  - This was a regression from commit 3784791 where frontend was updated to use TypeScript interface field names but backend transformation was never added
  - Enhanced date formatting to display as "Oct 17, 2025" instead of "2025-10-17"
  - Improved overlay layout with table-based alignment for date and record display
  - Refactored date formatting into reusable utility function in formatUtils.ts

### Technical Details
- Files modified:
  - `backend/src/services/crossTablesClient.ts`: Added transformation mapping in getDetailedPlayer()
  - `frontend/src/pages/overlay/CrossTablesPlayerProfileOverlayPage.tsx`: Updated to use proper field names and improved styling
  - `frontend/src/utils/formatUtils.ts`: Added formatDate() utility function

---

## 2025-10-29 - CRITICAL: Broadcast Message Memory Leak Fix

### 🐛 **Critical Bug Fix**

#### **Eliminated `previousData` Memory Leak in Broadcast Messages**
- **FIXED**: Major memory leak caused by `previousData` in `TOURNAMENT_DATA_INCREMENTAL` broadcasts
- **ROOT CAUSE**: Worker was cloning and broadcasting entire previous tournament state with every game update
- **IMPACT**: With 10 OBS overlays, each broadcast created 50+ closure references holding 80KB+ of data
- **RESULT**: Memory reduced from **~190MB to ~67MB** over 30 rounds (**65% reduction!**)
- **FILES CHANGED**:
  - `WorkerSocketManager.ts` - Removed `JSON.parse(JSON.stringify(previousData))` clone
  - `broadcast.ts` - Removed `previousData` field from type definition
  - `NotificationManager.ts` - Disabled notification processing (not used in production)
  - Added `MEMORY_LEAK_INVESTIGATION.md` - Complete technical analysis

### 📊 **Memory Testing Results**

#### **Before Fix**
- **Start**: 167MB
- **Mid-tournament (round 15)**: 180MB
- **End (round 30)**: 190MB+
- **Spikes**: 20MB jumps during pairings (accumulated garbage)
- **GC**: Unable to keep up with allocation rate

#### **After Fix**
- **Start**: 67MB
- **Mid-tournament (round 15)**: 72MB
- **End (round 30)**: 67MB
- **Spikes**: None - completely eliminated
- **GC**: Working properly, no accumulation
- **STABLE**: Stays consistently 65-80MB over full 30-round tournament

### 🔍 **Technical Root Cause Analysis**

#### **Why `previousData` Caused Non-GC'd Memory Accumulation**

1. **BroadcastChannel Amplification**: Every `postMessage()` created 10 independent copies (one per OBS overlay)
2. **Closure Capture**: Event handlers captured entire `data` objects in closure scope, preventing GC
3. **React Render Cycle**: Both old and new virtual DOM existed simultaneously during reconciliation
4. **Accumulation Effect**: By round 30, each broadcast sent 812 games (406 current + 406 previous)
5. **Multiple Listeners**: 5 event handlers per overlay × 10 overlays = 50 closures holding references
6. **GC Failure**: JavaScript engines couldn't prove `previousData` was unused, kept all copies in memory

**Math**: 60 broadcasts × 80KB × 10 overlays × 5 closures = **240MB theoretical max**
**Observed**: ~100MB retained (GC caught some, but couldn't keep up)

#### **The Fix**
Removed `previousData` entirely from broadcasts:
- Message size cut by **50%** (was sending current + previous division data)
- Only used by notification detectors (not in production)
- Main overlays (standings, player stats, game board) never accessed it
- Memory footprint reduced by **65%**

### ⚠️ **Breaking Change (Non-Production)**

#### **Notifications Temporarily Disabled**
- Notification system relied on `previousData` for high score detection
- Added comprehensive TODOs in all notification files for future implementation
- Two options when re-enabling:
  1. **Pre-calculate metadata** (recommended) - Worker calculates `previousHighScore` before broadcasting
  2. **Selective previousData** - Only send to notification overlay pages, not all overlays

### 📚 **Documentation**

#### **New Documentation**
- **ADDED**: `MEMORY_LEAK_INVESTIGATION.md` - Complete technical writeup covering:
  - Root cause analysis with code examples
  - Why GC failed to reclaim memory
  - The mathematics of memory accumulation
  - Lessons learned for distributed systems
  - Future notification implementation options
  - Memory monitoring best practices

### 🎯 **Impact Summary**

- ✅ **Production memory usage: 65% reduction** (190MB → 67MB)
- ✅ **Broadcast message size: 50% reduction** (removed duplicate division data)
- ✅ **Memory spikes: Completely eliminated** (20MB jumps were accumulated garbage)
- ✅ **GC working properly**: No accumulation over extended testing
- ✅ **OBS stability: Dramatically improved** with multiple browser sources
- ✅ **No production impact**: Notifications weren't being used
- ✅ **Build successful**: All TypeScript checks pass

**Problem solved! Memory leak completely resolved.** ✅

---

## 2025-10-29 - Dev Tournament Tester Improvements & Page Titles

### ✨ **New Features**

#### **Dev Tournament Tester Enhancements**
- **NEW**: "Run Simulation" button - auto-advances every 10 seconds through all rounds
- **NEW**: "Next →" button to advance through tournament stages with one click
- **NEW**: State persistence - remembers current stage across backend restarts
- **NEW**: 30-round tournament support (previously only 7 rounds)
- **NEW**: "Clear All Games" button (renamed from "Reset" for clarity)
- **IMPROVED**: Compact UI - all controls fit on one screen without scrolling
- **IMPROVED**: Dropdown syncs with backend's current file automatically
- **IMPROVED**: Simulation automatically stops when reaching the last stage
- **REMOVED**: Vanilla overlay link (no longer needed)
- **REMOVED**: Previous button (going backwards not supported)
- **FILE**: Backend state saved to `tools/.dev-tournament-state.json`

#### **Page Title Standardization**
- **NEW**: All pages now have consistent "LPS: " prefixed titles
- **BENEFIT**: Easy identification in Chrome Task Manager for memory monitoring
- **PAGES**: Worker Page, Standings, Player, Current Match Admin, Home, Tournament Manager, Head to Head, Game Board, Admin, Tournament Details, Dev Tournament Tester

### 🐛 **Bug Fixes**

#### **Notification Manager Fix**
- **FIXED**: NotificationManager warnings about extracting data from React elements
- **CAUSE**: Detectors were returning plain `<div>` JSX instead of component functions
- **SOLUTION**: Changed detectors to return `<HighScore>` and `<WinningStreak>` components with props
- **RESULT**: NotificationManager can now properly extract props for notification broadcasting

### 📊 **Memory Testing Results**

#### **Confirmed Stable Memory Usage**
- **TESTED**: 30 rounds of tournament progression (60 file changes)
- **BASELINE**: ~167MB at start
- **END**: ~169MB after 30 rounds
- **RESULT**: No significant memory growth over extended testing
- **SPIKE**: ~20MB temporary spike during pairing updates (returns to baseline after completion)
- **CONCLUSION**: Memory leak completely resolved with console logging disabled

### 🔧 **Technical Details**

#### **Backend State Persistence**
- Dev tournament state written to JSON file on every file change
- State loaded on server startup to restore previous position
- Enables testing through server restarts without losing progress

#### **30-Round File Generation**
- Tournament generator creates 61 files (1 initial + 60 for 30 rounds)
- Backend dynamically generates AVAILABLE_FILES array for all 30 rounds
- Dropdown programmatically populated from round 1 through round 30

#### **Frontend State Sync**
- `loadCurrentFile()` syncs dropdown with backend on page load
- Next button automatically triggers update and advances current file
- Jump button allows skipping to any specific stage

---

## 2025-10-29 - URL Parameter Override for Production Logging

### ✨ **New Feature**

#### **Production Debugging Enhancement**
- **NEW**: URL parameter `?logging=true` to enable console logging on specific pages in production
- **BENEFIT**: Debug production issues without affecting all OBS overlays
- **USAGE**: Add `?logging=true` to any URL to see console logs in that browser tab only
- **EXAMPLE**: `https://yourapp.com/users/1/overlay/standings?logging=true`
- **MAINTAINED**: OBS browser sources without the parameter continue with logging disabled

### 🔧 **Technical Details**
- URL parameter check happens before environment variable check
- Works in browser only (safely handles SSR with typeof window check)
- Centralized in `logConfig.ts` for consistent behavior across all pages
- No code changes or redeployment needed to enable debugging

---

## 2025-10-29 - Lake George Release: Memory Optimization & Performance Improvements

### 🐛 **Critical Bug Fixes**

#### **Memory Leak Elimination**
- **FIXED**: BroadcastChannel memory leak where instances were created on every component re-render instead of once on mount
- **IMPACT**: Severe memory exhaustion with multiple OBS browser sources completely eliminated
- **FIXED**: Console logging memory bloat - 168+ console.log statements caused Chrome DevTools to hold object references
- **RESULT**: Memory usage reduced from 200MB+ to ~100MB over 7 tournament rounds (50% reduction)

#### **CrossTables Integration Fixes**
- **FIXED**: H2H sync now uses all discovered xtids including name-matched players (previously only used embedded xtids)
- **FIXED**: H2H sync now fetches per-division instead of all players together, eliminating unnecessary cross-division data
- **IMPROVED**: 34% reduction in H2H matchup data storage (example: 80-player, 3-division tournament)

### 🚀 **Performance Optimizations**

#### **Division-Scoped Data Architecture**
- **NEW**: Worker broadcasts only requested division data instead of entire tournament
- **NEW**: `DivisionScopedData` type for type-safe division-scoped operations
- **OPTIMIZED**: Overlays store only their division's data, reducing memory footprint
- **MAINTAINED**: Backward compatibility via BaseOverlay adapter
- **ENHANCED**: Worker still caches full tournament but extracts division before broadcast

#### **CrossTables Bulk Operations**
- **NEW**: `getAllPlayersIdsOnly()` API for efficient batch player lookup
- **ENHANCED**: Smart xtid validation - only sets xtids that exist in database
- **IMPROVED**: Name format conversion ("Last, First" ↔ "First Last") for better matching
- **OPTIMIZED**: Two-phase sync - embedded xtids first, then bulk name matching

### ✨ **New Features**

#### **Dev Tournament Tester**
- **NEW**: Backend `/api/dev` routes for dynamic tournament file serving
- **NEW**: Frontend testing page at `/dev/tournament-tester`
- **NEW**: Reset functionality to clear games without expensive CrossTables sync
- **NEW**: 15 tournament progression stages (initial → round 7 complete) for systematic testing
- **BENEFIT**: Enables systematic memory testing and debugging workflows

#### **Admin Workflow Improvements**
- **ENHANCED**: Auto-select first option in Current Match Management dropdowns
- **NEW**: Player name formatting - display "Last, First" format in admin interface
- **IMPROVED**: Smart sorting - players sorted by last name instead of first name
- **RESULT**: Reduces clicks from 4 to 1 when selecting tournament pairings

### 🎨 **UI Improvements**

#### **Overlay Display Enhancements**
- **CHANGED**: 0-0 players now show "22nd Seed" instead of "22nd Place"
- **OPTIMIZED**: Row padding reduced from py-2 → py-1 for better OBS fit
- **LIMITED**: Table display reduced from 20 → 10 results for better composition
- **IMPROVED**: Better vertical space utilization in OBS overlays

### 🔧 **Technical Improvements**

#### **Type Safety Enhancement**
- **ELIMINATED**: All `any` types across backend and frontend
- **ADDED**: Proper type annotations (unknown[], Knex.QueryBuilder, etc.)
- **CREATED**: Explicit CrossTablesApiGame interface
- **ENHANCED**: Better null/undefined handling throughout codebase

#### **Code Quality**
- **NEW**: xtidHelpers utility module for consistent xtid handling
- **NEW**: Player name utilities (formatPlayerNameReverse, getLastName)
- **NEW**: `getPlaceOrSeedLabel()` helper for proper place vs seed display
- **IMPROVED**: Error handling for malformed data
- **ENHANCED**: Better separation of concerns in sync services

#### **Developer Experience**
- **NEW**: REACT_APP_ENABLE_LOGGING env var for debug logging control
- **NEW**: Tournament progression test files for memory analysis
- **NEW**: Document titles for overlay pages (enables easy Chrome Task Manager identification)
- **ENHANCED**: Detailed logging for debugging sync operations

### 📊 **Performance Impact Summary**

#### **Memory Usage (OBS Overlays)**
- Before: 200-250MB over 7 rounds
- After: ~100MB over 7 rounds
- **Improvement**: 50% reduction in memory usage

#### **CrossTables API Efficiency**
- Before: 1 call with 80 players = 3,160 matchups
- After: 3 calls (26+26+28 players) = 2,080 matchups
- **Improvement**: 34% fewer matchups stored

#### **Admin Workflow**
- Before: 4 clicks to select tournament pairing
- After: 1 click to select tournament pairing
- **Improvement**: 75% reduction in manual selection steps

### 🔨 **Technical Architecture**

#### **Memory Optimization Techniques**
- BroadcastChannel instances stored in useRef hooks
- Console.log disabled by default in production (NODE_ENV=production)
- Only affected divisions cloned during updates, not entire tournament
- Proper cleanup on component unmount

#### **Data Flow Improvements**
- Division-scoped broadcasting reduces memory per overlay
- Worker coordinates single API call for multiple overlays
- Incremental updates with previousData tracking
- Proper cache invalidation and update propagation

### 🧪 **Testing & Validation**

#### **Memory Testing**
- Dev tournament tester allows systematic testing through 7 rounds
- Chrome Task Manager used to verify memory usage
- Both React and vanilla overlays tested (vanilla work preserved in branch)
- Confirmed console logging was the primary memory leak culprit

#### **Integration Testing**
- H2H per-division sync verified with multi-division tournaments
- Admin dropdown auto-select verified working
- Overlay display verified with 0-0 players showing seed
- BroadcastChannel leak confirmed fixed

### 🚢 **Deployment Notes**

#### **No Breaking Changes**
- All changes backward compatible
- No database migrations required
- Existing OBS browser sources continue to work

#### **Configuration**
- REACT_APP_ENABLE_LOGGING defaults to false (logging disabled)
- NODE_ENV=production automatically disables console.log (Heroku auto-sets)
- Dev tournament tester requires authentication at /dev/tournament-tester

### 📦 **Commits Included**

1. Optimize CrossTables player sync with bulk lookup and xtid validation (85cfafe)
2. Add admin dropdown auto-select and player name formatting (44783a1)
3. Fix H2H sync to use all discovered xtids including name-matched players (07bac48)
4. Sync H2H data per division instead of all players together (e81f73a)
5. Reduce table overlay row padding and limit to 10 results (27fa5ea)
6. Further reduce table overlay row padding for better OBS fit (913dbf8)
7. Change 'Place' to 'Seed' for 0-0 players in overlays (fc49ea5)
8. CRITICAL: Fix BroadcastChannel memory leak in useTournamentData (bb0ac87)
9. Disable console.log in production to fix OBS memory bloat (8db1be6)
10. Implement division-scoped data architecture to reduce overlay memory usage (3784791)
11. Add dev tournament tester and disable console logging (ae3150c)

### 🏆 **Credits**

Development completed during Lake George tournament September-October 2025.

---

## 2025-10-14 - Optimized CrossTables Player Sync & XTID Management

### 🚀 **CrossTables Integration Optimization**
- **OPTIMIZED**: Player sync now uses bulk API lookup for missing xtids instead of relying solely on embedded data
- **NEW**: `getAllPlayersIdsOnly()` API method for efficient bulk player lookup from cross-tables.com
- **NEW**: Helper utilities in `xtidHelpers.ts` for xtid extraction and name cleaning
- **ENHANCED**: `convertFileToDatabase()` now async and validates xtids against database before setting
- **IMPROVED**: Player name cleaning - strips embedded xtid tags (e.g., "Player:XT012345" → "Player")
- **SMART**: Two-phase sync approach - processes embedded xtids first, then performs bulk name matching for players without xtids

### 🔧 **Technical Improvements**
- **NEW**: `extractXtidFromEtc()` - Handles xtid as number, array, or null/undefined
- **NEW**: `stripXtidFromPlayerName()` - Removes ":XT######" suffixes from player names
- **NEW**: `getBestXtid()` - Extracts best xtid from either player name or etc object
- **ENHANCED**: CrossTables sync now separates players with embedded xtids from those needing lookup
- **OPTIMIZED**: Only fetches full profile data for newly discovered xtids (avoids redundant API calls)
- **FIXED**: Head-to-head service now properly handles array-based xtids
- **VALIDATED**: Only sets player xtids that exist in cross_tables_players table

### 🎯 **Data Flow Enhancement**
- **STREAMLINED**: Intelligent player analysis separates embedded vs. missing xtids
- **IMPROVED**: Name format conversion ("Last, First" → "First Last") for CrossTables matching
- **SMART**: Case-insensitive matching with exact match priority
- **GRACEFUL**: Falls back safely when players can't be matched or have ambiguous matches
- **LOGGED**: Detailed console logging for debugging sync operations

### 📊 **Type System Updates**
- **CHANGED**: `Etc.xtid` now supports `number | number[] | null | undefined` for flexible xtid storage
- **CHANGED**: `Etc.newr` now optional
- **ENHANCED**: Better type safety throughout sync services and helper utilities

## 2025-09-13 - Photo Overlay Fixes & CrossTables Integration

### 🖼️ **Photo Overlay System**
- **FIXED**: Picture overlays now handle undefined/missing photos gracefully
- **ADDED**: CrossTables photo fallback system for player images
- **IMPROVED**: Tournament URL parsing for both NASPA and external tournament sources
- **REPLACED**: External placeholder service with inline SVG data URI to eliminate network dependencies

### 🔧 **Technical Improvements**
- **ENHANCED**: `getPlayerImageUrl()` function with multi-source photo resolution:
  - Primary: Tournament file photos (when available)
  - Fallback: CrossTables photos (when player has xtData)
  - Final: Inline SVG "No Photo" placeholder
- **ADDED**: `crossTablesPhotoUrl` field to PlayerStats type for CrossTables photo integration
- **IMPROVED**: URL construction logic to handle non-NASPA tournament formats
- **FIXED**: Type safety with proper null/undefined checking for photo fields

### 🎯 **User Experience**
- **ELIMINATED**: Broken image URLs like `https://scrabbleplayers.org/directors/AA003954//html/`
- **CONSISTENT**: Clean "No Photo" placeholders when images aren't available
- **RELIABLE**: No more network errors from external placeholder services
- **FUTURE-READY**: System automatically displays photos when CrossTables enrichment provides them

### 📊 **Data Flow Enhancement**
- **STREAMLINED**: Domain.Player.xtData.photourl → PlayerStats.crossTablesPhotoUrl → PictureDisplay
- **MAINTAINED**: Backward compatibility with existing tournament photo systems
- **PREPARED**: Infrastructure ready for CrossTables photo integration

## 2025-09-13 - CrossTables Optimization & Polling Efficiency

### 🚀 **Performance Optimization**
- **OPTIMIZED**: Tournament polling eliminates wasteful CrossTables API calls
  - Skip enrichment during polling by passing `skipEnrichment: true` to `loadTournamentFile()`
  - Only process genuinely new players instead of re-processing existing players every 10 seconds
  - Reduce CrossTables server load from 39 players processed every 10 seconds to 0 when no new players

### 🔧 **Technical Improvements**
- **ADDED**: `enrichSpecificPlayers()` method for targeted CrossTables enrichment
- **ADDED**: `findNewPlayersInFile()` repository method to compare file vs database players
- **MODIFIED**: `pollingService.ts` to use new player detection instead of missing xtid checking
- **ENHANCED**: TypeScript type safety with proper type predicates for player filtering
- **FIXED**: Data conversion errors with better null/undefined checking in `fileToDatabaseConversions.ts`

### 🛠️ **Development Tools**
- **ADDED**: Alternate port configurations (`dev-alt`, `start-alt`) to avoid development conflicts
  - Backend: `npm run dev-alt` (port 3002)
  - Frontend: `npm run start-alt` (port 3003 with API_PORT=3002)
- **ENHANCED**: Frontend API configuration to use environment variable for API port

### 📊 **Performance Impact**
- **ELIMINATED**: Unnecessary CrossTables API requests during active tournament polling
- **MAINTAINED**: Enrichment for initial tournament setup and new player additions
- **PRESERVED**: Real-time score updates while reducing external API dependencies
- **IMPROVED**: Tournament lifecycle handling (pre-tournament, during tournament, post-tournament)

### 🎯 **User Experience**
- **FASTER**: More efficient tournament monitoring with reduced external dependencies
- **RELIABLE**: Better error handling for malformed player data
- **SEAMLESS**: Maintains all existing functionality while improving performance

## 2025-09-10 - Remove "Modern" Transitional Naming from Components

### 🏗️ **Component Architecture Cleanup**
- **RENAMED**: `BaseModernOverlay` → `ThemeProvider` - better describes its purpose of providing theme context
- **RENAMED**: `PictureDisplayModern` → `PictureDisplay` - removed transitional suffix
- **RENAMED**: `TournamentTableModernOverlay` → `TournamentTableOverlay` - simplified naming
- **REMOVED**: `ModernOverlaysPage` - obsolete transitional component
- **REMOVED**: `GameBoardOverlayPage_backup.tsx` - old backup file no longer needed

### 🎯 **Code Quality Improvements**
- **UPDATED**: All imports across 17+ overlay pages to use new component names
- **CLEANED**: Removed "Modern" suffix from all component references
- **COMPLETED**: Modernization transition that began in earlier updates
- **MAINTAINED**: Full backward compatibility with existing functionality

### 📦 **Technical Details**
- **REFACTORED**: Theme provider pattern now has clearer naming convention
- **SIMPLIFIED**: Component hierarchy with more intuitive names
- **PRESERVED**: All existing functionality during rename operation
- **TESTED**: Successfully builds with all renamed components

## 2025-09-06 - Complete Notification Management System with History & Replay

### 🎯 **Professional Notification Management Interface**
- **RENAMED**: "Notification Test Page" → "Notification Management" reflecting true purpose
- **REORGANIZED**: Queue management moved to top priority position above testing tools
- **ENHANCED**: Live queue dashboard with real-time status updates every 500ms
- **IMPROVED**: Clear section hierarchy - Management → Settings → Testing → Instructions

### 📜 **Advanced History & Replay System**
- **IMPLEMENTED**: Complete notification history tracking (last 100 completed notifications)
- **ADDED**: Instant replay functionality with "🔄 Replay" buttons for each historical item
- **CREATED**: VIP priority system for replays (Priority 9) - jumps to front of queue
- **BUILT**: Scrollable history view with timestamps, priorities, and player details

### 🔄 **Smart Queue Management**
- **PRIORITY SYSTEM**: Replays (9), High Scores (8), Winning Streaks (7), Manual Tests (5)
- **SEQUENTIAL PROCESSING**: Maintains 15-second display + 2-second delays
- **INTELLIGENT ORDERING**: Priority-first, then queue-time for same-priority items
- **COMPLETE CONTROL**: Pause/resume, cancel current, cancel individual, clear all

### 🎮 **StreamLabs-Quality Features**
- **LIVE COUNTDOWN**: Real-time timer showing seconds remaining for active notifications
- **INDIVIDUAL CONTROLS**: Cancel buttons for each queued and historical notification
- **VISUAL FEEDBACK**: Color-coded priorities, hover effects, and status indicators
- **PROFESSIONAL UX**: Empty states, loading indicators, and intuitive layout

### 🎯 **Perfect Use Cases**
- **Tournament Management**: Queue and replay exciting moments during live events
- **Testing & Debugging**: Rapid testing with queue behavior validation
- **Demonstrations**: Replay successful notifications for audience engagement
- **Training**: Show notification types and queue management to staff

## 2025-09-06 - Complete Admin System Reorganization & Navigation Overhaul

### 🏗️ **Major Admin Structure Reorganization**
- **RENAMED**: `AdminPage` → `CurrentMatchAdminPage` for better clarity and specificity
- **MOVED**: `NotificationTestPage` from `/pages/` to `/pages/admin/` folder with proper authentication
- **CREATED**: New admin landing page (`AdminLandingPage`) providing central access to all admin functions
- **RESTRUCTURED**: Admin routes now properly organized under `/admin/` namespace

### 🛡️ **Enhanced Authentication & Security**
- **SECURED**: Notification test page now requires login (was previously public)
- **PROTECTED**: All admin routes properly wrapped with `ProtectedRoute` component
- **ORGANIZED**: Admin functionality clearly separated from public-facing features

### 🎯 **New Admin Navigation Structure**
- **ADMIN DROPDOWN**: Replaced single "Admin" link with professional dropdown menu
- **THREE SECTIONS**: Admin Home, Current Match, and Notifications all easily accessible
- **DUAL DROPDOWNS**: Separate admin dropdown and user account dropdown for clean UX
- **ACTIVE STATES**: Proper highlighting when on admin pages with visual feedback

### 📋 **Professional Admin Landing Page**
- **DASHBOARD STYLE**: Card-based layout explaining each admin function with clear descriptions
- **QUICK ACTIONS**: Direct links to common tasks (overlays, tournament manager, etc.)
- **USER GUIDANCE**: Detailed explanations of what each admin section does
- **THEMED**: Properly integrated with site theme system

### 🔄 **Updated Route Structure**
```
OLD:
/admin → Current Match Interface
/notification-test → Public test page

NEW:
/admin → Admin Landing Page
/admin/current-match → Current Match Interface  
/admin/notifications → Notification Test/Management (Auth Required)
```

### 🎮 **User Experience Improvements**
- **CLEAR ORGANIZATION**: Admin functions logically grouped and explained
- **SECURE ACCESS**: No more public access to sensitive notification testing
- **INTUITIVE NAVIGATION**: Dropdown clearly shows available admin functions
- **PROFESSIONAL UI**: StreamLabs-style admin interface with proper descriptions

## 2025-09-06 - Advanced In-Memory Notification Queue System

### 🔥 **Complete Notification Queue Management**
- **IMPLEMENTED**: In-memory notification queue with priority system and sequential processing
- **ADDED**: Real-time queue status dashboard with live countdown timer for current notification
- **CREATED**: Individual notification cancellation (pending items) and immediate current notification cancellation
- **BUILT**: Comprehensive queue controls (pause/resume, clear all, individual cancel buttons)

### 📋 **Queue Features**
- **PRIORITY SYSTEM**: High scores (8), Winning streaks (7), Manual (5) with automatic sorting
- **SEQUENTIAL PROCESSING**: One notification at a time with 15-second display + 2-second delays
- **REAL-TIME STATUS**: Live updates every 500ms showing pending count, history, processing status
- **DETAILED QUEUE VIEW**: Shows position, player details, priorities, and queue timestamps

### ⚡ **Advanced Controls**
- **IMMEDIATE CANCEL**: Cancel currently displaying notification with instant slide-out animation
- **QUEUE MANAGEMENT**: Pause/resume processing, clear all pending notifications
- **INDIVIDUAL CONTROL**: Cancel specific pending notifications with ❌ buttons
- **LIVE COUNTDOWN**: Real-time timer showing seconds remaining for active notification

### 🎯 **Technical Implementation**
- **NOTIFICATION MANAGER**: Extended with queue processing, priority management, and history tracking
- **BROADCAST SYSTEM**: Added `NOTIFICATION_CANCEL` message type for immediate notification dismissal
- **OVERLAY INTEGRATION**: GameBoardOverlay listens for cancel messages and handles timeout clearing
- **RACE CONDITION FIX**: Proper timeout management prevents overlapping notifications and early dismissals

### 🧪 **Enhanced Test Page**
- **QUEUE DASHBOARD**: Real-time display of queue status, current notification, and controls
- **RAPID TESTING**: Click buttons multiple times to test queue behavior and priority ordering
- **VISUAL FEEDBACK**: Color-coded priority badges, queue position numbers, and status indicators
- **COMPLETE CONTROL**: Test all queue functionality from pause/resume to individual cancellations

### 🎮 **User Experience**
- **STREAMLABS-LIKE**: Professional notification management similar to streaming software
- **NO OVERLAPS**: Queue ensures notifications never conflict or display simultaneously  
- **FULL CONTROL**: Complete real-time management of notification display and timing
- **PERFECT TESTING**: Comprehensive test interface for validating queue behavior

## 2025-09-06 - GameBoardOverlay Theme Integration & Positioning Fixes

### 🎨 **Theme System Integration**
- **FIXED**: GameBoardOverlay now properly responds to tournament theme changes
- **RESTRUCTURED**: Component hierarchy to pass tournament theme from BaseOverlay to BaseModernOverlay
- **ADDED**: Support for both URL-based and current match modes with proper theme handling
- **RESOLVED**: Theme not updating when tournament theme changes in admin interface

### 📐 **Positioning & Layout Improvements**
- **SHIFTED**: Entire overlay layout moved left by 372px and up by 12px for better OBS integration
- **FIXED**: Background color extending full viewport width (no white cutoff on edges)
- **PRESERVED**: Pixel-perfect alignment and spacing of all overlay elements
- **MAINTAINED**: All camera transparent areas and element relationships

### 🎯 **User Impact**
- **DYNAMIC**: Overlay colors now update immediately when tournament theme changes
- **IMPROVED**: Better positioning for YouTube stream overlay usage
- **CONSISTENT**: Theme system works across all overlay types

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
