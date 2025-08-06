# Tournament Ticker System Implementation Guide

## 🎯 Ticker Semantics & Behavior

### What Goes in a Ticker
- **Live Scores**: "Round 3: Alice 456 - Bob 423"
- **High Scores**: "NEW HIGH SCORE! Charlie 567 in Division A"
- **Game Completions**: "Game Complete: Dave defeats Eve 445-389"
- **Round Updates**: "Round 4 pairings now available"
- **Tournament Status**: "Division B - 3 games remaining"
- **Upsets**: "Upset Alert: Lower-rated player wins by 100+ points"
- **Milestones**: "Perfect Game! Alice scores 700"
- **Achievements**: "5-game winning streak: Bob on fire!"

### Information Priority & Lifecycle

#### Priority Levels
1. **Breaking News** (Priority 1): High scores, upsets, eliminations, perfect games
2. **Live Updates** (Priority 2): Current game scores, recent completions
3. **Status Info** (Priority 3): Round progress, next pairings, general stats

#### Item Lifecycle
- **Breaking items** stay visible for 10+ minutes, can interrupt current scroll
- **Live updates** stay for 5 minutes, added to normal queue
- **Status info** stays for 2-3 minutes, fills background space
- **Items expire** based on relevance and age
- **Duplicate detection** prevents spam (same score update)

### Typical Ticker Behavior

#### Animation Timing & Queue Management
- **Respectful Animation**: Each item completes its full scroll cycle before being replaced
- **Queue System**: New items wait for their turn rather than interrupting mid-scroll
- **Smooth Transitions**: Items scroll completely off-screen before next item begins
- **Breaking News Exception**: Only high-priority items (Priority 1) can interrupt current animations

#### Multi-Item Display Logic
When multiple items can fit on screen simultaneously:
- **Active Items**: Currently visible and scrolling across screen (limited by display width)
- **Queued Items**: Waiting for an active slot to become available
- **Slot Management**: As items finish scrolling off-screen, queued items automatically promote to active
- **Staggered Timing**: Multiple active items start at different intervals to avoid overlap

#### Priority & Interruption Rules
- **Normal Updates** (Priority 2-3): Always respect current animations, join the queue
- **Breaking News** (Priority 1): Completely interrupts ticker with dramatic top-down takeover
    - "BREAKING NEWS" banner drops from top, wiping out current content
    - Actual breaking content then drops from top, displays center-screen
    - After 8-10 seconds, returns to normal ticker flow
- **Duplicate Prevention**: Don't show identical content (same score update) consecutively
- **Expiration Management**: Items automatically removed when they expire, don't consume queue slots

## 🎨 Visual Implementation Options

### Option 1: Single Scrolling Line (Recommended)
```
← [🏆 High Score: Alice 567] • [Game: Bob 445 - Charlie 389] • [Round 3: 5 games remaining] →
```
**Pros**: Simple, classic, works in small spaces
**Cons**: Limited content per view

### Option 2: Multi-Line Ticker (CNN Style)
```
LIVE SCORES    │ Alice 567 - Bob 423  │  Charlie 445 - Dave 389
HIGH SCORES    │ NEW RECORD: Eve 578 in Division A
ROUND STATUS   │ Round 3 Active - 12 games completed, 8 remaining
```
**Pros**: More information density, categorized content
**Cons**: Takes more vertical space, more complex

### Option 3: Segmented Ticker
```
[SCORES] Alice 456-Bob 423    [ALERT] New High Score!    [STATUS] Round 3 Active
```
**Pros**: Clear categorization, easy to scan
**Cons**: Less fluid, choppy appearance

### Option 4: Breaking News Overlay
```
Normal ticker: [Game scores flowing...]
Breaking:     [🚨 BREAKING: New Tournament Record! Alice 687 🚨]
```
**Pros**: Emphasizes important events
**Cons**: Complex state management

## 🔧 Technical Implementation

### Data Structures

