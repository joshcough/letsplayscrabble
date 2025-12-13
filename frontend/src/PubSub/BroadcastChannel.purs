-- | BroadcastChannel implementation of PubSub typeclass
module PubSub.BroadcastChannel where

import Prelude

import BroadcastChannel as BC
import Data.Argonaut.Core (Json)
import Effect (Effect)
import Foreign (Foreign, unsafeToForeign, unsafeFromForeign)
import Halogen.Subscription (Emitter)
import Halogen.Subscription as HS
import PubSub.Class (class PubSub, create)

-- | Wrapper around BroadcastChannel that implements PubSub
newtype BroadcastChannelPubSub = BroadcastChannelPubSub BC.BroadcastChannel

instance PubSub BroadcastChannelPubSub where
  create name = do
    channel <- BC.create name
    pure $ BroadcastChannelPubSub channel

  postMessage (BroadcastChannelPubSub channel) message =
    BC.postMessage channel (unsafeToForeign message)

  subscribe (BroadcastChannelPubSub channel) =
    pure $ HS.makeEmitter \push -> do
      -- Register message listener
      BC.onMessage channel \foreignVal -> do
        let json = unsafeFromForeign foreignVal :: Json
        push json

      -- Return cleanup function (no-op for now since onMessage doesn't return unsubscribe)
      pure $ pure unit

  close (BroadcastChannelPubSub channel) =
    BC.close channel

-- | Create a production BroadcastChannel
productionChannel :: String -> Effect BroadcastChannelPubSub
productionChannel = create
