-- | Route definitions for the application
module Route where

import Prelude hiding ((/))

import Data.Generic.Rep (class Generic)
import Data.Maybe (Maybe)
import Routing.Duplex (RouteDuplex', root, int, optional, string, boolean)
import Routing.Duplex.Generic (noArgs, sum)
import Routing.Duplex.Generic.Syntax ((/), (?))

-- | Application routes
data Route
  = Home
  | Overlays
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
  | Worker

derive instance Generic Route _
derive instance Eq Route
derive instance Ord Route

instance Show Route where
  show = case _ of
    Home -> "Home"
    Overlays -> "Overlays"
    Standings _ -> "Standings"
    HighScores _ -> "HighScores"
    Worker -> "Worker"

-- | Route codec for parsing and printing routes
-- | URLs will be: #/overlay/standings?userId=2&tournamentId=135&divisionName=A&pics=true
routeCodec :: RouteDuplex' Route
routeCodec = root $ sum
  { "Home": noArgs
  , "Overlays": "overlays" / noArgs
  , "Standings": "overlay" / "standings" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, pics: optional <<< boolean }
  , "HighScores": "overlay" / "high-scores" ? { userId: int, tournamentId: optional <<< int, divisionName: optional <<< string, pics: optional <<< boolean }
  , "Worker": "worker" / noArgs
  }
