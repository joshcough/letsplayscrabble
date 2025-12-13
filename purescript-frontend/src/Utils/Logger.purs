-- | Conditional logging utility
-- | Logging is DISABLED by default everywhere (including localhost/dev)
-- | To enable logging: add ?logging=true to URL parameter
-- | This prevents console bloat in long-running OBS overlays
module Utils.Logger
  ( log
  , logShow
  , loggingEnabled
  ) where

import Prelude

import Effect (Effect)

-- | Check if logging is currently enabled
-- | Logs are only enabled when URL contains ?logging=true parameter
foreign import loggingEnabled :: Boolean

-- | Log a message (only if logging is enabled)
-- | Usage: liftEffect $ log "My message"
foreign import logImpl :: String -> Effect Unit

-- | Log a message with a showable value (only if logging is enabled)
-- | Usage: liftEffect $ logShow "Label" someValue
foreign import logShowImpl :: forall a. String -> a -> Effect Unit

-- | Log a message (only if logging is enabled)
log :: String -> Effect Unit
log = logImpl

-- | Log a message with a showable value (only if logging is enabled)
logShow :: forall a. String -> a -> Effect Unit
logShow = logShowImpl
