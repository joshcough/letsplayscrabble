-- | Pure helper functions for WorkerPage
-- | Extracted for testability
module Component.WorkerPageHelpers
  ( getStatusColor
  ) where

import Prelude

import Data.Maybe (Maybe(..))

-- | Determine status indicator color based on error state and connection status
getStatusColor :: Maybe String -> String -> String
getStatusColor error status =
  case error of
    Just _ -> "#ff4444"  -- Red for errors
    Nothing ->
      if status == "Connected" then "#44ff44"  -- Green for connected
      else if status == "Connecting" || status == "Initializing..." then "#ffaa44"  -- Orange for connecting
      else "#666666"  -- Gray for other states
