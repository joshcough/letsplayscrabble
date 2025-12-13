-- | Halogen utility functions
module Utils.Halogen where

import Prelude

import Control.Monad.Error.Class (class MonadError, try)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Effect.Exception (Error, message)
import Halogen as H

-- | Execute an action with loading state management
-- | Sets loading=true before the action, and loading=false after
-- | On error, sets the error message in state
-- | On success, calls the success handler with loading already set to false
withLoading :: forall r action output m a.
  MonadError Error m =>
  m a ->
  (a -> H.HalogenM { loading :: Boolean, error :: Maybe String | r } action () output m Unit) ->
  H.HalogenM { loading :: Boolean, error :: Maybe String | r } action () output m Unit
withLoading action onSuccess = do
  H.modify_ _ { loading = true, error = Nothing }
  result <- H.lift $ try action
  case result of
    Left err ->
      H.modify_ _ { loading = false, error = Just (message err) }
    Right value -> do
      H.modify_ _ { loading = false }
      onSuccess value
