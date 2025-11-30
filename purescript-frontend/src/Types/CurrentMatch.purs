-- | Current match types
module Types.CurrentMatch where

import Prelude

import Data.Argonaut.Decode (class DecodeJson, decodeJson, (.:))
import Data.Either (Either(..))
import Data.Maybe (Maybe)
import Data.Newtype (class Newtype)

newtype CurrentMatch = CurrentMatch
  { tournamentId :: Int
  , divisionId :: Int
  , divisionName :: String
  , round :: Int
  , pairingId :: Maybe Int
  , updatedAt :: String
  }

derive instance Newtype CurrentMatch _

instance DecodeJson CurrentMatch where
  decodeJson json = do
    obj <- decodeJson json
    tournamentId <- obj .: "tournamentId"
    divisionId <- obj .: "divisionId"
    divisionName <- obj .: "divisionName"
    round <- obj .: "round"
    pairingId <- obj .: "pairingId"
    updatedAt <- obj .: "updatedAt"
    pure $ CurrentMatch { tournamentId, divisionId, divisionName, round, pairingId, updatedAt }
