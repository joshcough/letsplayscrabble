-- | WorkerSocketManager - Manages WebSocket connection and broadcasts to overlays
module Worker.WorkerSocketManager where

import Prelude

import BroadcastChannel as BC
import BroadcastChannel.Manager as BCM
import Data.Argonaut.Core (Json, jsonEmptyObject)
import Data.Argonaut.Decode (decodeJson, (.:))
import Data.Argonaut.Encode ((:=), (~>))
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Effect (Effect)
import Effect.Class (class MonadEffect, liftEffect)
import Effect.Console (log)
import Effect.Ref as Ref
import Foreign (Foreign, unsafeFromForeign, unsafeToForeign)
import SocketIO as SIO

-- | Helper to log info messages
logInfo :: String -> Effect Unit
logInfo msg = log $ "[WorkerSocketManager] " <> msg

-- | Worker state
type WorkerState =
  { socket :: Maybe SIO.Socket
  , broadcastChannel :: BC.BroadcastChannel
  , statusChannel :: BC.BroadcastChannel
  , connectionStatus :: String
  , error :: Maybe String
  , lastDataUpdate :: Number
  }

-- | Create initial worker state
createWorkerState :: Effect WorkerState
createWorkerState = do
  bc <- BC.create "tournament-updates"
  sc <- BC.create "worker-status"
  pure
    { socket: Nothing
    , broadcastChannel: bc
    , statusChannel: sc
    , connectionStatus: "Initializing..."
    , error: Nothing
    , lastDataUpdate: 0.0
    }

-- | Initialize worker - connect to Socket.IO and set up event handlers
initialize :: String -> Ref.Ref WorkerState -> Effect Unit
initialize apiUrl stateRef = do
  -- Connect to Socket.IO
  let socketUrl = apiUrl
  logInfo $ "Connecting to Socket.IO at: " <> socketUrl
  socket <- SIO.connect socketUrl SIO.defaultOptions

  -- Update state with socket
  state <- Ref.read stateRef
  Ref.write (state { socket = Just socket }) stateRef
  logInfo "Socket.IO connection initiated"

  -- Set up connection event handlers
  SIO.on socket "connect" \_ -> do
    logInfo "Socket.IO connected!"
    currentState <- Ref.read stateRef
    Ref.write (currentState { connectionStatus = "Connected", error = Nothing }) stateRef
    broadcastStatus stateRef

  SIO.on socket "connect_error" \errorData -> do
    logInfo "Socket.IO connection error"
    currentState <- Ref.read stateRef
    Ref.write (currentState { connectionStatus = "Connection Error", error = Just "Failed to connect" }) stateRef
    broadcastStatus stateRef

  SIO.on socket "disconnect" \_ -> do
    logInfo "Socket.IO disconnected"
    currentState <- Ref.read stateRef
    Ref.write (currentState { connectionStatus = "Disconnected" }) stateRef
    broadcastStatus stateRef

  -- Set up tournament data event handlers
  SIO.on socket "GamesAdded" handleGamesAdded
  SIO.on socket "admin-panel-update" handleAdminPanelUpdate
  SIO.on socket "Ping" handlePing

  pure unit

  where
    handleGamesAdded :: Foreign -> Effect Unit
    handleGamesAdded foreignData = do
      state <- Ref.read stateRef
      -- Broadcast the GamesAdded message to all listening tabs
      let json = unsafeFromForeign foreignData :: Json
      BC.postMessage state.broadcastChannel (unsafeToForeign json)

      -- Update last data update timestamp
      currentState <- Ref.read stateRef
      -- TODO: Get actual timestamp from Date.now()
      Ref.write (currentState { lastDataUpdate = 0.0 }) stateRef
      pure unit

    handleAdminPanelUpdate :: Foreign -> Effect Unit
    handleAdminPanelUpdate foreignData = do
      state <- Ref.read stateRef
      let json = unsafeFromForeign foreignData :: Json
      -- Wrap the message with type field so BroadcastManager can route it
      let wrappedMessage =
            "type" := "ADMIN_PANEL_UPDATE"
            ~> "data" := json
            ~> jsonEmptyObject
      BC.postMessage state.broadcastChannel (unsafeToForeign wrappedMessage)
      pure unit

    handlePing :: Foreign -> Effect Unit
    handlePing _ = do
      -- Just update status, don't broadcast pings (too noisy)
      pure unit

-- | Broadcast current status to status channel
broadcastStatus :: Ref.Ref WorkerState -> Effect Unit
broadcastStatus stateRef = do
  state <- Ref.read stateRef
  let statusMsg =
        { "type": "WORKER_STATUS_UPDATE"
        , data:
            { status: state.connectionStatus
            , error: state.error
            , lastDataUpdate: state.lastDataUpdate
            , cacheStats: { size: 0, keys: [] }
            }
        }
  BC.postMessage state.statusChannel (unsafeToForeign statusMsg)
  pure unit

-- | Disconnect and clean up
cleanup :: Ref.Ref WorkerState -> Effect Unit
cleanup stateRef = do
  state <- Ref.read stateRef
  case state.socket of
    Just socket -> SIO.disconnect socket
    Nothing -> pure unit
  BC.close state.broadcastChannel
  BC.close state.statusChannel
  pure unit
