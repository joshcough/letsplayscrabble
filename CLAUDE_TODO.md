# Claude TODO List

## Current Session Tasks

### ✅ Completed - Comprehensive Notification System
- Created NotificationManager for centralized notification detection and broadcasting ✅
- Implemented clean NOTIFICATION broadcast message system ✅
- Added NotificationTestPage at /notification-test for easy testing ✅
- Enhanced GameBoardOverlay with smooth slide animations (15-second display) ✅
- Added player photo support with circular frames and themed borders ✅
- Enlarged commentary/remaining tiles boxes to 180px height ✅
- Adjusted entire layout positioning for better spacing ✅
- Set up proper notification filtering by user/tournament/division ✅
- Default test data uses Nigel Richards (GOAT) with 18-game winning streak ✅

### ✅ Completed - Sitewide Theme System
- Create CLAUDE_TODO.md file for session persistence ✅
- Create new branch 'sitewide-theme-system' ✅
- Analyze current theme system implementation ✅
- Extend theme system to entire site (not just overlays) ✅
  - Created ThemeProvider context ✅
  - Updated App.tsx to use themes for entire site ✅
  - Updated Navigation component to use theme colors ✅
  - Updated HomePage to use theme colors ✅
  - Updated UserSettingsPage to use theme colors ✅
  - Updated Tournament Manager page (TournamentManagerPage + TournamentList components) ✅
  - Updated Add Tournament page (AddTournament component) ✅
  - Updated Admin panel (AdminPage + AdminInterface components) ✅
- Add theme field to tournament model/schema ✅
  - Updated shared/types/domain.ts Tournament and TournamentSummary interfaces ✅
  - Updated backend/src/types/database.ts interfaces ✅
  - Created database migration to add theme column ✅
  - Updated tournament repository to handle theme field ✅
  - Migration applied successfully ✅

## 🎯 Next Major Project - Advanced Notification Management System

### 📊 Database-Backed Notification System
**Goal**: Transform current real-time notification system into a comprehensive database-backed system similar to StreamLabs but custom-built for Scrabble tournaments.

#### 🗄️ Database Schema Design
- **notifications table**:
  - id, tournament_id, division_id, user_id
  - type (high_score, winning_streak, custom)
  - player_name, player_photo_url
  - data (JSON: score, previous_score, streak_length, etc.)
  - status (pending, displayed, cancelled, completed)
  - priority (1-10)
  - scheduled_at, displayed_at, created_at
  - duration_seconds (default 15)
  - source (auto_detected, manual)

#### 🎛️ Notification Queue System
- **Sequential processing** - Only one notification displayed at a time
- **Priority system** - High scores vs winning streaks vs manual notifications
- **Timing controls** - Configurable delays between notifications
- **Overlap prevention** - Queue management to prevent conflicts
- **Auto-detection integration** - Current NotificationManager saves to DB instead of direct broadcast

#### 📱 Admin Interface Features
- **Notification Dashboard**:
  - View all notifications (pending, displayed, cancelled, completed)
  - Real-time queue status and preview
  - Manual notification creation form
  - Bulk operations (cancel multiple, reorder queue)
  
- **Queue Management**:
  - Drag-and-drop reordering
  - Pause/resume queue processing
  - Emergency stop/clear queue
  - Preview notifications before display
  
- **Replay System**:
  - Browse notification history
  - Replay past notifications instantly
  - Duplicate notifications with modifications

#### 🔧 Technical Implementation
- **Backend API Endpoints**:
  - GET /api/notifications (list, filter, paginate)
  - POST /api/notifications (create manual notification)
  - PUT /api/notifications/:id (update, cancel, reschedule)
  - DELETE /api/notifications/:id (remove from queue)
  - POST /api/notifications/:id/replay (replay past notification)
  
- **Real-time Synchronization**:
  - WebSocket notifications for queue updates
  - Database triggers for status changes
  - Admin interface live updates
  
- **Queue Processing Service**:
  - Background job processor for queue management
  - Configurable timing and priority rules
  - Automatic cleanup of old notifications

#### 🎨 User Experience Enhancements
- **Notification Templates** - Pre-built templates for common scenarios
- **Bulk Import** - CSV/Excel import for planned notifications
- **Tournament Integration** - Auto-create notifications based on tournament events
- **Analytics** - Track notification effectiveness and engagement
- **A/B Testing** - Test different notification styles and timing

### 🚧 Implementation Phases

#### Phase 1: Database Foundation
- Create notifications table and schema
- Update NotificationManager to save to database
- Basic CRUD API endpoints

#### Phase 2: Queue System
- Implement queue processing service
- Add priority and timing controls
- Prevent notification overlaps

#### Phase 3: Admin Interface
- Build notification dashboard
- Queue management interface
- Manual notification creation

#### Phase 4: Advanced Features
- Replay system
- Analytics and reporting
- Templates and bulk operations

---

## 🗂️ Archived Completed Projects

### Tournament Theme System (COMPLETED)
- Tournament creation UI theme selection ✅
- Theme editing for existing tournaments ✅
- Websocket theme change broadcasts ✅
- Real-time theme updates across overlays ✅