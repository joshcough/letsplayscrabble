# Memory Leak Investigation - October 2025

## Problem
OBS browser sources running overlay pages were consuming excessive memory:
- Started at ~167MB
- Grew to ~190MB+ over 30 tournament rounds
- With 5-10 OBS sources open, total memory exceeded system limits
- 20MB spikes observed during pairings round updates

## Root Cause: `previousData` in Broadcast Messages

The `TOURNAMENT_DATA_INCREMENTAL` broadcast included both:
- `data`: Current division state (~400 games by round 30)
- `previousData`: Previous division state (~400 games by round 30)

This created a **perfect storm** of memory retention:

### 1. BroadcastChannel Amplification
- Each `postMessage()` serializes the entire object
- Browser sends to **all listening tabs/iframes**
- With 10 OBS sources: **10 independent copies** in memory per broadcast
- 60 broadcasts over 30 rounds = 600 total message copies

### 2. Closure Capture in Event Handlers
Every overlay had multiple `useEffect` hooks with closures:

```typescript
const cleanup = BroadcastManager.getInstance().onTournamentDataIncremental(
  (data: TournamentDataIncremental) => {
    // Even if we never access data.previousData,
    // the closure captures the ENTIRE 'data' object
    // JavaScript engines can't easily prove which properties are used
    // So they keep EVERYTHING alive
    if (!data.affectedDivisions.includes(divisionId)) {
      return; // Early return doesn't help - data is already in closure
    }
  }
);
```

### 3. React Render Cycle References
During React updates:
- Old virtual DOM exists with old tournament data
- New virtual DOM created with new tournament data
- **Both exist simultaneously during reconciliation**
- React's fiber tree holds references during async rendering
- Memory temporarily doubles during each update

### 4. Accumulation Effect
Each broadcast grew progressively larger:
- Round 1: `previousData` = 0 games
- Round 15: `previousData` = 196 games (~40KB)
- Round 30: `previousData` = 406 games (~80KB)

By round 30, each broadcast sent **812 games** worth of data (406 current + 406 previous).

### 5. Multiple Event Listeners Per Overlay
Each overlay subscribed to ~5 events:
- `onTournamentDataResponse`
- `onTournamentDataRefresh`
- `onTournamentDataIncremental`
- `onGamesAdded`
- `onAdminPanelUpdate`

**Total closure count**: 5 listeners × 10 overlays = **50 closures holding references**

### 6. Why Garbage Collection Failed
GC only runs when there are **zero references**. But we had:

```
Message 1 sent → 10 overlays receive → 50 closures hold references
Message 2 sent → 10 overlays receive → 50 MORE closures
Message 3 sent → 10 overlays receive → 50 MORE closures
```

Even though closures "returned early," JavaScript engines couldn't prove `data.previousData` would never be accessed, so they kept **all copies** in memory.

### 7. The Math
By round 30:
- `previousData` size: ~400 games × ~200 bytes/game = **80KB per message**
- Broadcasts per round: 2 (pairings + completion)
- Total rounds: 30
- Total broadcasts: 60
- Overlays: 10
- Closures per overlay: ~5

**Theoretical max if none GC'd**: 60 × 80KB × 10 × 5 = **240MB**

Observed: ~100MB retained memory, meaning GC caught some but couldn't keep up.

## Solution

**Remove `previousData` from broadcast messages entirely.**

`previousData` was only used by notification detectors (not in production). The main overlays (standings, player stats, game board) never accessed it.

### Changes Made
1. **WorkerSocketManager.ts**: Removed `JSON.parse(JSON.stringify(previousData))` clone
2. **broadcast.ts**: Commented out `previousData?: DivisionScopedData` in type definition
3. **NotificationManager.ts**: Disabled notification processing (not used in production)
4. **HighScore.tsx**: Added TODOs for future notification implementation
5. **TournamentNotificationOverlay.tsx**: Disabled notification handling

### Impact
- ✅ **Broadcast message size reduced by 50%**
- ✅ **Memory usage dropped from ~190MB to ~67MB** (65% reduction!)
- ✅ **20MB spikes eliminated** (were accumulated garbage from previous broadcasts)
- ✅ **No impact on production overlays** (they never used `previousData`)
- ✅ **Memory stays stable at 65-80MB over 30 rounds**

## Lessons Learned

### 1. Minimize Broadcast Message Size
In distributed systems with multiple receivers:
- Each byte is multiplied by receiver count
- Message size × receivers × event handlers = actual memory footprint
- **Only send what's actually needed**

### 2. Closure Capture Is Expensive
JavaScript engines hold **entire objects** in closure scope:
- Even unused properties are kept in memory
- GC can't optimize away "unused" object properties in closures
- Destructure only needed properties at function entry

### 3. BroadcastChannel Scales Poorly
- Not designed for large messages
- No built-in backpressure or flow control
- Every receiver gets a full copy (no shared memory)
- Consider streaming protocols for large data

### 4. React + Large State = Memory Pressure
- Virtual DOM diffing holds both old and new state
- Async rendering extends lifetime of old state
- Frequent updates with large state objects cause memory spikes
- Solution: Keep broadcast messages small, let React state updates be fast

### 5. Test With Multiple Receivers
- Single tab testing hides amplification effects
- Always test with realistic OBS source counts (5-10)
- Memory leaks compound across multiple receivers

## Future: Re-enabling Notifications

When implementing notifications, two options:

### Option 1: Pre-calculate Metadata (Recommended)
Worker calculates needed values before broadcasting:

```typescript
metadata: {
  addedCount: number;
  updatedCount: number;
  timestamp: number;
  previousHighScore?: number;  // ← Pre-calculated
  currentStreak?: number;       // ← Pre-calculated
}
```

**Pros**: Minimal memory overhead, detectors just read metadata
**Cons**: Worker needs to know what detectors need

### Option 2: Re-enable `previousData` Selectively
Only send `previousData` to notification overlay pages:

```typescript
if (isNotificationOverlay(subscriberId)) {
  message.previousData = previousDivisionData;
}
```

**Pros**: Detectors remain flexible, can calculate anything
**Cons**: Reintroduces memory overhead for notification overlays

## Monitoring

To prevent future memory leaks:
1. **Always test with 10 OBS sources open**
2. **Run full 30-round simulations** before deploying
3. **Check Chrome Task Manager** during testing
4. **Memory should stay stable at <100MB** per overlay
5. **Watch for "spikes" that don't GC** - sign of retained references

## Validation

Memory testing after fix (30-round tournament):
- **Start**: 67MB
- **Mid-tournament (round 15)**: 72MB
- **End (round 30)**: 67MB
- **No spikes**: Stayed consistently 65-80MB
- **GC working properly**: No accumulation over time

**Problem solved! ✅**
