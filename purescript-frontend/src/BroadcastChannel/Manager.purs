-- | BroadcastManager using Halogen subscriptions
-- | Provides typed event streams for broadcast messages
module BroadcastChannel.Manager where

import Prelude

import BroadcastChannel as BC
import BroadcastChannel.Messages (BroadcastMessage(..), SubscribeMessage, TournamentDataResponse, TournamentDataRefresh, TournamentDataIncremental, TournamentDataError, GamesAddedMessage, AdminPanelUpdate, NotificationCancelMessage, decodeSubscribeMessage)
import Data.Argonaut.Core (Json, jsonEmptyObject)
import Data.Argonaut.Decode (class DecodeJson, decodeJson, (.:), JsonDecodeError)
import Data.Argonaut.Encode (class EncodeJson, encodeJson, (:=), (~>))
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Effect (Effect)
import Effect.Class (class MonadEffect, liftEffect)
import Effect.Console as Console
import Foreign (Foreign, unsafeToForeign, unsafeFromForeign)
import Halogen.Subscription as HS

-- | Manager holds the broadcast channel and emitters for each message type
type BroadcastManager =
  { channel :: BC.BroadcastChannel
  , subscribeEmitter :: HS.Emitter SubscribeMessage
  , tournamentDataResponseEmitter :: HS.Emitter TournamentDataResponse
  , tournamentDataRefreshEmitter :: HS.Emitter TournamentDataRefresh
  , tournamentDataIncrementalEmitter :: HS.Emitter TournamentDataIncremental
  , tournamentDataErrorEmitter :: HS.Emitter TournamentDataError
  , gamesAddedEmitter :: HS.Emitter GamesAddedMessage
  , adminPanelUpdateEmitter :: HS.Emitter AdminPanelUpdate
  , notificationCancelEmitter :: HS.Emitter NotificationCancelMessage
  }

-- | Create a new broadcast manager
create :: Effect BroadcastManager
create = do
  channel <- BC.create "tournament-updates"

  -- Create emitters for each message type
  { emitter: subscribeEmitter, listener: subscribeListener } <- HS.create
  { emitter: responseEmitter, listener: responseListener } <- HS.create
  { emitter: refreshEmitter, listener: refreshListener } <- HS.create
  { emitter: incrementalEmitter, listener: incrementalListener } <- HS.create
  { emitter: errorEmitter, listener: errorListener } <- HS.create
  { emitter: gamesEmitter, listener: gamesListener } <- HS.create
  { emitter: adminEmitter, listener: adminListener } <- HS.create
  { emitter: notifEmitter, listener: notifListener } <- HS.create

  -- Single message handler that routes to appropriate emitter
  BC.onMessage channel \foreignData -> do
    let json = unsafeFromForeign foreignData :: Json
    case decodeMessageType json of
      Right msgType -> do
        routeMessage msgType json
          { subscribeListener
          , responseListener
          , refreshListener
          , incrementalListener
          , errorListener
          , gamesListener
          , adminListener
          , notifListener
          }
      Left _ -> Console.log "[BroadcastManager] Failed to decode message type"

  pure
    { channel
    , subscribeEmitter
    , tournamentDataResponseEmitter: responseEmitter
    , tournamentDataRefreshEmitter: refreshEmitter
    , tournamentDataIncrementalEmitter: incrementalEmitter
    , tournamentDataErrorEmitter: errorEmitter
    , gamesAddedEmitter: gamesEmitter
    , adminPanelUpdateEmitter: adminEmitter
    , notificationCancelEmitter: notifEmitter
    }

-- | Route message to appropriate listener
routeMessage
  :: String
  -> Json
  -> { subscribeListener :: HS.Listener SubscribeMessage
     , responseListener :: HS.Listener TournamentDataResponse
     , refreshListener :: HS.Listener TournamentDataRefresh
     , incrementalListener :: HS.Listener TournamentDataIncremental
     , errorListener :: HS.Listener TournamentDataError
     , gamesListener :: HS.Listener GamesAddedMessage
     , adminListener :: HS.Listener AdminPanelUpdate
     , notifListener :: HS.Listener NotificationCancelMessage
     }
  -> Effect Unit
