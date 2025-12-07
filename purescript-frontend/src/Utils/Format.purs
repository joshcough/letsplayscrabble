-- | Formatting utilities
module Utils.Format where

import Prelude

import Data.Maybe (Maybe(..))
import Data.String (Pattern(..), Replacement(..), replace)
import Data.String as String
import Domain.Types (LocationDataRow)

-- | Format a number with a sign (+ or -)
formatNumberWithSign :: Int -> String
formatNumberWithSign n
  | n > 0 = "+" <> show n
  | otherwise = show n

-- | Format player name (Last, First -> First Last)
formatPlayerName :: String -> String
formatPlayerName name =
  case String.indexOf (Pattern ",") name of
    Nothing -> name  -- No comma, return as-is
    Just idx ->
      let
        lastName = String.take idx name
        rest = String.drop (idx + 1) name
        firstName = String.trim rest
      in
        firstName <> " " <> lastName

-- | Format player location from LocationData (city, state or just city)
-- | Works with any record containing LocationData fields (e.g., CrossTablesPlayer)
formatLocation :: forall r. Maybe { | LocationDataRow r } -> Maybe String
formatLocation Nothing = Nothing
formatLocation (Just locationData) =
  case locationData.city of
    Nothing -> Nothing
    Just city -> Just $ case locationData.state of
      Just state -> city <> ", " <> state
      Nothing -> city

-- | Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
getOrdinalSuffix :: Int -> String
getOrdinalSuffix num =
  let j = num `mod` 10
      k = num `mod` 100
  in if j == 1 && k /= 11 then "st"
     else if j == 2 && k /= 12 then "nd"
     else if j == 3 && k /= 13 then "rd"
     else "th"

-- | Abbreviate tournament names to save space
abbreviateTournamentName :: String -> String
abbreviateTournamentName name =
  name
    # replace (Pattern "International") (Replacement "Int'l")
    # replace (Pattern "Tournament") (Replacement "Tourney")
    # replace (Pattern "National") (Replacement "Nat'l")
    # replace (Pattern "Invitational") (Replacement "Invit'l")