```typescript
interface TickerItem {
  id: string;
  type: 'score' | 'high_score' | 'game_complete' | 'status' | 'upset' | 'milestone';
  priority: 1 | 2 | 3; // 1 = breaking, 2 = live, 3 = background
  content: string;
  icon?: string; // 🏆, ⚡, 📊, 🎯
  color?: 'red' | 'green' | 'blue' | 'yellow';
  expiresAt: Date;
  createdAt: Date;
  tournamentId: number;
  divisionId?: number;
  playerId?: number;
}

interface TickerState {
  activeItems: TickerItem[];     // Currently visible/scrolling
  queuedItems: TickerItem[];     // Waiting for their turn
  maxVisible: number;            // How many items can fit on screen simultaneously
  isScrolling: boolean;
  scrollSpeed: number;           // pixels per second
}

interface TickerConfig {
  maxVisible: number;            // Auto-calculated or manually set
  itemSpacing: number;           // Pixels between item start points
  scrollDuration: number;        // Seconds for complete scroll cycle
  allowInterruptions: boolean;   // Whether breaking news can interrupt
}
```

### CSS Animation Implementation

```css
.ticker-container {
  overflow: hidden;
  white-space: nowrap;
  background: #1a1a1a;
  color: #ffffff;
  height: 40px;
  position: relative;
  border-top: 2px solid #ff6b35;
}

.ticker-content {
  position: relative;
  height: 100%;
  line-height: 40px;
}

.ticker-item {
  position: absolute;
  top: 0;
  right: 0;
  margin-right: 2rem;
  font-weight: 500;
  white-space: nowrap;
  /* Each item animates independently */
  animation: scroll-left 15s linear forwards;
}

.ticker-item.breaking {
  background: #ff3333;
  padding: 0 1rem;
  border-radius: 4px;
  animation: scroll-left 10s linear forwards, pulse 1s ease-in-out infinite alternate;
  z-index: 10; /* Above normal items */
}

.ticker-icon {
  margin-right: 0.5rem;
}

/* Animation starts off-screen right, ends off-screen left */
@keyframes scroll-left {
  0% { 
    transform: translateX(100%); 
    opacity: 1;
  }
  5% {
    opacity: 1; /* Fade in */
  }
  85% {
    opacity: 1; /* Stay visible */
  }
  100% { 
    transform: translateX(-100%); 
    opacity: 0; /* Fade out */
  }
}

@keyframes pulse {
  from { opacity: 0.8; }
  to { opacity: 1; }
}

/* Debug panel (remove in production) */
.ticker-debug {
  position: absolute;
  top: -20px;
  right: 0;
  font-size: 10px;
  color: #666;
  background: rgba(0,0,0,0.5);
  padding: 2px 6px;
  border-radius: 3px;
}

/* Responsive sizing */
@media (max-width: 768px) {
  .ticker-container {
    height: 32px;
    font-size: 0.9rem;
  }
  
  .ticker-content {
    line-height: 32px;
  }
  
  .ticker-item {
    animation-duration: 12s; /* Faster on mobile */
  }
}
```

### React Component Structure

