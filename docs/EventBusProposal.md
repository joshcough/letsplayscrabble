# Streaming Event Bus Architecture

## Executive Summary

What started as a tournament notification system has evolved into a general-purpose **streaming event bus** - a universal system for managing real-time events and animations across streaming platforms. This architecture enables loose coupling between event producers and consumers, making it suitable for tournaments, gaming streams, live events, and any streaming context.

## Evolution Path

```
Simple Animations → Queue System → Admin Controls → Centralized Detection → Event Bus
```

1. **Simple Animations**: Individual overlay pages with notification logic
2. **Queue System**: Multiple notifications from same update played sequentially
3. **Admin Controls**: Need to cancel/replay animations remotely
4. **Centralized Detection**: Avoid duplicate detection across overlays
5. **Event Bus**: Universal system for any streaming events

## Core Architecture

### High-Level System Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Event         │    │   Event Bus      │    │   Event         │
│   Producers     │───▶│   (WebSocket)    │───▶│   Consumers     │
│                 │    │                  │    │                 │
│ • Game Updates  │    │ • Event Storage  │    │ • Overlays      │
│ • Admin Actions │    │ • Broadcasting   │    │ • Admin Panel   │
│ • User Events   │    │ • Lifecycle Mgmt │    │ • Analytics     │
│ • System Events │    │                  │    │ • Logging       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Detailed Architecture Diagram

```
                    STREAMING EVENT BUS ARCHITECTURE
                    
┌─────────────────────────────────────────────────────────────────────────┐
│                              EVENT PRODUCERS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │    Game      │  │    Admin     │  │   System     │  │   Custom    │  │
│  │   Updates    │  │   Actions    │  │   Events     │  │   Triggers  │  │
│  │              │  │              │  │              │  │             │  │
│  │ • Score      │  │ • Announce   │  │ • Player     │  │ • Manual    │  │
│  │ • Win Streak │  │ • Cancel     │  │   Register   │  │   Test      │  │
│  │ • High Score │  │ • Replay     │  │ • Technical  │  │ • Webhook   │  │
│  │ • Round End  │  │ • Broadcast  │  │   Alert      │  │ • API Call  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                  │                                      │
│                                  ▼                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           CENTRAL EVENT BUS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    EVENT DETECTION SERVICE                          │ │
│  │                                                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │ │
│  │  │ High Score   │  │ Win Streak   │  │   Custom     │             │ │
│  │  │  Detector    │  │  Detector    │  │  Detectors   │    ...      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                        EVENT STORAGE                                │ │
│  │                                                                     │ │
│  │  events (                                                           │ │
│  │    id, type, data, tournament_id, created_at,                       │ │
│  │    status, priority, metadata                                       │ │
│  │  )                                                                  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    WEBSOCKET BROADCASTER                            │ │
│  │                                                                     │ │
│  │  • Distributes events to all connected consumers                   │ │
│  │  • Handles connection management                                    │ │
│  │  • Routes events based on subscriptions                            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                  │                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             EVENT CONSUMERS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Game       │  │    Info      │  │    Admin     │  │  Analytics  │  │
│  │  Overlays    │  │  Overlays    │  │   Panel      │  │   System    │  │
│  │              │  │              │  │              │  │             │  │
│  │ • Animations │  │ • Announce   │  │ • Live       │  │ • Event Log │  │
│  │ • High Score │  │ • Timers     │  │   Monitor    │  │ • Metrics   │  │
│  │ • Win Streak │  │ • Countdown  │  │ • Controls   │  │ • Reports   │  │
│  │ • Queue Mgmt │  │ • Messages   │  │ • History    │  │ • Insights  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Event Lifecycle

### Standard Event Flow

```
1. EVENT DETECTION
   ├─ Game update triggers detector
   ├─ Admin action creates event
   └─ System condition met

2. EVENT CREATION
   ├─ Assign unique ID
   ├─ Store in database
   ├─ Add metadata (timestamp, source, etc.)
   └─ Determine event class

3. EVENT BROADCAST
   ├─ Send via WebSocket to all consumers
   ├─ Include full event data
   └─ Route based on subscriptions

4. EVENT CONSUMPTION
   ├─ Overlays decide to show/ignore
   ├─ Queue for animated events
   ├─ Process immediately for data events
   └─ Log for analytics

5. EVENT LIFECYCLE MANAGEMENT
   ├─ Track active animations
   ├─ Handle cancel/replay commands
   ├─ Clean up completed events
   └─ Update status in database
