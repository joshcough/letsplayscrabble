# Simple Tournament Ticker - Basic Implementation

## 🎯 Simple Ticker Overview

A basic right-to-left scrolling ticker that shows tournament updates as they happen. No priorities, no breaking news, no complex queuing - just a simple, continuous scroll of tournament information.

## 🎨 Visual Behavior

```
← [Game Complete: Alice 456 - Bob 423] → [High Score: Charlie 567] → [Round 3: 8/12 games done] →
```

**Key Principles:**
- Items scroll continuously from right to left
- Each item completes its full journey across the screen
- New items are added to the end of the scroll
- Items eventually expire and disappear
- Simple, predictable behavior

## 🔧 Basic Data Flow

### 1. Detect Ticker-Worthy Events
```typescript
// In your existing incremental update handler
const generateTickerItems = (changes: GameChanges, tournament: Tournament) => {
  const items = [];
  
  // Game completions
  for (const game of changes.updated.filter(isComplete)) {
    items.push(`Game Complete: ${getPlayerName(game.player1_id)} ${game.player1_score} - ${getPlayerName(game.player2_id)} ${game.player2_score}`);
  }
  
  // High scores (simple detection)
  const highestInChanges = Math.max(...changes.updated.map(g => Math.max(g.player1_score || 0, g.player2_score || 0)));
  if (highestInChanges > getCurrentHighScore(tournament)) {
    items.push(`High Score: ${getHighScorePlayer(changes)} ${highestInChanges}`);
  }
  
  return items.map(content => ({
    id: `ticker-${Date.now()}-${Math.random()}`,
    content,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes
  }));
};
```

### 2. Broadcast Ticker Items
```typescript
// Add to your existing broadcast types
interface TickerItemMessage {
  id: string;
  content: string;
  createdAt: Date;
  expiresAt: Date;
}

// In WorkerSocketManager, when processing incremental updates
const tickerItems = generateTickerItems(data.changes, updatedTournamentData);
if (tickerItems.length > 0) {
  this.broadcastMessage({
    type: "TICKER_ITEMS",
    data: {
      items: tickerItems,
      tournamentId: data.update.tournament.id,
      userId: data.update.tournament.user_id
    }
  });
}
```

### 3. Simple Ticker Component
```typescript
interface TickerItem {
  id: string;
  content: string;
  createdAt: Date;
  expiresAt: Date;
}

const SimpleTicker: React.FC = () => {
  const [items, setItems] = useState<TickerItem[]>([]);
  
  // Listen for ticker items
  useEffect(() => {
    const cleanup = BroadcastManager.getInstance().onTickerItems(
      (data: { items: TickerItem[], tournamentId: number, userId: number }) => {
        // Add new items to the end
        setItems(prev => [...prev, ...data.items]);
      }
    );
    return cleanup;
  }, []);
  
  // Clean up expired items every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => prev.filter(item => new Date() < item.expiresAt));
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="simple-ticker">
      <div className="ticker-scroll">
        {items.map(item => (
          <span key={item.id} className="ticker-item">
            {item.content}
          </span>
        ))}
      </div>
    </div>
  );
};
```

## 🎨 Simple CSS Animation

```css
.simple-ticker {
  height: 40px;
  background: #1a1a1a;
  color: white;
  overflow: hidden;
  border-top: 2px solid #ff6b35;
  position: relative;
}

.ticker-scroll {
  display: flex;
  animation: scroll-left 60s linear infinite;
  line-height: 40px;
  white-space: nowrap;
}

.ticker-item {
  margin-right: 4rem; /* Space between items */
  font-weight: 500;
  flex-shrink: 0;
}

@keyframes scroll-left {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* Empty state */
.ticker-scroll:empty::before {
  content: "Tournament updates will appear here...";
  color: #666;
  font-style: italic;
}
```

## ⏰ Item Expiration Strategy

### Option 1: Fixed Time (Simple)
```typescript
// Items expire after 2 minutes regardless of activity
expiresAt: new Date(Date.now() + 2 * 60 * 1000)
```

### Option 2: Based on Queue Length
```typescript
// Longer expiration if queue is short, shorter if busy
const baseExpiration = 2 * 60 * 1000; // 2 minutes
const queueFactor = Math.max(0.5, Math.min(2, items.length / 5));
expiresAt: new Date(Date.now() + baseExpiration * queueFactor)
```

### Option 3: Scroll Count (More Complex)
```typescript
// Track how many times each item has scrolled past
interface TickerItem {
  id: string;
  content: string;
  createdAt: Date;
  scrollCount: number;
  maxScrolls: number; // Remove after this many complete cycles
}

// Increment scroll count when animation completes
const onScrollComplete = (itemId: string) => {
  setItems(prev => prev.map(item => 
    item.id === itemId 
      ? { ...item, scrollCount: item.scrollCount + 1 }
      : item
  ).filter(item => item.scrollCount < item.maxScrolls));
};
```

## 🎯 Integration Points

### URL Structure
```
/users/:userId/overlay/ticker/:tournamentId?
```

### OBS Setup
- **Size**: 1920x60 (full width, bottom of stream)
- **Position**: Bottom overlay
- **CSS**: `body { margin: 0; background: transparent; }`

### BroadcastManager Addition
```typescript
// Add to BroadcastManager.ts
onTickerItems(callback: (data: TickerItemsMessage) => void) {
  return this.addHandler('TICKER_ITEMS', callback);
}
```

### Sample Ticker Content
```
Game Complete: Alice 456 - Bob 423
High Score: Charlie 567 in Division A
Round 2 Complete: 12/12 games finished
Game Complete: Dave 445 - Eve 432
Perfect Game: Frank scores 700!
Round 3 Starting: 12 new pairings
```

## 🚀 Implementation Steps

### Step 1: Add Ticker Item Generation (30 minutes)
1. Add `generateTickerItems()` function to detect interesting events
2. Integrate into existing incremental update flow
3. Test with console.log to see what events would generate ticker items

### Step 2: Add Broadcast Support (20 minutes)
1. Add `TICKER_ITEMS` message type to broadcast types
2. Add broadcasting logic to WorkerSocketManager
3. Add `onTickerItems` handler to BroadcastManager

### Step 3: Create Ticker Component (45 minutes)
1. Create `SimpleTicker.tsx` component
2. Add CSS animations
3. Test with mock data

### Step 4: Route Integration (15 minutes)
1. Add ticker route to App.tsx
2. Test in OBS browser source
3. Verify transparency and sizing

### Step 5: Fine-tuning (30 minutes)
1. Adjust scroll speed and spacing
2. Test with real tournament data
3. Tweak expiration timing

**Total Time Estimate: ~2.5 hours for basic working ticker**

## 🎪 Future Enhancements (Not Now)

- Multiple priorities
- Breaking news interruptions
- Pause on hover
- Click interactions
- Configuration options
- Analytics tracking

---

**This basic ticker gives you immediate value with minimal complexity. Once it's working and you see how it feels, you can add the fancier features from the full ticker document.**