```typescript
const TournamentTicker: React.FC = () => {
  const [activeItems, setActiveItems] = useState<TickerItem[]>([]);
  const [queuedItems, setQueuedItems] = useState<TickerItem[]>([]);
  const [maxVisible, setMaxVisible] = useState(3);
  const [scrollDuration, setScrollDuration] = useState(15);
  
  // Calculate how many items can fit on screen
  useEffect(() => {
    const calculateMaxVisible = () => {
      const containerWidth = window.innerWidth;
      const estimatedItemWidth = 400; // pixels per item
      const spacing = 200; // stagger spacing
      return Math.max(1, Math.floor(containerWidth / spacing));
    };
    
    setMaxVisible(calculateMaxVisible());
    
    const handleResize = () => setMaxVisible(calculateMaxVisible());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Clean up expired items from both active and queued
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setActiveItems(prev => prev.filter(item => item.expiresAt > now));
      setQueuedItems(prev => prev.filter(item => item.expiresAt > now));
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle item completion (when it finishes scrolling off-screen)
  const onItemComplete = useCallback((completedItemId: string) => {
    setActiveItems(prev => {
      const newActive = prev.filter(item => item.id !== completedItemId);
      
      // Promote queued item to active if space available
      setQueuedItems(queued => {
        if (queued.length > 0 && newActive.length < maxVisible) {
          const nextItem = queued[0];
          setActiveItems(current => [...current, nextItem]);
          return queued.slice(1);
        }
        return queued;
      });
      
      return newActive;
    });
  }, [maxVisible]);
  
  // Add new ticker item
  const addTickerItem = useCallback((newItem: TickerItem) => {
    if (newItem.priority === 1) {
      // Breaking news: dramatic takeover sequence
      setIsBreakingNews(true);
      setBreakingPhase('banner');
      
      // Phase 1: Show "BREAKING NEWS" banner for 2 seconds
      setTimeout(() => {
        setBreakingPhase('content');
        setActiveItems([newItem]); // Replace with actual content
        
        // Phase 2: Show breaking content for 8 seconds
        setTimeout(() => {
          setIsBreakingNews(false);
          setBreakingPhase(null);
          // Resume normal ticker
        }, 8000);
      }, 2000);
      
    } else if (activeItems.length < maxVisible) {
      // Space available: add to active immediately
      setActiveItems(prev => [...prev, newItem]);
    } else {
      // No space: add to queue
      setQueuedItems(prev => [...prev, newItem]);
    }
  }, [activeItems.length, maxVisible]);
  
  // Listen for incremental updates
  useEffect(() => {
    const cleanup = BroadcastManager.getInstance().onTournamentDataIncremental(
      (data: TournamentDataIncremental) => {
        const newItems = generateTickerItems(data.changes, data.data, data.previousData);
        newItems.forEach(addTickerItem);
      }
    );
    
    return cleanup;
  }, [addTickerItem]);
  
  return (
    <div className="ticker-container">
      {/* Breaking News Takeover */}
      {isBreakingNews && (
        <div className="breaking-takeover">
          {breakingPhase === 'banner' && (
            <div className="breaking-banner">
              🚨 BREAKING NEWS 🚨
            </div>
          )}
          {breakingPhase === 'content' && activeItems[0] && (
            <div className="breaking-content">
              {activeItems[0].icon} {activeItems[0].content}
            </div>
          )}
        </div>
      )}
      
      {/* Normal Ticker Content */}
      {!isBreakingNews && (
        <div className="ticker-content">
          {activeItems.map((item, index) => (
            <TickerItem
              key={item.id}
              item={item}
              index={index}
              onComplete={() => onItemComplete(item.id)}
              duration={scrollDuration}
            />
          ))}
        </div>
      )}
      
      {/* Debug info */}
      <div className="ticker-debug">
        Active: {activeItems.length} | Queued: {queuedItems.length} | Max: {maxVisible}
        {isBreakingNews && ` | BREAKING: ${breakingPhase}`}
      </div>
    </div>
  );
};

// Individual ticker item component with animation lifecycle
const TickerItem: React.FC<{
  item: TickerItem;
  index: number;
  onComplete: () => void;
  duration: number;
}> = ({ item, index, onComplete, duration }) => {
  const itemRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const element = itemRef.current;
    if (!element) return;
    
    const handleAnimationEnd = () => {
      onComplete();
    };
    
    element.addEventListener('animationend', handleAnimationEnd);
    return () => element.removeEventListener('animationend', handleAnimationEnd);
  }, [onComplete]);
  
  return (
    <span
      ref={itemRef}
      className={`ticker-item ${item.priority === 1 ? 'breaking' : ''}`}
      style={{
        animationDuration: `${duration}s`,
        animationDelay: `${index * 5}s` // Stagger multiple items
      }}
    >
      {item.icon && <span className="ticker-icon">{item.icon}</span>}
      {item.content}
    </span>
  );
};
```

### Ticker Item Generation Logic

