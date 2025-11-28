# Tournament Data Versioning

## Overview

This feature automatically saves a timestamped snapshot of tournament data every time it's updated during polling. This creates a complete historical record that can be used for debugging, replay, and analysis.

## Motivation

Previously, when new tournament data came in (file updates from polling), we would overwrite the old data with the new data. This made it difficult to:
- Debug issues that occurred during a tournament
- Replay a tournament to see what happened at specific points in time
- Understand how frequently data was changing

Now, every version is preserved with a timestamp, giving us a complete audit trail.

## Implementation

### Database Schema

**Table: `tournament_data_versions`**
- `id` (primary key, auto-increment)
- `tournament_id` (foreign key to tournaments, CASCADE on delete)
- `data` (JSON - the tournament file data)
- `created_at` (timestamp)
- Index on `(tournament_id, created_at)` for efficient queries

### Data Flow

When tournament data is updated (every ~10 seconds during polling):

1. **Save NEW data** → `tournament_data_versions` table (with timestamp)
2. **Update current data** → `tournament_data.data` table (for fast access)

Result:
- `tournament_data_versions` contains **all versions** (complete history)
- `tournament_data` contains **current version** (for fast lookups)

### Code Structure

**New Repository: `TournamentDataRepository`**
- `updateTournamentData()` - Saves version and updates current data (in transaction)
- `getTournamentDataVersions()` - Get all versions for a tournament
- `getTournamentDataVersionById()` - Get a specific version by ID
- `getTournamentVersionStats()` - Get count and total storage size

**Updated: `TournamentRepository`**
- Now uses `TournamentDataRepository` for data updates
- All other functionality unchanged

## Storage Considerations

Based on typical tournament files (~30-50KB):

- **Best case**: File changes ~50 times during 3-day tournament = ~2.5MB
- **Worst case**: File changes every 10 seconds for 3 days = ~1.3GB
- **Realistic**: File changes ~100-200 times = ~5-10MB per tournament

Current approach is PostgreSQL storage. If needed, we can export to S3 later with a simple migration script.

## Migration to S3 (Future)

If we need to move old versions to cheaper storage:

1. Write script to read `tournament_data_versions`
2. Upload each version to S3: `tournament-{id}/version-{timestamp}.json`
3. Delete old versions from PostgreSQL
4. Keep recent versions (e.g., last 30 days) in PostgreSQL for fast access

## Usage Examples

### Get all versions for a tournament

```typescript
const versions = await tournamentDataRepo.getTournamentDataVersions(123);
// Returns array ordered by created_at DESC (newest first)
```

### Get storage stats

```typescript
const stats = await tournamentDataRepo.getTournamentVersionStats(123);
// { count: 150, totalBytes: 7500000 }
```

### Get specific version

```typescript
const version = await tournamentDataRepo.getTournamentDataVersionById(456);
// Returns version with ID 456
```

## Future Enhancements

### 1. Dev Page Tournament Replay

**Current**: Dev page loads tournament progression from checked-in files.

**Enhancement**:
- Load versions from `tournament_data_versions` table instead
- Allow replaying ANY past tournament (not just mock/generated ones)
- Step through versions with time controls (play, pause, fast-forward)
- Jump to specific timestamps

Benefits:
- Debug real tournament issues by replaying them
- Test frontend behavior with real data progressions
- No need to check in mock tournament files

### 2. Tournament Data Viewer Page

**Frontend page showing**:
- List of all versions for a tournament with timestamps
- Ability to view/download any specific version
- Diff viewer showing what changed between versions
- Timeline visualization of when updates occurred
- Statistics (total versions, total size, update frequency)

Benefits:
- Easy debugging of tournament issues
- Transparency for tournament directors
- Identify patterns in data updates

### 3. Automated Archival

- Scheduled job to archive versions older than X days to S3
- Keep last 30 days in PostgreSQL for fast access
- Automatic cleanup to manage database size

### 4. Version Comparison API

- Endpoint to compare two versions
- Return diff showing added/modified/removed games
- Useful for understanding what changed at specific timestamps

### 5. Export Functionality

- Export entire tournament history as JSON or ZIP
- Tournament directors can download complete record
- Useful for post-tournament analysis

## Testing

To verify versioning is working:

1. Start polling a tournament
2. Wait for a few updates (check every 10 seconds)
3. Query versions table:
   ```sql
   SELECT id, tournament_id, created_at,
          length(data::text) as size_bytes
   FROM tournament_data_versions
   WHERE tournament_id = X
   ORDER BY created_at;
   ```

## Rollback

If needed, the migration can be rolled back with:
```bash
npm run migrate:rollback
```

This will drop the `tournament_data_versions` table. No other data is affected.
