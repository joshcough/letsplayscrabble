-- | Current match types
module Types.CurrentMatch where

import Prelude

import Data.Argonaut.Decode (class DecodeJson)
import Data.Argonaut.Encode (class EncodeJson)
import Data.Generic.Rep (class Generic)
import Data.Maybe (Maybe)
import Data.Newtype (class Newtype)
import Data.Show.Generic (genericShow)

newtype CurrentMatch = CurrentMatch
  { tournamentId :: Int
  , divisionId :: Int
  , divisionName :: String
  , round :: Int
  , pairingId :: Maybe Int
  , updatedAt :: String
  }

derive instance Newtype CurrentMatch _
derive instance Generic CurrentMatch _
derive instance Eq CurrentMatch
derive newtype instance DecodeJson CurrentMatch
derive newtype instance EncodeJson CurrentMatch

instance Show CurrentMatch where
  show = genericShow
