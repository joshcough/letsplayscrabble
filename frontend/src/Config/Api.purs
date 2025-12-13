-- | API configuration for environment-aware URLs
module Config.Api where

import Prelude
import Effect (Effect)
import Utils.Window (getLocation)
import Web.HTML.Location (origin)

-- | Get the current origin (protocol + host + port)
-- | In development: http://localhost:3000
-- | In production: https://your-heroku-app.herokuapp.com
getOrigin :: Effect String
getOrigin = getLocation >>= origin

-- | Get the base URL for API calls
-- | Returns empty string to use relative paths (works in both dev and prod)
getApiBaseUrl :: String
getApiBaseUrl = ""
