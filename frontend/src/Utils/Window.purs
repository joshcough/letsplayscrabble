-- | Window and location utilities
module Utils.Window where

import Prelude
import Effect (Effect)
import Web.HTML (window)
import Web.HTML.Location (Location)
import Web.HTML.Window (location)

-- | Get the current window location
-- | Helper to avoid repeating `window >>= location` pattern
getLocation :: Effect Location
getLocation = window >>= location
