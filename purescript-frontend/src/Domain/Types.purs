-- | Core domain types for tournament data
-- | Pure business logic types, no persistence concerns
module Domain.Types where

import Prelude

import Data.Argonaut.Decode (class DecodeJson)
import Data.Argonaut.Encode (class EncodeJson)
import Data.Maybe (Maybe)
import Data.Newtype (class Newtype)

-- | Newtypes for type safety
newtype TournamentId = TournamentId Int
newtype DivisionId = DivisionId Int
newtype PlayerId = PlayerId Int
newtype GameId = GameId Int
newtype PairingId = PairingId Int
newtype XTId = XTId Int

derive instance newtypeTournamentId :: Newtype TournamentId _
derive instance newtypeDivisionId :: Newtype DivisionId _
derive instance newtypePlayerId :: Newtype PlayerId _
derive instance newtypeGameId :: Newtype GameId _
derive instance newtypePairingId :: Newtype PairingId _
derive instance newtypeXTId :: Newtype XTId _

derive newtype instance eqTournamentId :: Eq TournamentId
derive newtype instance eqDivisionId :: Eq DivisionId
derive newtype instance eqPlayerId :: Eq PlayerId
derive newtype instance eqGameId :: Eq GameId
derive newtype instance eqPairingId :: Eq PairingId
derive newtype instance eqXTId :: Eq XTId

derive newtype instance ordTournamentId :: Ord TournamentId
derive newtype instance ordDivisionId :: Ord DivisionId
derive newtype instance ordPlayerId :: Ord PlayerId
derive newtype instance ordGameId :: Ord GameId
derive newtype instance ordPairingId :: Ord PairingId
derive newtype instance ordXTId :: Ord XTId

derive newtype instance encodeJsonTournamentId :: EncodeJson TournamentId
derive newtype instance decodeJsonTournamentId :: DecodeJson TournamentId
derive newtype instance encodeJsonDivisionId :: EncodeJson DivisionId
derive newtype instance decodeJsonDivisionId :: DecodeJson DivisionId
derive newtype instance encodeJsonPlayerId :: EncodeJson PlayerId
derive newtype instance decodeJsonPlayerId :: DecodeJson PlayerId
derive newtype instance encodeJsonGameId :: EncodeJson GameId
derive newtype instance decodeJsonGameId :: DecodeJson GameId
derive newtype instance encodeJsonPairingId :: EncodeJson PairingId
derive newtype instance decodeJsonPairingId :: DecodeJson PairingId
derive newtype instance encodeJsonXTId :: EncodeJson XTId
derive newtype instance decodeJsonXTId :: DecodeJson XTId

derive newtype instance showTournamentId :: Show TournamentId
derive newtype instance showDivisionId :: Show DivisionId
derive newtype instance showPlayerId :: Show PlayerId
derive newtype instance showGameId :: Show GameId
derive newtype instance showPairingId :: Show PairingId
derive newtype instance showXTId :: Show XTId

-- | Tournament Result from CrossTables
type TournamentResult =
  { tourneyid :: Int
  , name :: String
  , date :: String
  , division :: String
  , wins :: Int
  , losses :: Int
  , ties :: Int
  , place :: Int
  , totalplayers :: Int
  , rating :: Int
  , ratingchange :: Int
  , points :: Int
  , averagepoints :: Int
  }

-- | CrossTables player data from external API
type CrossTablesPlayer =
  { playerid :: Int
  , name :: String
  , twlrating :: Maybe Int
  , cswrating :: Maybe Int
  , twlranking :: Maybe Int
  , cswranking :: Maybe Int
  , w :: Maybe Int -- wins
  , l :: Maybe Int -- losses
  , t :: Maybe Int -- ties
  , b :: Maybe Int -- byes
  , photourl :: Maybe String
  , city :: Maybe String
  , state :: Maybe String
  , country :: Maybe String
  , tournamentCount :: Maybe Int
  , averageScore :: Maybe Int
  , opponentAverageScore :: Maybe Int
  , results :: Maybe (Array TournamentResult)
  }

-- | Head-to-head game between two players
type HeadToHeadGame =
  { gameid :: Int
  , date :: String
  , tourneyname :: Maybe String
  , player1 ::
      { playerid :: Int
      , name :: String
      , score :: Int
      , oldrating :: Int
      , newrating :: Int
      , position :: Maybe Int
      }
  , player2 ::
      { playerid :: Int
      , name :: String
      , score :: Int
      , oldrating :: Int
      , newrating :: Int
      , position :: Maybe Int
      }
  , annotated :: Maybe String
  }

-- | Head-to-head record between two players
type HeadToHeadRecord =
  { player1Id :: PlayerId
  , player2Id :: PlayerId
  , games :: Array HeadToHeadGame
  , player1Wins :: Int
  , player2Wins :: Int
  , ties :: Int
  , totalGames :: Int
  , lastMeeting :: Maybe HeadToHeadGame
  }

-- | Tournament summary (metadata only, no divisions)
type TournamentSummary =
  { id :: TournamentId
  , name :: String
  , city :: String
  , year :: Int
  , lexicon :: String
  , longFormName :: String
  , dataUrl :: String
  , pollUntil :: Maybe String
  , theme :: String
  , transparentBackground :: Boolean
  }

-- | Player in a division
type Player =
  { id :: PlayerId
  , seed :: Int
  , name :: String
  , initialRating :: Int
  , photo :: Maybe String
  , ratingsHistory :: Array Int
  , xtid :: Maybe XTId
  , xtData :: Maybe CrossTablesPlayer
  }

-- | Game between two players
type Game =
  { id :: GameId
  , roundNumber :: Int
  , player1Id :: PlayerId
  , player2Id :: PlayerId
  , player1Score :: Maybe Int
  , player2Score :: Maybe Int
  , isBye :: Boolean
  , pairingId :: Maybe PairingId
  }

-- | Division with players and games
type Division =
  { id :: DivisionId
  , name :: String
  , players :: Array Player
  , games :: Array Game
  , headToHeadGames :: Array HeadToHeadGame
  }

-- | Complete tournament with divisions
type Tournament =
  { id :: TournamentId
  , name :: String
  , city :: String
  , year :: Int
  , lexicon :: String
  , longFormName :: String
  , dataUrl :: String
  , divisions :: Array Division
  , theme :: String
  , transparentBackground :: Boolean
  }

-- | Game changes for incremental updates
type GameChanges =
  { added :: Array Game
  , updated :: Array Game
  }

-- | Tournament update with changes
type TournamentUpdate =
  { tournament :: TournamentSummary
  , changes :: GameChanges
  }

-- | Current match being displayed
type CurrentMatch =
  { tournamentId :: TournamentId
  , divisionId :: DivisionId
  , divisionName :: String
  , round :: Int
  , pairingId :: PairingId
  , updatedAt :: String
  }

-- | Data to create a current match
type CreateCurrentMatch =
  { tournamentId :: TournamentId
  , divisionId :: DivisionId
  , round :: Int
  , pairingId :: PairingId
  }

-- | Division-scoped data (what frontend components receive)
type DivisionScopedData =
  { tournament :: TournamentSummary
  , division :: Division
  }
