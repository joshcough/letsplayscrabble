-- | Socket.IO client FFI bindings
module SocketIO where

import Prelude

import Data.Function.Uncurried (Fn2, Fn3, runFn2, runFn3)
import Effect (Effect)
import Foreign (Foreign, unsafeToForeign)

-- | Opaque type for Socket.IO socket
foreign import data Socket :: Type

-- | Socket.IO connection options
type SocketOptions =
  { autoConnect :: Boolean
  , reconnection :: Boolean
  , reconnectionDelay :: Int
  , reconnectionDelayMax :: Int
  , timeout :: Int
  }

-- | Default socket options
defaultOptions :: SocketOptions
defaultOptions =
  { autoConnect: true
  , reconnection: true
  , reconnectionDelay: 1000
  , reconnectionDelayMax: 5000
  , timeout: 20000
  }

-- | FFI: Connect to Socket.IO server
foreign import connectImpl :: Fn2 String Foreign (Effect Socket)

-- | FFI: Listen for event
foreign import onImpl :: Fn3 Socket String (Foreign -> Effect Unit) (Effect Unit)

-- | FFI: Emit event
foreign import emitImpl :: Fn3 Socket String Foreign (Effect Unit)

-- | FFI: Disconnect socket
foreign import disconnectImpl :: Socket -> Effect Unit

-- | FFI: Check if connected
foreign import connectedImpl :: Socket -> Effect Boolean

-- | Connect to Socket.IO server
connect :: String -> SocketOptions -> Effect Socket
connect url opts = runFn2 connectImpl url (unsafeToForeign opts)

-- | Listen for event on socket
on :: Socket -> String -> (Foreign -> Effect Unit) -> Effect Unit
on = runFn3 onImpl

-- | Emit event to server
emit :: Socket -> String -> Foreign -> Effect Unit
emit = runFn3 emitImpl

-- | Disconnect from server
disconnect :: Socket -> Effect Unit
disconnect = disconnectImpl

-- | Check if socket is connected
isConnected :: Socket -> Effect Boolean
isConnected = connectedImpl
