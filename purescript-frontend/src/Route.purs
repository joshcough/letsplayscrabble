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
    TournamentDetail id -> "TournamentDetail " <> show id
    CurrentMatch -> "CurrentMatch"
    Standings _ -> "Standings"
    HighScores _ -> "HighScores"
    RatingGain _ -> "RatingGain"
    ScoringLeaders _ -> "ScoringLeaders"
    Worker -> "Worker"

-- | Route codec for parsing and printing routes
-- | URLs will be: #/overlay/standings?userId=2&tournamentId=135&divisionName=A&pics=true
routeCodec :: RouteDuplex' Route
routeCodec = root $ sum
  { "Home": noArgs
  , "Login": "login" / noArgs
  , "Overlays": "overlays" / noArgs
  , "TournamentManager": "tournaments" / "manager" / noArgs
  , "TournamentDetail": "tournaments" / int segment
  , "CurrentMatch": "current-match" / noArgs
  , "Standings": "overlay" / "standings" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, pics: optional <<< boolean }
  , "HighScores": "overlay" / "high-scores" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, pics: optional <<< boolean }
  , "RatingGain": "overlay" / "rating-gain" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, pics: optional <<< boolean }
  , "ScoringLeaders": "overlay" / "scoring-leaders" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, pics: optional <<< boolean }
  , "Worker": "worker" / noArgs
  }
