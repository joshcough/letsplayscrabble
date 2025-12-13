-- | Color utility functions for styling based on values
module Utils.Color where

import Prelude

import Data.String as String
import Types.Theme (Theme)

-- | Get color for signed numbers based on integer value (positive = red, negative = blue)
getSignedNumberColor :: Theme -> Int -> String
getSignedNumberColor theme value
  | value > 0 = "text-red-600"
  | value < 0 = "text-blue-600"
  | otherwise = theme.colors.textPrimary

-- | Get color based on string value (starting with +/-)
-- | Used for pre-formatted strings like "+10" or "-5"
getSignedStringColor :: String -> String
getSignedStringColor value =
  case String.take 1 value of
    "+" -> "text-red-600"
    "-" -> "text-blue-600"
    _ -> "text-gray-800"

-- | Alias for rating change colors (positive = better)
getRatingChangeColor :: String -> String
getRatingChangeColor = getSignedStringColor

-- | Alias for spread colors (positive = better)
getSpreadColor :: String -> String
getSpreadColor = getSignedStringColor
