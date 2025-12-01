-- | Theme types
module Types.Theme where

import Prelude

-- | Theme colors - Tailwind CSS class strings
type ThemeColors =
  { pageBackground :: String
  , cardBackground :: String
  , primaryBorder :: String
  , secondaryBorder :: String
  , titleGradient :: String
  , textPrimary :: String
  , textSecondary :: String
  , textAccent :: String
  , positiveColor :: String
  , negativeColor :: String
  , neutralColor :: String
  , hoverBackground :: String
  , shadowColor :: String
  }

-- | Theme configuration
type Theme =
  { id :: String
  , name :: String
  , colors :: ThemeColors
  , titleExtraClasses :: String  -- Extra classes needed for title gradient (e.g., "text-transparent bg-clip-text")
  }
