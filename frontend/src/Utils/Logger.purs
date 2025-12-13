-- | Conditional logging utility
-- | Logging is DISABLED by default everywhere (including localhost/dev)
-- | To enable logging: add ?logging=true to URL parameter
-- | This prevents console bloat in long-running OBS overlays
module Utils.Logger
  ( log
  , logShow
  , isLoggingEnabled
  ) where

import Prelude

import Data.String (Pattern(..), contains)
import Effect (Effect)
import Effect.Console as Console
import Utils.Window (getLocation)
import Web.HTML.Location as Location

-- | Check if logging is currently enabled by checking URL parameters
-- | Checks both hash-based routing (#/path?logging=true) and regular query params
isLoggingEnabled :: Effect Boolean
isLoggingEnabled = do
  loc <- getLocation
  hash <- Location.hash loc
  search <- Location.search loc

  -- Check if either the hash or search contains ?logging=true or &logging=true
  pure $ checkQueryString hash || checkQueryString search
  where
    checkQueryString :: String -> Boolean
    checkQueryString str =
      contains (Pattern "?logging=true") str ||
      contains (Pattern "&logging=true") str

-- | Log a message (only if logging is enabled)
-- | Usage: liftEffect $ log "My message"
log :: String -> Effect Unit
log message = do
  enabled <- isLoggingEnabled
  when enabled $ Console.log message

-- | Log a message with a showable value (only if logging is enabled)
-- | Usage: liftEffect $ logShow "Label" someValue
logShow :: forall a. Show a => String -> a -> Effect Unit
logShow label value = do
  enabled <- isLoggingEnabled
  when enabled $ Console.log $ label <> " " <> show value
