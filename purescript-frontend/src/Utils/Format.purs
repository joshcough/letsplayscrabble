-- | Formatting utilities
module Utils.Format where

import Prelude

import Data.Maybe (Maybe(..))
import Data.String as String
import Data.String.CodeUnits as SCU

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
        lastName = String.take idx name
        rest = String.drop (idx + 1) name
        firstName = String.trim rest
      in
        firstName <> " " <> lastName
