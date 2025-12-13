-- | Formatting utilities
module Utils.Format where

import Prelude

import Control.Alt ((<|>))
import Data.Array (find, head, last)
import Data.Int (toNumber, round) as Int
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Number (pow)
import Data.String (Pattern(..), Replacement(..), replace, split, joinWith, take, drop, indexOf, trim) as String
import Data.String.CodePoints as String
import Data.String.CodeUnits as SCU
import Data.Number.Format (fixed, toStringWith)
import Domain.Types (LocationDataRow, CrossTablesPlayer, TournamentResult)

-- | Format a number with a sign (+ or -)
formatNumberWithSign :: Int -> String
formatNumberWithSign n
  | n > 0 = "+" <> show n
  | otherwise = show n

-- | Format player name (Last, First -> First Last)
formatPlayerName :: String -> String
formatPlayerName name =
  case String.indexOf (String.Pattern ",") name of
    Nothing -> name  -- No comma, return as-is
    Just idx ->
      let
        lastName = SCU.take idx name
        rest = SCU.drop (idx + 1) name
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

-- | Format rank with ordinal suffix (1 -> 1st, 2 -> 2nd, etc.)
formatRankOrdinal :: Int -> String
formatRankOrdinal rank = show rank <> getOrdinalSuffix rank

-- | Abbreviate tournament names to save space
abbreviateTournamentName :: String -> String
abbreviateTournamentName name =
  name
    # String.replace (String.Pattern "International") (String.Replacement "Int'l")
    # String.replace (String.Pattern "Tournament") (String.Replacement "Tourney")
    # String.replace (String.Pattern "National") (String.Replacement "Nat'l")
    # String.replace (String.Pattern "Invitational") (String.Replacement "Invit'l")

-- | Get initials from a player name
getInitials :: String -> String
getInitials name =
  let formatted = formatPlayerName name
      words = String.split (String.Pattern " ") formatted
      initials = map (\w -> fromMaybe "" (head (String.split (String.Pattern "") w))) words
  in String.joinWith "" initials

-- | Format a number with specified decimal places
formatNumber :: Number -> Int -> String
formatNumber num decimals =
  let factor = pow 10.0 (Int.toNumber decimals)
      rounded = Int.toNumber (Int.round (num * factor)) / factor
  in show rounded

-- | Format a date string from YYYY-MM-DD to "Mon DD, YYYY"
formatDate :: String -> String
formatDate dateString =
  case String.split (String.Pattern "-") dateString of
    [year, month, day] ->
      let
        monthName = case month of
          "01" -> "Jan"
          "02" -> "Feb"
          "03" -> "Mar"
          "04" -> "Apr"
          "05" -> "May"
          "06" -> "Jun"
          "07" -> "Jul"
          "08" -> "Aug"
          "09" -> "Sep"
          "10" -> "Oct"
          "11" -> "Nov"
          "12" -> "Dec"
          _ -> month
        -- Remove leading zero from day
        dayNum = case day of
          d | String.take 1 d == "0" -> String.drop 1 d
          d -> d
      in monthName <> " " <> dayNum <> ", " <> year
    _ -> dateString

--------------------------------------------------------------------------------
-- CrossTables-specific utilities
--------------------------------------------------------------------------------

-- | Get current rating from player (last in history or initial rating)
getCurrentRating :: { initialRating :: Int, ratingsHistory :: Array Int } -> Maybe Int
getCurrentRating player =
  case player.ratingsHistory of
    [] -> Just player.initialRating
    ratings -> last ratings <|> Just player.initialRating

-- | Get ranking from CrossTables data (TWL or CSW)
getRanking :: Maybe CrossTablesPlayer -> Maybe Int
getRanking xtData = do
  data' <- xtData
  data'.twlranking <|> data'.cswranking

-- | Calculate win percentage including ties (ties count as 0.5 wins)
calculateWinPercentage :: Maybe CrossTablesPlayer -> Maybe Number
calculateWinPercentage xtData = do
  data' <- xtData
  wins <- data'.w
  losses <- data'.l
  ties <- data'.t
  let totalGames = wins + losses + ties
  if totalGames == 0
    then pure 0.0
    else do
      let effectiveWins = Int.toNumber wins + (Int.toNumber ties * 0.5)
          percentage = (effectiveWins / Int.toNumber totalGames) * 100.0
      pure $ Int.toNumber (Int.round (percentage * 10.0)) / 10.0

-- | Get most recent tournament result (prefers wins, then any result)
getRecentTournament :: Maybe CrossTablesPlayer -> Maybe TournamentResult
getRecentTournament xtData = do
  results <- xtData >>= _.results
  -- Find recent win first, otherwise take first result
  find (\r -> r.place == 1) results <|> head results

--------------------------------------------------------------------------------
-- Number formatting utilities
--------------------------------------------------------------------------------

-- | Format number with commas (e.g., 1234567 -> "1,234,567")
formatWithCommas :: Int -> String
formatWithCommas n =
  let
    str = show n
    len = String.length str
    go :: Int -> String -> String
    go idx acc =
      if idx <= 0 then acc
      else
        let
          digitIdx = len - idx
          digit = String.take 1 (String.drop digitIdx str)
          needsComma = idx `mod` 3 == 0 && idx < len
        in
          go (idx - 1) (acc <> digit <> if needsComma then "," else "")
  in
    go len ""

-- | Format percentage to 1 decimal place (e.g., 67.89 -> "67.9%")
formatPercent :: Number -> String
formatPercent n =
  let
    rounded = Int.toNumber (Int.round (n * 10.0)) / 10.0
  in
    toStringWith (fixed 1) rounded <> "%"