```

## Event Classification

### Event Types by Handling Requirements

```
┌─────────────────────────────────────────────────────────────────┐
│                        EVENT CLASSES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                ANIMATED NOTIFICATIONS                       │ │
│  │                                                             │ │
│  │  • Full lifecycle: queue → show → cancel/complete          │ │
│  │  • Requires unique ID for tracking                         │ │
│  │  • Can be replayed from history                            │ │
│  │  • Examples: High scores, win streaks, upsets              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    DATA EVENTS                              │ │
│  │                                                             │ │
│  │  • State updates, no animation required                    │ │
│  │  • Immediate processing                                     │ │
│  │  • Examples: Score updates, player status, round progress  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   SIMPLE ALERTS                            │ │
│  │                                                             │ │
│  │  • Fire-and-forget notifications                           │ │
│  │  • No cancellation needed                                  │ │
│  │  • Examples: System messages, chat highlights              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   SYSTEM EVENTS                            │ │
│  │                                                             │ │
│  │  • Internal operations, logging                            │ │
│  │  • Not displayed to viewers                                │ │
│  │  • Examples: Connection status, errors, performance        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Event Structure

```typescript
interface BaseEvent {
  id: string;
  type: string;
  timestamp: number;
  source: string;
  metadata: {
    tournament_id?: number;
    division_id?: number;
    user_id?: number;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    tags?: string[];
  };
}

interface AnimatedEvent extends BaseEvent {
  class: 'animated';
  data: any;
  duration?: number;
  cancelable: boolean;
  replayable: boolean;
}

interface DataEvent extends BaseEvent {
  class: 'data';
  payload: any;
  persistent: boolean;
}

interface SimpleAlert extends BaseEvent {
  class: 'alert';
  message: string;
  level: 'info' | 'warning' | 'error';
}

interface SystemEvent extends BaseEvent {
  class: 'system';
  internal: true;
  severity: 'debug' | 'info' | 'warn' | 'error';
}

type StreamingEvent = AnimatedEvent | DataEvent | SimpleAlert | SystemEvent;
```

### WebSocket Message Types

```typescript
// Event Broadcasting
interface EventBroadcast {
  type: 'EVENT_BROADCAST';
  event: StreamingEvent;
}

// Animation Control
interface AnimationControl {
  type: 'ANIMATION_CANCEL' | 'ANIMATION_REPLAY';
  eventId: string;
  targetOverlay?: string;
}

// Status Updates
interface StatusUpdate {
  type: 'ANIMATION_STARTED' | 'ANIMATION_ENDED' | 'ANIMATION_CANCELLED';
  eventId: string;
  overlay: string;
  timestamp: number;
}

// Subscription Management
interface Subscription {
  type: 'SUBSCRIBE' | 'UNSUBSCRIBE';
  eventTypes: string[];
  overlayId: string;
}
```

### Database Schema

```sql
-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  class VARCHAR(20) NOT NULL, -- 'animated', 'data', 'alert', 'system'
  data JSONB NOT NULL,
  metadata JSONB,
  
  -- Context
  tournament_id INTEGER REFERENCES tournaments(id),
  division_id INTEGER REFERENCES divisions(id),
  user_id INTEGER REFERENCES users(id),
  
  -- Properties
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Animation specific
  duration_ms INTEGER,
  cancelable BOOLEAN DEFAULT true,
  replayable BOOLEAN DEFAULT true
);

-- Event subscriptions (which overlays want which events)
CREATE TABLE event_subscriptions (
  id SERIAL PRIMARY KEY,
  overlay_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(overlay_id, event_type)
);

-- Animation status tracking
CREATE TABLE animation_status (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  overlay_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'queued', 'playing', 'completed', 'cancelled'
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  
  UNIQUE(event_id, overlay_id)
);
```

## Use Cases & Applications

### Tournament Streaming (Current)
- **Game Events**: High scores, win streaks, upsets, milestones
- **Administrative**: Announcements, round timers, schedule changes
- **Social**: Player achievements, community highlights

### Gaming Streams
- **Performance**: Kill streaks, level ups, achievements unlocked
- **Audience**: Follower milestones, donation alerts, chat reactions
- **Technical**: Stream quality changes, mod actions

### Live Events
- **Competition**: Score updates, leaderboard changes, record breaks
- **Production**: Scene transitions, commercial breaks, technical difficulties
- **Audience**: Participation metrics, social media mentions

### Educational Streaming
- **Content**: Chapter progress, quiz results, milestone completions
- **Interaction**: Q&A highlights, poll results, attendance tracking
- **Technical**: Breakout room status, recording state

### Business Presentations
- **Content**: Slide transitions, demo milestones, product reveals
- **Audience**: Attendee count, engagement metrics, chat highlights
- **Administrative**: Schedule updates, speaker introductions

## API Design

### REST Endpoints

