# PubSub Typeclass Approach for Testable BroadcastChannel

## The Problem

How do we test code that uses BroadcastChannel without actual browser APIs?

## The Solution

**Dependency Inversion**: Program to an interface (typeclass), not an implementation.

```purescript
class PubSub channel where
  create :: String -> Effect channel
  postMessage :: channel -> Json -> Effect Unit
  subscribe :: channel -> Effect (Emitter Json)
  close :: channel -> Effect Unit
```

## Two Implementations

### 1. Production: Real BroadcastChannel

```purescript
-- src/PubSub/BroadcastChannel.purs
newtype BroadcastChannelPubSub = BroadcastChannelPubSub BC.BroadcastChannel

instance PubSub BroadcastChannelPubSub where
  create name = BroadcastChannel.new name >>= pure <<< BroadcastChannelPubSub
  postMessage (BroadcastChannelPubSub ch) = BroadcastChannel.postMessage ch
  -- ...
```

### 2. Testing: In-Memory

```purescript
-- src/PubSub/InMemory.purs
newtype InMemoryChannel = InMemoryChannel
  { listeners :: Ref (Array (Json -> Effect Unit))
  }

instance PubSub InMemoryChannel where
  create _ = do
    listeners <- Ref.new []
    pure $ InMemoryChannel { listeners }

  postMessage (InMemoryChannel { listeners }) msg = do
    listenerArray <- Ref.read listeners
    traverse_ (\listener -> listener msg) listenerArray
  -- ...
```

## Usage in Production

```purescript
-- src/Component/Overlay/BaseOverlay.purs
import PubSub.BroadcastChannel (productionChannel)
import PubSub.Class (postMessage, subscribe)

Initialize -> do
  -- Create channel (polymorphic over PubSub typeclass)
  channel <- liftEffect $ productionChannel "tournament-data"

  -- Subscribe
  emitter <- liftEffect $ subscribe channel
  H.subscribe emitter <#> HandleMessage

  -- Post messages
  liftEffect $ postMessage channel myMessage
```

## Usage in Tests

```purescript
-- test/Test/Component/OverlaySpec.purs
import PubSub.InMemory (testChannel)
import PubSub.Class (postMessage, subscribe)

it "receives broadcast messages" do
  -- Create in-memory channel
  channel <- liftEffect $ testChannel "test"

  -- Subscribe
  received <- liftEffect $ Ref.new []
  { listener } <- liftEffect $ HS.subscribe =<< subscribe channel
  liftEffect $ HS.notify listener \msg ->
    Ref.modify_ (_ <> [msg]) received

  -- Simulate message
  liftEffect $ postMessage channel testMessage

  -- Verify delivery
  messages <- liftEffect $ Ref.read received
  messages `shouldEqual` [testMessage]
```

## Benefits

### ✅ Type Safety
The typeclass ensures both implementations have the same interface.

### ✅ Testability
Tests run in pure PureScript - no browser APIs needed.

### ✅ No Mocking Framework
We don't need complex mocking - just a different implementation.

### ✅ Production Code Unchanged
Components use the same PubSub interface in production and tests.

### ✅ Easy to Verify
Tests can inspect the in-memory implementation directly.

## Full Integration Test Example

```purescript
describe "Message Flow Integration" do
  it "delivers game updates from worker to overlay" do
    -- Create shared in-memory channel
    channel <- liftEffect $ testChannel "tournament-data"

    -- Simulate worker
    let workerPostUpdate msg =
          liftEffect $ postMessage channel (encodeJson msg)

    -- Simulate overlay
    received <- liftEffect $ Ref.new Nothing
    { listener } <- liftEffect $ HS.subscribe =<< subscribe channel
    liftEffect $ HS.notify listener \json ->
      case decodeJson json of
        Right msg -> Ref.write (Just msg) received
        Left _ -> pure unit

    -- Worker sends update
    let gameUpdate = CurrentMatch {...}
    workerPostUpdate gameUpdate

    delay (Milliseconds 10.0)

    -- Overlay receives it
    result <- liftEffect $ Ref.read received
    result `shouldEqual` Just gameUpdate
```

## Migration Path

### Phase 1: Create Typeclass (✅ Done)
- `src/PubSub/Class.purs`
- `src/PubSub/InMemory.purs`
- `src/PubSub/BroadcastChannel.purs`

### Phase 2: Update Components
Replace direct BroadcastChannel usage with PubSub typeclass:

```purescript
-- Before:
import BroadcastChannel.BroadcastChannel as BC

Initialize -> do
  channel <- liftEffect $ BC.new "tournament-data"
  BC.addEventListener channel "message" handleMessage

-- After:
import PubSub.Class (subscribe, postMessage)
import PubSub.BroadcastChannel (productionChannel)

Initialize -> do
  channel <- liftEffect $ productionChannel "tournament-data"
  emitter <- liftEffect $ subscribe channel
  H.subscribe emitter <#> HandleMessage
```

### Phase 3: Write Tests
Now you can test components with in-memory channels!

```purescript
-- test/Test/Component/OverlayIntegrationSpec.purs
describe "Overlay receives game updates" do
  it "updates state when message arrives" do
    channel <- liftEffect $ testChannel "test"
    -- ... test using in-memory channel
```

## Advantages Over Mocking

### Traditional Mocking (Complex)
```typescript
// JavaScript/TypeScript
const mockChannel = {
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  // ... complex mock setup
}

// Still doesn't test the actual flow!
```

### Typeclass Approach (Simple)
```purescript
-- PureScript
channel <- liftEffect $ testChannel "test"
-- Just use it! It's a real implementation, just in-memory.
```

## Testing Different Scenarios

### Test 1: Message Delivery
```purescript
it "delivers messages to all subscribers" do
  channel <- liftEffect $ testChannel "test"
  -- Subscribe, post, verify
```

### Test 2: Multiple Subscribers
```purescript
it "delivers to multiple subscribers" do
  channel <- liftEffect $ testChannel "test"
  sub1 <- liftEffect $ subscribe channel
  sub2 <- liftEffect $ subscribe channel
  -- Both receive the message
```

### Test 3: Message Ordering
```purescript
it "maintains message order" do
  channel <- liftEffect $ testChannel "test"
  postMessage channel msg1
  postMessage channel msg2
  postMessage channel msg3
  -- Verify order: [msg1, msg2, msg3]
```

### Test 4: Cleanup
```purescript
it "stops receiving after close" do
  channel <- liftEffect $ testChannel "test"
  subscribe channel
  close channel
  postMessage channel msg
  -- Verify: no message received
```

## Why This is Better

1. **No Browser APIs** - Tests run in Node.js
2. **Deterministic** - No timing issues
3. **Fast** - In-memory operations
4. **Inspectable** - Can check internal state
5. **Type-Safe** - Compiler ensures correctness

## Summary

```
Production:  Component --[PubSub]--> BroadcastChannel --[FFI]--> Browser API
Testing:     Component --[PubSub]--> InMemoryChannel --[Ref]--> Pure PureScript
```

Same component code, different channel implementation!

---

**Files to implement this**:
- ✅ `src/PubSub/Class.purs`
- ✅ `src/PubSub/InMemory.purs`
- ✅ `src/PubSub/BroadcastChannel.purs`
- ✅ `test/Test/PubSub/IntegrationSpec.purs`

**Next step**: Migrate BaseOverlay to use the typeclass!