```typescript
function generateTickerItems(
  changes: GameChanges, 
  currentData: Tournament, 
  previousData?: Tournament
): TickerItem[] {
  const items: TickerItem[] = [];
  const now = new Date();
  
  // 1. High Score Detection
  if (previousData) {
    const prevHighScore = getHighestScore(previousData);
    const currentHighScore = getHighestScore(currentData);
    
    if (currentHighScore.score > prevHighScore.score) {
      items.push({
        id: `high-score-${now.getTime()}`,
        type: 'high_score',
        priority: 1,
        content: `🏆 NEW HIGH SCORE! ${currentHighScore.playerName} ${currentHighScore.score}`,
        icon: '🏆',
        color: 'yellow',
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes
        createdAt: now,
        tournamentId: currentData.tournament.id,
        divisionId: currentHighScore.divisionId,
        playerId: currentHighScore.playerId
      });
    }
  }
  
  // 2. Game Completions
  for (const game of changes.updated.filter(isGameComplete)) {
    const player1Name = getPlayerName(game.player1_id, currentData);
    const player2Name = getPlayerName(game.player2_id, currentData);
    const winner = game.player1_score! > game.player2_score! ? player1Name : player2Name;
    const loser = game.player1_score! > game.player2_score! ? player2Name : player1Name;
    const winScore = Math.max(game.player1_score!, game.player2_score!);
    const loseScore = Math.min(game.player1_score!, game.player2_score!);
    
    // Check for upsets (lower-rated player wins)
    const isUpset = checkForUpset(game, currentData);
    
    items.push({
      id: `game-${game.id}`,
      type: isUpset ? 'upset' : 'game_complete',
      priority: isUpset ? 1 : 2,
      content: isUpset 
        ? `⚡ UPSET! ${winner} defeats ${loser} ${winScore}-${loseScore}`
        : `Game Complete: ${winner} defeats ${loser} ${winScore}-${loseScore}`,
      icon: isUpset ? '⚡' : '✅',
      color: isUpset ? 'red' : 'green',
      expiresAt: new Date(now.getTime() + (isUpset ? 8 : 5) * 60 * 1000),
      createdAt: now,
      tournamentId: currentData.tournament.id,
      divisionId: game.division_id
    });
  }
  
  // 3. Round Status Updates
  const roundStatus = calculateRoundStatus(currentData);
  if (roundStatus.changed) {
    items.push({
      id: `round-${roundStatus.round}-${now.getTime()}`,
      type: 'status',
      priority: 3,
      content: `📊 Round ${roundStatus.round}: ${roundStatus.completed}/${roundStatus.total} games complete`,
      icon: '📊',
      color: 'blue',
      expiresAt: new Date(now.getTime() + 3 * 60 * 1000), // 3 minutes
      createdAt: now,
      tournamentId: currentData.tournament.id
    });
  }
  
  // 4. Milestones (Perfect games, streaks, etc.)
  const milestones = detectMilestones(changes, currentData);
  items.push(...milestones);
  
  return items;
}

// Helper functions
function isGameComplete(game: GameRow): boolean {
  return game.player1_score !== null && game.player2_score !== null;
}

function checkForUpset(game: GameRow, tournament: Tournament): boolean {
  // Logic to determine if lower-rated player won
  const player1 = getPlayer(game.player1_id, tournament);
  const player2 = getPlayer(game.player2_id, tournament);
  
  if (!player1 || !player2) return false;
  
  const winner = game.player1_score! > game.player2_score! ? player1 : player2;
  const loser = game.player1_score! > game.player2_score! ? player2 : player1;
  
  return winner.initial_rating < loser.initial_rating - 100; // 100+ rating difference
}

function detectMilestones(changes: GameChanges, tournament: Tournament): TickerItem[] {
  const items: TickerItem[] = [];
  const now = new Date();
  
  // Perfect games (700+ points)
  for (const game of changes.updated.filter(isGameComplete)) {
    if (game.player1_score! >= 700 || game.player2_score! >= 700) {
      const score = Math.max(game.player1_score!, game.player2_score!);
      const playerId = game.player1_score! > game.player2_score! ? game.player1_id : game.player2_id;
      const playerName = getPlayerName(playerId, tournament);
      
      items.push({
        id: `perfect-${game.id}`,
        type: 'milestone',
        priority: 1,
        content: `🎯 PERFECT GAME! ${playerName} scores ${score}`,
        icon: '🎯',
        color: 'yellow',
        expiresAt: new Date(now.getTime() + 8 * 60 * 1000),
        createdAt: now,
        tournamentId: tournament.tournament.id,
        divisionId: game.division_id,
        playerId: playerId
      });
    }
  }
  
  return items;
}
```