```typescript
// Event Management
POST   /api/events                    // Create new event
GET    /api/events                    // List events (with filters)
GET    /api/events/:id                // Get specific event
PUT    /api/events/:id/cancel         // Cancel event
POST   /api/events/:id/replay         // Replay event

// Event Types & Templates
GET    /api/event-types               // List available event types
POST   /api/event-types               // Create custom event type
GET    /api/event-templates           // Get event templates

// Subscriptions
GET    /api/subscriptions/:overlayId  // Get overlay subscriptions
PUT    /api/subscriptions/:overlayId  // Update subscriptions

// Analytics
GET    /api/analytics/events          // Event analytics
GET    /api/analytics/overlays        // Overlay performance
```

### WebSocket Interface

```typescript
class StreamingEventBus {
  // Connection management
  connect(overlayId: string): WebSocket;
  disconnect(overlayId: string): void;
  
  // Event publishing
  publishEvent(event: StreamingEvent): void;
  cancelEvent(eventId: string): void;
  replayEvent(eventId: string): void;
  
  // Subscriptions
  subscribe(overlayId: string, eventTypes: string[]): void;
  unsubscribe(overlayId: string, eventTypes: string[]): void;
  
  // Status tracking
  reportStatus(eventId: string, status: AnimationStatus): void;
}
```

## Benefits & Advantages

### For Developers
- **Loose Coupling**: Components don't need to know about each other
- **Extensibility**: Easy to add new event types and consumers
- **Testability**: Events can be mocked and replayed
- **Debuggability**: Complete event audit trail

### For Content Creators
- **Flexibility**: Mix and match different overlay combinations
- **Control**: Real-time management of all stream elements
- **Reliability**: Centralized system reduces coordination issues
- **Analytics**: Data on what events engage audiences most

### For Platform Operators
- **Scalability**: New streaming contexts without rebuilding core system
- **Monetization**: Premium event types, advanced analytics
- **Integration**: Easy to connect with external services
- **Standardization**: Common interface across different streaming tools

## Implementation Phases

### Phase 1: Foundation (Current + Event Bus)
- Convert existing notification system to event bus pattern
- Implement basic WebSocket broadcasting
- Create event storage and lifecycle management
- Maintain backward compatibility with current overlays

### Phase 2: Administration & Control
- Admin panel for event monitoring and control
- Real-time event cancellation and replay
- Subscription management interface
- Basic analytics dashboard

### Phase 3: Extensibility
- Plugin system for custom event types
- Template system for rapid event creation
- Advanced routing and filtering
- Performance monitoring and optimization

### Phase 4: Platform Features
- Multi-tenant support for different organizations
- Advanced analytics and insights
- Integration APIs for third-party services
- White-label deployment options

## Technical Considerations

### Scalability
- **WebSocket Connection Management**: Handle thousands of concurrent overlays
- **Event Throughput**: Process high-frequency events without lag
- **Database Performance**: Efficient querying of event history
- **Memory Management**: Queue size limits and cleanup strategies

### Reliability
- **Event Durability**: Persist events to survive system restarts
- **Connection Recovery**: Automatic reconnection for overlays
- **Error Handling**: Graceful degradation when services fail
- **Monitoring**: Health checks and alerting

### Security
- **Authentication**: Verify overlay and admin identities
- **Authorization**: Control which overlays can see which events
- **Input Validation**: Sanitize event data to prevent XSS
- **Rate Limiting**: Prevent event spam and DoS attacks

## Future Possibilities

### Advanced Features
- **AI-Powered Events**: Machine learning to detect interesting moments
- **Dynamic Prioritization**: Smart event routing based on audience engagement
- **Multi-Stream Coordination**: Synchronize events across multiple streams
- **Predictive Analytics**: Forecast optimal event timing

### Ecosystem Integration
- **OBS Plugin**: Native integration with OBS Studio
- **Streaming Platform APIs**: Direct integration with Twitch, YouTube, etc.
- **Hardware Integration**: Support for physical controllers and displays
- **Cloud Services**: Managed hosting and global distribution

### Monetization
- **Premium Event Types**: Advanced animations and effects
- **Analytics Plus**: Detailed audience engagement insights
- **White Label**: Custom branding for organizations
- **API Access**: Programmatic event creation for developers

## Conclusion

The evolution from tournament notifications to a streaming event bus represents a significant architectural advancement. By generalizing the problem domain, we've created a system that can serve not just tournament streaming, but any real-time streaming context that needs coordinated event management.

The key insight is that **events are the universal language of streaming** - whether it's a high score in a tournament, a donation on a gaming stream, or a poll result in a webinar, they all follow similar patterns of detection, distribution, and display.

This architecture provides the foundation for building a comprehensive streaming platform that can adapt to diverse use cases while maintaining clean separation of concerns and excellent developer experience.

---

*"What started as a way to show high score animations became the foundation for reimagining how streaming events work."*