routeMessage msgType json listeners =
  case msgType of
    "SUBSCRIBE" -> do
      case decodeSubscribeMessage json of
        Right msg -> do
          HS.notify listeners.subscribeListener msg
        Left err -> Console.log $ "[BroadcastManager] Failed to decode SUBSCRIBE message: " <> show err

    "TOURNAMENT_DATA_RESPONSE" -> do
      let result = do
            obj <- decodeJson json
            obj .: "data"
      case result of
        Right msg -> do
          HS.notify listeners.responseListener msg
        Left err -> Console.log $ "[BroadcastManager] Failed to decode TOURNAMENT_DATA_RESPONSE: " <> show err

    "TOURNAMENT_DATA_REFRESH" ->
      case decodeJson json of
        Right msg -> HS.notify listeners.refreshListener msg
        Left _ -> pure unit

    "TOURNAMENT_DATA_INCREMENTAL" ->
      case decodeJson json of
        Right msg -> HS.notify listeners.incrementalListener msg
        Left _ -> pure unit

    "TOURNAMENT_DATA_ERROR" ->
      case decodeJson json of
        Right msg -> HS.notify listeners.errorListener msg
        Left _ -> pure unit

    "GAMES_ADDED" ->
      case decodeJson json of
        Right msg -> HS.notify listeners.gamesListener msg
        Left _ -> pure unit

    "ADMIN_PANEL_UPDATE" -> do
      let result = do
            obj <- decodeJson json
            obj .: "data"
      case result of
        Right msg -> do
          HS.notify listeners.adminListener msg
        Left err -> Console.log $ "[BroadcastManager] Failed to decode ADMIN_PANEL_UPDATE: " <> show err

    "NOTIFICATION_CANCEL" ->
      case decodeJson json of
        Right msg -> HS.notify listeners.notifListener msg
        Left _ -> pure unit

    _ -> pure unit

-- | Decode message type from JSON
decodeMessageType :: Json -> Either JsonDecodeError String
decodeMessageType json = do
  obj <- decodeJson json
  obj .: "type"

-- | Post a subscribe message
postSubscribe :: forall m. MonadEffect m => BroadcastManager -> SubscribeMessage -> m Unit
postSubscribe manager msg = liftEffect do
  let json = encodeSubscribeMessage msg
  BC.postMessage manager.channel (unsafeToForeign json)

-- | Post a tournament data response message
postTournamentDataResponse :: forall m. MonadEffect m => BroadcastManager -> TournamentDataResponse -> m Unit
postTournamentDataResponse manager msg = liftEffect do
  let json = encodeTournamentDataResponse msg
  BC.postMessage manager.channel (unsafeToForeign json)

-- | Encode subscribe message
encodeSubscribeMessage :: SubscribeMessage -> Json
encodeSubscribeMessage msg =
  "type" := "SUBSCRIBE"
  ~> "data" := msg
  ~> jsonEmptyObject

-- | Encode tournament data response message
encodeTournamentDataResponse :: TournamentDataResponse -> Json
encodeTournamentDataResponse msg =
  "type" := "TOURNAMENT_DATA_RESPONSE"
  ~> "data" := msg
  ~> jsonEmptyObject

-- | Post an admin panel update message
postAdminPanelUpdate :: forall m. MonadEffect m => BroadcastManager -> AdminPanelUpdate -> m Unit
postAdminPanelUpdate manager msg = liftEffect do
  let json = encodeAdminPanelUpdate msg
  BC.postMessage manager.channel (unsafeToForeign json)

-- | Encode admin panel update message
encodeAdminPanelUpdate :: AdminPanelUpdate -> Json
encodeAdminPanelUpdate msg =
  "type" := "ADMIN_PANEL_UPDATE"
  ~> "data" := ("userId" := msg.userId
              ~> "tournamentId" := msg.tournamentId
              ~> "divisionId" := msg.divisionId
              ~> "divisionName" := msg.divisionName
              ~> "round" := msg.round
              ~> "pairingId" := msg.pairingId
              ~> jsonEmptyObject)
  ~> jsonEmptyObject

-- | Close the broadcast channel
close :: forall m. MonadEffect m => BroadcastManager -> m Unit
close manager = liftEffect do
  BC.close manager.channel
