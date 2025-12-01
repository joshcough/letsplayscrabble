-- | Route definitions for the application
module Route where

import Prelude hiding ((/))

import Data.Generic.Rep (class Generic)
import Data.Maybe (Maybe)
import Routing.Duplex (RouteDuplex', root, int, optional, string, boolean, segment)
import Routing.Duplex.Generic (noArgs, sum)
import Routing.Duplex.Generic.Syntax ((/), (?))

-- | Application routes
data Route
  = Home
  | Login
  | Overlays
  | TournamentManager
  | AddTournament
  | TournamentDetail Int  -- Tournament ID
  | CurrentMatch
  | Standings
      { userId :: Int
      , tournamentId :: Maybe Int
      , divisionName :: Maybe String
      , pics :: Maybe Boolean
      }
  | HighScores
      { userId :: Int
      , tournamentId :: Maybe Int
      , divisionName :: Maybe String
      , pics :: Maybe Boolean
      }
  | RatingGain
      { userId :: Int
      , tournamentId :: Maybe Int
      , divisionName :: Maybe String
      , pics :: Maybe Boolean
      }
  | ScoringLeaders
      { userId :: Int
      , tournamentId :: Maybe Int
      , divisionName :: Maybe String
      , pics :: Maybe Boolean
      }
  | CrossTablesPlayerProfile
      { userId :: Int
      , tournamentId :: Maybe Int
      , divisionName :: Maybe String
      , playerId :: Int
      }
  | HeadToHead
      { userId :: Int
      , tournamentId :: Maybe Int
      , divisionName :: Maybe String
      , playerId1 :: Maybe Int
      , playerId2 :: Maybe Int
      }
  | MiscOverlay
      { userId :: Int
      , tournamentId :: Maybe Int
      , divisionName :: Maybe String
      , source :: String
      }
  | TournamentStats
      { userId :: Int
      , tournamentId :: Maybe Int
      , divisionName :: Maybe String
      }
  | MiscOverlayTesting
  | Worker

derive instance Generic Route _
derive instance Eq Route
derive instance Ord Route

instance Show Route where
  show = case _ of
    Home -> "Home"
    Login -> "Login"
    Overlays -> "Overlays"
    TournamentManager -> "TournamentManager"
    AddTournament -> "AddTournament"
    TournamentDetail id -> "TournamentDetail " <> show id
    CurrentMatch -> "CurrentMatch"
    Standings _ -> "Standings"
    HighScores _ -> "HighScores"
    RatingGain _ -> "RatingGain"
    ScoringLeaders _ -> "ScoringLeaders"
    CrossTablesPlayerProfile _ -> "CrossTablesPlayerProfile"
    HeadToHead _ -> "HeadToHead"
    MiscOverlay _ -> "MiscOverlay"
    TournamentStats _ -> "TournamentStats"
    MiscOverlayTesting -> "MiscOverlayTesting"
    Worker -> "Worker"

-- | Route codec for parsing and printing routes
-- | URLs will be: #/overlay/standings?userId=2&tournamentId=135&divisionName=A&pics=true
routeCodec :: RouteDuplex' Route
routeCodec = root $ sum
  { "Home": noArgs
  , "Login": "login" / noArgs
  , "Overlays": "overlays" / noArgs
  , "TournamentManager": "tournaments" / "manager" / noArgs
  , "AddTournament": "tournaments" / "add" / noArgs
  , "TournamentDetail": "tournaments" / int segment
  , "CurrentMatch": "current-match" / noArgs
  , "Standings": "overlay" / "standings" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, pics: optional <<< boolean }
  , "HighScores": "overlay" / "high-scores" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, pics: optional <<< boolean }
  , "RatingGain": "overlay" / "rating-gain" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, pics: optional <<< boolean }
  , "ScoringLeaders": "overlay" / "scoring-leaders" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, pics: optional <<< boolean }
  , "CrossTablesPlayerProfile": "overlay" / "player-profile" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, playerId: int }
  , "HeadToHead": "overlay" / "head-to-head" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, playerId1: optional <<< int, playerId2: optional <<< int }
  , "MiscOverlay": "overlay" / "misc" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, source: string }
  , "TournamentStats": "overlay" / "tournament-stats" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string }
  , "MiscOverlayTesting": "overlay" / "misc" / "testing" / noArgs
  , "Worker": "worker" / noArgs
  }