## 🎯 Integration with Tournament System

### URL Structure
- `/users/:userId/overlay/ticker` - Shows all tournament updates for user
- `/users/:userId/overlay/ticker/:tournamentId` - Specific tournament
- `/users/:userId/overlay/ticker/:tournamentId/:divisionId` - Division-specific

### OBS Integration
- **Browser Source**: Add as full-width overlay at bottom of stream
- **Recommended Size**: 1920x60 for 1080p streams, 1280x40 for 720p
- **Positioning**: Bottom of screen, above any lower thirds
- **Layering**: Above main content, below pop-up animations

### Configuration Options
```typescript
interface TickerConfig {
  speed: 'slow' | 'medium' | 'fast'; // Scroll speed
  maxItems: number; // Max items in queue
  showIcons: boolean; // Show emoji icons
  categories: TickerItemType[]; // Which types to show
  breakingNewsEnabled: boolean; // Allow breaking news interruptions
  divisionFilter?: number; // Only show specific division
}
```

## 🎪 Advanced Features

### Smart Content Management
- **Duplicate Detection**: Don't repeat identical score updates
- **Relevance Scoring**: Prioritize close games, dramatic finishes
- **Context Awareness**: Show division names when multiple tournaments active
- **Language Localization**: Support for multiple languages

### Visual Enhancements
- **Color Coding**: Red alerts, green completions, blue status, yellow records
- **Typography**: Bold for breaking news, italic for status updates
- **Animations**: Pulse for breaking news, smooth scrolling for normal content
- **Responsive Design**: Scales for different screen sizes

### Performance Optimizations
- **Virtual Scrolling**: Only render visible content
- **Efficient Updates**: Batch multiple changes into single ticker update
- **Memory Management**: Automatic cleanup of expired items
- **CSS GPU Acceleration**: Use transform3d for smooth animations

### Interactive Features
- **Pause on Hover**: Allow users to read current content
- **Click Actions**: Link to specific games or player profiles
- **Speed Control**: User-adjustable scroll speed
- **Filter Controls**: Toggle categories on/off

## 📊 Analytics & Monitoring

### Metrics to Track
- **Item Generation Rate**: How many ticker items per minute
- **Item Types Distribution**: Which categories are most common
- **Scroll Performance**: Frame rate, smoothness metrics
- **User Engagement**: Hover time, click-through rates

### Debug Features
```typescript
interface TickerDebugInfo {
  totalItems: number;
  itemsByType: Record<TickerItemType, number>;
  oldestItem: Date;
  newestItem: Date;
  scrollSpeed: number;
  memoryUsage: number;
}
```

## 🚀 Implementation Roadmap

### Phase 1: Basic Ticker (1-2 weeks)
- Single-line scrolling ticker
- Basic item types (scores, completions, high scores)
- Integration with incremental updates
- Simple CSS animations

### Phase 2: Enhanced Content (2-3 weeks)
- Upset detection and milestones
- Breaking news priority system
- Color coding and icons
- Responsive design

### Phase 3: Advanced Features (3-4 weeks)
- Multi-line ticker option
- Interactive features (pause, click)
- Configuration options
- Performance optimizations

### Phase 4: Analytics & Polish (1-2 weeks)
- Debug information
- Performance monitoring
- User engagement tracking
- Documentation and examples

---

**The ticker system leverages your existing incremental update architecture to provide real-time, contextual information in a classic broadcast format. It's perfect for adding professional polish to tournament streams while showcasing the power of your real-time data system.**