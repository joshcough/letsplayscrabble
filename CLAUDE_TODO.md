# Claude TODO List

## Current Session Tasks

### ✅ Completed - Sitewide Theme System
- Create CLAUDE_TODO.md file for session persistence
- Create new branch 'sitewide-theme-system'  
- Analyze current theme system implementation
- Extend theme system to entire site (not just overlays)
  - Created ThemeProvider context
  - Updated App.tsx to use themes for entire site
  - Updated Navigation component to use theme colors
  - Updated HomePage to use theme colors  
  - Updated UserSettingsPage to use theme colors
  - Updated Tournament Manager page (TournamentManagerPage + TournamentList components)
  - Updated Add Tournament page (AddTournament component) 
  - Updated Admin panel (AdminPage + AdminInterface components)
- Add theme field to tournament model/schema
  - Updated shared/types/domain.ts Tournament and TournamentSummary interfaces
  - Updated backend/src/types/database.ts interfaces
  - Created database migration to add theme column
  - Updated tournament repository to handle theme field
  - Migration applied successfully

### 🔄 In Progress - Tournament Theme System (PAUSED)
- Update tournament creation UI to include theme selection

### 📋 Pending - Tournament Theme System  
- Add theme editing capability to existing tournaments
- Implement backend websocket message for theme changes
- Handle theme change broadcasts on frontend

## Analysis Summary

### Current Theme System
- **Location**: `frontend/src/config/themes.ts` - 4 themes (modern, scrabble, july4, original)
- **Types**: `frontend/src/types/theme.ts` - ThemeColors interface with comprehensive styling
- **Hook**: `frontend/src/hooks/useTheme.ts` - fetches user theme from backend
- **Settings**: `frontend/src/pages/UserSettingsPage.tsx` - theme selection UI
- **Backend**: User settings API exists with theme field

### Current Limitations
- Theme system only applies to overlay pages (detected via URL path)
- Main site uses hardcoded background: `bg-[#E4C6A0]` in App.tsx:70
- Non-overlay pages don't use theme system at all

### Tournament Schema
- Current Tournament interface (shared/types/domain.ts:118) has no theme field
- Need to add optional theme field to Tournament interface
- Need database migration to add theme column

### Infrastructure Ready
- Websocket system exists
- User theme system established
- API patterns already in place

## Task Details

### Goal
Extend the current theme system from just overlays to the entire site, and add per-tournament theme support with real-time updates via websockets.

### Key Requirements
1. Make the entire site themeable (not just overlays) ✅ NEXT
2. Add theme selection during tournament creation
3. Allow theme editing for existing tournaments  
4. Send websocket messages when tournament themes change
5. Broadcast theme changes to all overlays in real-time