module Test.PubSub.IntegrationSpec where

import Prelude

import Data.Argonaut.Core (fromString, stringify)
import Data.Argonaut.Decode (decodeJson)
import Data.Argonaut.Encode (encodeJson)
import Data.Array (length, (!!))
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..))
import Effect.Aff (Aff, Milliseconds(..), delay)
import Effect.Class (liftEffect)
import Effect.Ref as Ref
import Halogen.Subscription (Listener)
import Halogen.Subscription as HS
import PubSub.Class (class PubSub, postMessage)
import PubSub.Class as PubSub
import PubSub.InMemory (InMemoryChannel, testChannel)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Types.CurrentMatch (CurrentMatch(..))

spec :: Spec Unit
spec =
  describe "PubSub Integration Tests" do
    describe "InMemory PubSub" do
      it "delivers messages to subscribers" do
        testMessageDelivery

      it "handles multiple subscribers" do
        testMultipleSubscribers

      it "delivers typed messages correctly" do
        testTypedMessages

-- | Test basic message delivery
testMessageDelivery :: Aff Unit
testMessageDelivery = do
  -- Create channel
  channel <- liftEffect $ testChannel "test-channel"

  -- Track received messages
  received <- liftEffect $ Ref.new []

  -- Subscribe
  emitter <- liftEffect $ PubSub.subscribe channel
  _ <- liftEffect $ HS.subscribe emitter \msg ->
    Ref.modify_ (_ <> [msg]) received

  -- Post a message
  let testMessage = fromString "Hello, World!"
  liftEffect $ postMessage channel testMessage

  -- Small delay to ensure message is processed
  delay (Milliseconds 10.0)

  -- Verify delivery
  messages <- liftEffect $ Ref.read received
  (length messages) `shouldEqual` 1
  (stringify <$> (messages !! 0)) `shouldEqual` (Just $ stringify testMessage)

-- | Test multiple subscribers receive the same message
testMultipleSubscribers :: Aff Unit
testMultipleSubscribers = do
  channel <- liftEffect $ testChannel "multi-test"

  -- Create two subscribers
  received1 <- liftEffect $ Ref.new []
  received2 <- liftEffect $ Ref.new []

  emitter <- liftEffect $ PubSub.subscribe channel

  _ <- liftEffect $ HS.subscribe emitter \msg ->
    Ref.modify_ (_ <> [msg]) received1

  _ <- liftEffect $ HS.subscribe emitter \msg ->
    Ref.modify_ (_ <> [msg]) received2

  -- Post message
  let testMessage = fromString "Broadcast!"
  liftEffect $ postMessage channel testMessage

  delay (Milliseconds 10.0)

  -- Both should receive it
  messages1 <- liftEffect $ Ref.read received1
  messages2 <- liftEffect $ Ref.read received2

  (length messages1) `shouldEqual` 1
  (stringify <$> (messages1 !! 0)) `shouldEqual` (Just $ stringify testMessage)
  (length messages2) `shouldEqual` 1
  (stringify <$> (messages2 !! 0)) `shouldEqual` (Just $ stringify testMessage)

-- | Test typed messages (CurrentMatch)
testTypedMessages :: Aff Unit
testTypedMessages = do
  channel <- liftEffect $ testChannel "typed-test"

  -- Track decoded messages
  received <- liftEffect $ Ref.new []

  emitter <- liftEffect $ PubSub.subscribe channel
  _ <- liftEffect $ HS.subscribe emitter \json ->
    case decodeJson json of
      Right (msg :: CurrentMatch) ->
        Ref.modify_ (_ <> [msg]) received
      Left _ ->
        pure unit -- Ignore decode errors in this test

  -- Create and send a typed message
  let
    original = CurrentMatch
      { tournamentId: 123
      , divisionId: 456
      , divisionName: "Test Division"
      , round: 5
      , pairingId: Nothing
      , updatedAt: "2025-12-01T10:00:00Z"
      }

  liftEffect $ postMessage channel (encodeJson original)

  delay (Milliseconds 10.0)

  -- Verify we received the typed message
  messages <- liftEffect $ Ref.read received
  messages `shouldEqual` [original]

-- | Example: Testing a component that uses PubSub
-- This shows how you would test a real component
testComponentIntegration :: forall channel. PubSub channel => channel -> Aff Unit
testComponentIntegration channel = do
  -- 1. Subscribe to messages (simulating component Initialize)
  received <- liftEffect $ Ref.new Nothing

  emitter <- liftEffect $ PubSub.subscribe channel
  _ <- liftEffect $ HS.subscribe emitter \json ->
    case decodeJson json of
      Right (msg :: CurrentMatch) ->
        Ref.write (Just msg) received
      Left _ ->
        pure unit

  -- 2. Simulate worker posting a message
  let
    gameUpdate = CurrentMatch
      { tournamentId: 100
      , divisionId: 200
      , divisionName: "Division A"
      , round: 3
      , pairingId: Nothing
      , updatedAt: "2025-12-01T15:00:00Z"
      }

  liftEffect $ postMessage channel (encodeJson gameUpdate)

  delay (Milliseconds 10.0)

  -- 3. Verify component received and processed the message
  result <- liftEffect $ Ref.read received
  result `shouldEqual` Just gameUpdate
