# Integration Testing Strategy

## The Challenge

How do we verify that a game update message travels all the way from the backend to an overlay component?

## The Flow

```
Backend
  ↓ WebSocket
Worker (WorkerSocketManager)
  ↓ BroadcastChannel.postMessage()
Overlay Component (BaseOverlay)
  ↓ subscription
HandleTournamentData action
  ↓ state update
Component re-renders with new data
```

## Testing Layers

### ✅ Layer 1: JSON Codecs (Already Tested)

```purescript
-- test/Test/Types/CurrentMatchSpec.purs
it "should round trip correctly" do
  shouldRoundTrip (CurrentMatch {...})
```

**What it proves**: Messages can be serialized/deserialized correctly.

### ✅ Layer 2: Message Types (Already Tested via JSON)

```purescript
-- Messages have proper types
type TournamentDataResponse =
  { tournament :: Tournament
  , divisionName :: String
  }
```

**What it proves**: Message structure is type-safe.

### 🟡 Layer 3: State Update Logic (Can Test)

```purescript
-- Test the pure state transformation
describe "HandleTournamentData" do
  it "updates state correctly" do
    let newState = updateState initialState tournamentData
    newState.tournament `shouldEqual` Just tournamentData
    newState.loading `shouldEqual` false
```

**What it proves**: State updates happen correctly when data arrives.

### 🔴 Layer 4: BroadcastChannel Integration (Hard to Test)

```purescript
-- This is hard because BroadcastChannel is FFI
manager <- liftEffect BroadcastManager.create
H.subscribe manager.tournamentDataResponseEmitter
```

**The problem**: BroadcastChannel is JavaScript, not pure PureScript.

## Practical Testing Approaches

### Approach 1: Manual Integration Test

Create a test page that verifies the flow:

```purescript
-- test-pages/BroadcastTest.html
1. Open Worker page
2. Open Overlay page
3. Trigger game update in worker
4. Verify overlay receives update
5. Check console logs for message flow
```

**Pros**: Tests real behavior
**Cons**: Manual, not automated

### Approach 2: Mock BroadcastChannel

Create a test double for BroadcastChannel:

```purescript
-- test/Test/Mock/BroadcastChannel.purs
module Test.Mock.BroadcastChannel where

type MockBroadcastChannel =
  { messages :: Ref (Array Json)
  , listeners :: Ref (Array (Json -> Effect Unit))
  }

-- Create a fake channel that stores messages in memory
create :: Effect MockBroadcastChannel

-- Post a message (stores it)
postMessage :: MockBroadcastChannel -> Json -> Effect Unit

-- Simulate receiving a message
simulateMessage :: MockBroadcastChannel -> Json -> Effect Unit
```

Then test:

```purescript
describe "Broadcast Integration" do
  it "delivers messages to subscribers" do
    channel <- createMock
    messages <- newRef []

    -- Subscribe
    addEventListener channel \msg ->
      modifyRef messages (_ <> [msg])

    -- Post message
    postMessage channel testMessage

    -- Verify delivery
    received <- readRef messages
    length received `shouldEqual` 1
```

**Pros**: Automated, repeatable
**Cons**: Requires mock implementation

### Approach 3: Property-Based Testing

Test the properties that must hold:

```purescript
-- test/Test/Properties/BroadcastSpec.purs
describe "Broadcast Properties" do
  it "every message sent must be receivable" do
    quickCheck \(msg :: TournamentDataResponse) ->
      let
        encoded = encodeJson msg
        decoded = decodeJson encoded
      in
        decoded === Right msg
```

**What it proves**: Messages maintain their shape through serialization.

### Approach 4: Smoke Test (Recommended)

Add logging and verify manually:

```purescript
-- src/Component/Overlay/BaseOverlay.purs
HandleTournamentData response -> do
  -- Add comprehensive logging
  liftEffect $ Console.log "[BaseOverlay] Received tournament data"
  liftEffect $ Console.log $ "  Tournament: " <> response.tournament.name
  liftEffect $ Console.log $ "  Division: " <> response.divisionName

  -- Update state
  H.modify_ _ { tournament = Just response, loading = false }

  liftEffect $ Console.log "[BaseOverlay] State updated successfully"
```

Then test manually:
1. Open browser console
2. Trigger a game update
3. Verify logs show: message received → state updated → component rendered

**Pros**: Simple, effective for debugging
**Cons**: Not automated

## Recommended Strategy

**For Development**: Use Approach 4 (logging) + manual verification

**For CI/CD**: Consider Approach 2 (mocks) if integration bugs become common

**For Confidence**: Use Approach 1 (manual test page) before major releases

## Why Full Integration Tests Are Hard

1. **BroadcastChannel is a browser API**
   - Not available in Node.js test environment
   - Requires real browser or jsdom

2. **Halogen components are effectful**
   - They run in the Aff monad
   - Testing requires running the component

3. **Timing issues**
   - Messages are asynchronous
   - Need to wait for subscriptions to be set up

4. **State inspection**
   - Component state is encapsulated
   - Can't easily inspect without test-specific code

## What We CAN Reliably Test

✅ **JSON round trips** - Already done
✅ **Type safety** - Compiler enforces this
✅ **Pure state transformations** - Can unit test
✅ **Message parsing** - Already tested

## What We SHOULD Manually Verify

🔍 **Worker receives WebSocket messages**
🔍 **Worker broadcasts to components**
🔍 **Components subscribe correctly**
🔍 **Components update state**
🔍 **UI renders new data**

## Confidence Through Architecture

Instead of complex integration tests, gain confidence through:

1. **Strong types** - Impossible to send wrong message type
2. **Exhaustive patterns** - Compiler ensures all cases handled
3. **Pure functions** - Easy to test in isolation
4. **Clear separation** - Worker ↔ Channel ↔ Component
5. **Logging** - Visibility into message flow

## Example Manual Test Checklist

```
□ Open worker page (http://localhost:4000/worker.html)
□ Open overlay page (http://localhost:4000/index.html?userId=2&tournamentId=135&divisionId=237)
□ Check console: "[Worker] Connected to WebSocket"
□ Check console: "[BaseOverlay] Created broadcast manager"
□ Check console: "[BaseOverlay] Subscribed to broadcast channel"
□ Trigger game update in backend
□ Check console: "[Worker] Received game update"
□ Check console: "[Worker] Broadcasting to overlays"
□ Check console: "[BaseOverlay] Received tournament data"
□ Check console: "[BaseOverlay] State updated successfully"
□ Verify: Overlay displays updated game data
```

## Future: Automated E2E Tests

If we want full automation, consider:

- **Playwright** or **Puppeteer** for browser automation
- **Cypress** for E2E testing
- Open two browser contexts (worker + overlay)
- Simulate WebSocket message
- Verify DOM updates

But for now, **manual verification with good logging is sufficient** because:
- Type system prevents most bugs
- Message structure is tested
- Component logic is pure
- Architecture is simple and clear

---

**Bottom line**: We can't easily unit test BroadcastChannel integration, but we can:
1. Test all the parts we control
2. Use strong types to prevent errors
3. Add logging for visibility
4. Manually verify the flow works
