-- | Generic pub/sub typeclass for messaging
module PubSub.Class where

import Prelude

import Data.Argonaut.Core (Json)
import Effect (Effect)
import Halogen.Subscription (Emitter)

-- | A pub/sub channel that can send and receive messages
class PubSub channel where
  -- | Create a new channel
  create :: String -> Effect channel

  -- | Post a message to the channel
  postMessage :: channel -> Json -> Effect Unit

  -- | Subscribe to messages from the channel
  subscribe :: channel -> Effect (Emitter Json)

  -- | Close the channel
  close :: channel -> Effect Unit
