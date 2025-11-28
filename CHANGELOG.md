# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
