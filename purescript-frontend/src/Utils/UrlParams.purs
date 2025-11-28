-- | URL parameter parsing utilities
module Utils.UrlParams where

import Prelude

import Data.Array (catMaybes)
import Data.Int as Int
import Data.Maybe (Maybe(..))
import Data.String (Pattern(..), split)
import Data.Tuple (Tuple(..))
import Effect (Effect)
import Foreign.Object as Object
import Web.HTML (window)
import Web.HTML.Location (search)
import Web.HTML.Window (location)

-- | Get the query string from the current URL
getQueryString :: Effect String
getQueryString = do
  win <- window
  loc <- location win
  search loc

-- | Parse query string into key-value pairs
-- | e.g. "?userId=1&tournamentId=2" -> Object {"userId": "1", "tournamentId": "2"}
parseQueryString :: String -> Object.Object String
parseQueryString str =
  let
    -- Remove leading '?' if present
    withoutQuestion = case split (Pattern "?") str of
      [_, rest] -> rest
      [rest] -> rest
      _ -> ""

    -- Split by '&' to get individual params
    pairs = split (Pattern "&") withoutQuestion

    -- Parse each key=value pair
    parsePair pair = case split (Pattern "=") pair of
      [key, value] -> Just { key, value }
      _ -> Nothing

    -- Build the object
    kvPairs = pairs
      # map parsePair
      # catMaybes
      # map (\{ key, value } -> Tuple key value)
  in
    Object.fromFoldable kvPairs

-- | Get a query parameter value
getParam :: String -> Object.Object String -> Maybe String
getParam key params = Object.lookup key params

-- | Get a query parameter as an Int
getParamInt :: String -> Object.Object String -> Maybe Int
getParamInt key params = do
  value <- getParam key params
  Int.fromString value

-- | Parse URL parameters into a record with userId, tournamentId, etc.
type UrlParams =
  { userId :: Maybe Int
  , tournamentId :: Maybe Int
  , divisionId :: Maybe Int
  , divisionName :: Maybe String
  }

-- | Parse the current URL's query string into UrlParams
parseUrlParams :: Effect UrlParams
parseUrlParams = do
  queryStr <- getQueryString
  let params = parseQueryString queryStr
  pure
    { userId: getParamInt "userId" params
    , tournamentId: getParamInt "tournamentId" params
    , divisionId: getParamInt "divisionId" params
    , divisionName: getParam "divisionName" params
    }
