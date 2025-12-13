-- | In-memory pub/sub implementation for testing
module PubSub.InMemory where

import Prelude

import Data.Argonaut.Core (Json)
import Data.Foldable (traverse_)
import Effect (Effect)
import Effect.Ref (Ref)
import Effect.Ref as Ref
import Halogen.Subscription as HS
import PubSub.Class (class PubSub, create, postMessage)

-- | In-memory channel that stores messages and listeners
newtype InMemoryChannel = InMemoryChannel
  { name :: String
  , listeners :: Ref (Array (Json -> Effect Unit))
  }

instance PubSub InMemoryChannel where
  create name = do
    listeners <- Ref.new []
    pure $ InMemoryChannel { name, listeners }

  postMessage (InMemoryChannel { listeners }) message = do
    -- Notify all listeners
    listenerArray <- Ref.read listeners
    traverse_ (\listener -> listener message) listenerArray

  subscribe (InMemoryChannel { listeners }) =
    pure $ HS.makeEmitter \push -> do
      -- Add this push function as a listener
      Ref.modify_ (_ <> [push]) listeners

      -- Return cleanup function (no-op for testing - we keep all listeners)
      pure $ pure unit

  close (InMemoryChannel { listeners }) =
    Ref.write [] listeners

-- | Helper to create and test a channel
testChannel :: String -> Effect InMemoryChannel
testChannel = create

-- | Post a message and verify it was received
simulateMessage :: InMemoryChannel -> Json -> Effect Unit
simulateMessage = postMessage
