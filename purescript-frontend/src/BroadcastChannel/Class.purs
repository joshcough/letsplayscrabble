-- | Broadcast channel operations abstraction
-- | Provides helper functions that work with any state containing a manager
module BroadcastChannel.Class
  ( postSubscribe
  , subscribeTournamentData
  , subscribeAdminPanel
  , closeBroadcast
  ) where

import Prelude

import BroadcastChannel.Manager (BroadcastManager)
import BroadcastChannel.Manager as BroadcastManager
import BroadcastChannel.Messages (SubscribeMessage, TournamentDataResponse, AdminPanelUpdate)
import Control.Monad.State.Class (class MonadState, gets)
import Data.Newtype (class Newtype, unwrap)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Halogen.Subscription (Emitter)

-- | Post a subscribe message to the broadcast channel
-- | Works with any MonadState that has a newtype state wrapping { input :: { manager :: ... }, ... }
postSubscribe
  :: forall state rec r1 m
   . MonadAff m
  => MonadState state m
  => Newtype state { input :: { manager :: BroadcastManager | r1 } | rec }
  => SubscribeMessage
  -> m Unit
postSubscribe msg = do
  manager <- gets \s -> (unwrap s).input.manager
  liftEffect $ BroadcastManager.postSubscribe manager msg

-- | Get emitter for tournament data responses
subscribeTournamentData
  :: forall state rec r1 m
   . MonadAff m
  => MonadState state m
  => Newtype state { input :: { manager :: BroadcastManager | r1 } | rec }
  => m (Emitter TournamentDataResponse)
subscribeTournamentData = do
  manager <- gets \s -> (unwrap s).input.manager
  pure manager.tournamentDataResponseEmitter

-- | Get emitter for admin panel updates
subscribeAdminPanel
  :: forall state rec r1 m
   . MonadAff m
  => MonadState state m
  => Newtype state { input :: { manager :: BroadcastManager | r1 } | rec }
  => m (Emitter AdminPanelUpdate)
subscribeAdminPanel = do
  manager <- gets \s -> (unwrap s).input.manager
  pure manager.adminPanelUpdateEmitter

-- | Close the broadcast channel
closeBroadcast
  :: forall state rec r1 m
   . MonadAff m
  => MonadState state m
  => Newtype state { input :: { manager :: BroadcastManager | r1 } | rec }
  => m Unit
closeBroadcast = do
  manager <- gets \s -> (unwrap s).input.manager
  liftEffect $ BroadcastManager.close manager
