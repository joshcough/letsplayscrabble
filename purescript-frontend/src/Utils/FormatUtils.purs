-- | Formatting utilities
module Utils.FormatUtils where

import Prelude

import Data.Int (toNumber)
import Data.Number.Format (toString)

-- | Format number with sign (e.g., "+50" or "-30")
formatNumberWithSign :: Int -> String
formatNumberWithSign n
  | n > 0 = "+" <> toString (toNumber n)
  | n < 0 = toString (toNumber n)
  | otherwise = "0"
