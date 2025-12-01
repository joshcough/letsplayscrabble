-- | Player image utilities
module Utils.PlayerImage where

import Prelude

import Data.Maybe (Maybe(..), fromMaybe)
import Control.Alt ((<|>))
import Data.String (Pattern(..), Replacement(..))
import Data.String as String

-- | Get player image URL with proper fallback logic
-- | Priority: file photo → CrossTables photo → placeholder
getPlayerImageUrl :: String -> Maybe String -> Maybe String -> String
getPlayerImageUrl tournamentDataUrl filePhoto xtPhoto =
  fromMaybe placeholderImageUrl $
    (filePhoto <#> \photo ->
      let baseUrl = String.replace (Pattern "/tourney.js") (Replacement "") tournamentDataUrl
      in baseUrl <> "/" <> photo
    ) <|> xtPhoto

-- | Placeholder SVG for when no image is available
placeholderImageUrl :: String
placeholderImageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%236b7280'%3ENo Photo%3C/text%3E%3C/svg%3E"
