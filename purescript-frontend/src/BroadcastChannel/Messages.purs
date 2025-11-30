-- | Broadcast message types for real-time tournament updates
module BroadcastChannel.Messages where

import Prelude

import Domain.Types (TournamentId, DivisionId, DivisionScopedData, GameChanges)
import Data.Argonaut.Core (Json, jsonEmptyObject)
import Data.Argonaut.Decode (class DecodeJson, decodeJson, (.:), (.:?), JsonDecodeError)
import Data.Argonaut.Encode (class EncodeJson, encodeJson, (:=), (~>))
import Data.Either (Either)
import Data.Maybe (Maybe)
import Data.Generic.Rep (class Generic)
import Data.Show.Generic (genericShow)

-- | Message types sent over broadcast channel
data BroadcastMessageType
  = Subscribe
  | TournamentDataResponse
  | TournamentDataRefresh
  | TournamentDataIncremental
  | TournamentDataError
  | GamesAdded
  | AdminPanelUpdate
  | NotificationCancel

derive instance genericBroadcastMessageType :: Generic BroadcastMessageType _
derive instance eqBroadcastMessageType :: Eq BroadcastMessageType

instance showBroadcastMessageType :: Show BroadcastMessageType where
  show = genericShow

-- | Division selection (only present when tournament is specified)
type DivisionSelection =
  { divisionName :: String
  }

-- | Tournament selection (only present when not using current match)
type TournamentSelection =
  { tournamentId :: TournamentId
  , division :: Maybe DivisionSelection
  }

-- | Subscribe message (sent by components to request data)
type SubscribeMessage =
  { userId :: Int
  , tournament :: Maybe TournamentSelection
  }

-- | Tournament data response (worker → component, initial data)
type TournamentDataResponse =
  { userId :: Int
  , tournamentId :: TournamentId
  , divisionId :: DivisionId
  , isCurrentMatch :: Boolean
  , data :: DivisionScopedData
  }

-- | Tournament data refresh (worker → component, admin panel update)
type TournamentDataRefresh =
  { userId :: Int
  , tournamentId :: TournamentId
  , divisionId :: DivisionId
  , data :: DivisionScopedData
  }

-- | Tournament data incremental (worker → component, game updates)
type TournamentDataIncremental =
  { userId :: Int
  , tournamentId :: TournamentId
  , divisionId :: DivisionId
  , data :: DivisionScopedData
  , metadata ::
      { addedCount :: Int
      , updatedCount :: Int
      }
  }

-- | Tournament data error (worker → component)
type TournamentDataError =
  { userId :: Int
  , tournamentId :: TournamentId
  , error :: String
  }

-- | Games added message (backend → worker)
type GamesAddedMessage =
  { userId :: Int
  , tournamentId :: TournamentId
  }

-- | Admin panel update message (admin → worker)
type AdminPanelUpdate =
  { userId :: Int
  , tournamentId :: TournamentId
  , divisionId :: DivisionId
  , divisionName :: String
  , round :: Int
  , pairingId :: Int
  }

-- | Notification cancel message
type NotificationCancelMessage =
  { timestamp :: Number
  }

-- | Broadcast message wrapper
data BroadcastMessage
  = MsgSubscribe SubscribeMessage
  | MsgTournamentDataResponse TournamentDataResponse
  | MsgTournamentDataRefresh TournamentDataRefresh
  | MsgTournamentDataIncremental TournamentDataIncremental
  | MsgTournamentDataError TournamentDataError
  | MsgGamesAdded GamesAddedMessage
  | MsgAdminPanelUpdate AdminPanelUpdate
  | MsgNotificationCancel NotificationCancelMessage

derive instance genericBroadcastMessage :: Generic BroadcastMessage _
derive instance eqBroadcastMessage :: Eq BroadcastMessage

instance showBroadcastMessage :: Show BroadcastMessage where
  show = genericShow

-- JSON Codecs
-- Note: Type aliases cannot have instances, so we provide manual decoder functions

-- | Decode a subscribe message from the "data" field
decodeSubscribeMessage :: Json -> Either JsonDecodeError SubscribeMessage
decodeSubscribeMessage json = do
  obj <- decodeJson json
  data_ <- obj .: "data"
  userId <- data_ .: "userId"
  tournament <- data_ .:? "tournament"
  pure { userId, tournament }

