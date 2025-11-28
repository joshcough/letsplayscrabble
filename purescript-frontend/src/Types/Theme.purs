-- | Theme types
module Types.Theme where

import Prelude

-- | Theme colors
type ThemeColors =
  { background :: String
  , textPrimary :: String
  , textSecondary :: String
  , accent :: String
  , border :: String
  }

-- | Theme configuration
type Theme =
  { id :: String
  , name :: String
  , colors :: ThemeColors
  }

-- | Default theme
defaultTheme :: Theme
defaultTheme =
  { id: "default"
  , name: "Default"
  , colors:
      { background: "#ffffff"
      , textPrimary: "#000000"
      , textSecondary: "#666666"
      , accent: "#3b82f6"
      , border: "#e5e7eb"
      }
  }
