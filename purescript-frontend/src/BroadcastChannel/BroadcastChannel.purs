-- | BroadcastChannel API bindings
module BroadcastChannel where

import Prelude

import Data.Function.Uncurried (Fn2, runFn2)
import Effect (Effect)
import Foreign (Foreign)

-- | Opaque type for BroadcastChannel
foreign import data BroadcastChannel :: Type

-- | Create a new broadcast channel
foreign import createImpl :: String -> Effect BroadcastChannel

-- | Post a message to the channel
foreign import postMessageImpl :: Fn2 BroadcastChannel Foreign (Effect Unit)

-- | Listen for messages
foreign import onMessageImpl :: Fn2 BroadcastChannel (Foreign -> Effect Unit) (Effect Unit)

-- | Close the channel
foreign import closeImpl :: BroadcastChannel -> Effect Unit

-- | Create a broadcast channel
create :: String -> Effect BroadcastChannel
create = createImpl

-- | Post a message
postMessage :: BroadcastChannel -> Foreign -> Effect Unit
postMessage = runFn2 postMessageImpl

-- | Register message listener
onMessage :: BroadcastChannel -> (Foreign -> Effect Unit) -> Effect Unit
onMessage = runFn2 onMessageImpl

-- | Close channel
close :: BroadcastChannel -> Effect Unit
close = closeImpl