{-
instance decodeTournamentDataResponse :: DecodeJson TournamentDataResponse where
  decodeJson json = do
    obj <- decodeJson json
    userId <- obj .: "userId"
    tournamentId <- obj .: "tournamentId"
    divisionId <- obj .: "divisionId"
    data_ <- obj .: "data"
    pure { userId, tournamentId, divisionId, data: data_ }

instance encodeTournamentDataResponse :: EncodeJson TournamentDataResponse where
  encodeJson msg =
    "userId" := msg.userId
    ~> "tournamentId" := msg.tournamentId
    ~> "divisionId" := msg.divisionId
    ~> "data" := msg.data
    ~> jsonEmptyObject

instance decodeTournamentDataRefresh :: DecodeJson TournamentDataRefresh where
  decodeJson json = do
    obj <- decodeJson json
    userId <- obj .: "userId"
    tournamentId <- obj .: "tournamentId"
    divisionId <- obj .: "divisionId"
    data_ <- obj .: "data"
    pure { userId, tournamentId, divisionId, data: data_ }

instance encodeTournamentDataRefresh :: EncodeJson TournamentDataRefresh where
  encodeJson msg =
    "userId" := msg.userId
    ~> "tournamentId" := msg.tournamentId
    ~> "divisionId" := msg.divisionId
    ~> "data" := msg.data
    ~> jsonEmptyObject

instance decodeTournamentDataIncremental :: DecodeJson TournamentDataIncremental where
  decodeJson json = do
    obj <- decodeJson json
    userId <- obj .: "userId"
    tournamentId <- obj .: "tournamentId"
    divisionId <- obj .: "divisionId"
    data_ <- obj .: "data"
    metadata <- obj .: "metadata"
    pure { userId, tournamentId, divisionId, data: data_, metadata }

instance encodeTournamentDataIncremental :: EncodeJson TournamentDataIncremental where
  encodeJson msg =
    "userId" := msg.userId
    ~> "tournamentId" := msg.tournamentId
    ~> "divisionId" := msg.divisionId
    ~> "data" := msg.data
    ~> "metadata" := msg.metadata
    ~> jsonEmptyObject

instance decodeTournamentDataError :: DecodeJson TournamentDataError where
  decodeJson json = do
    obj <- decodeJson json
    userId <- obj .: "userId"
    tournamentId <- obj .: "tournamentId"
    error <- obj .: "error"
    pure { userId, tournamentId, error }

instance encodeTournamentDataError :: EncodeJson TournamentDataError where
  encodeJson msg =
    "userId" := msg.userId
    ~> "tournamentId" := msg.tournamentId
    ~> "error" := msg.error
    ~> jsonEmptyObject

instance decodeGamesAddedMessage :: DecodeJson GamesAddedMessage where
  decodeJson json = do
    obj <- decodeJson json
    userId <- obj .: "userId"
    tournamentId <- obj .: "tournamentId"
    pure { userId, tournamentId }

instance encodeGamesAddedMessage :: EncodeJson GamesAddedMessage where
  encodeJson msg =
    "userId" := msg.userId
    ~> "tournamentId" := msg.tournamentId
    ~> jsonEmptyObject

instance decodeAdminPanelUpdate :: DecodeJson AdminPanelUpdate where
  decodeJson json = do
    obj <- decodeJson json
    userId <- obj .: "userId"
    tournamentId <- obj .: "tournamentId"
    divisionId <- obj .: "divisionId"
    divisionName <- obj .: "divisionName"
    round <- obj .: "round"
    pairingId <- obj .: "pairingId"
    pure { userId, tournamentId, divisionId, divisionName, round, pairingId }

instance encodeAdminPanelUpdate :: EncodeJson AdminPanelUpdate where
  encodeJson msg =
    "userId" := msg.userId
    ~> "tournamentId" := msg.tournamentId
    ~> "divisionId" := msg.divisionId
    ~> "divisionName" := msg.divisionName
    ~> "round" := msg.round
    ~> "pairingId" := msg.pairingId
    ~> jsonEmptyObject

instance decodeNotificationCancelMessage :: DecodeJson NotificationCancelMessage where
  decodeJson json = do
    obj <- decodeJson json
    timestamp <- obj .: "timestamp"
    pure { timestamp }

instance encodeNotificationCancelMessage :: EncodeJson NotificationCancelMessage where
  encodeJson msg =
    "timestamp" := msg.timestamp
    ~> jsonEmptyObject
-}
