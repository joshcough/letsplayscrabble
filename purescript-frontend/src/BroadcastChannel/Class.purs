-- | Broadcast channel operations abstraction
-- | Provides helper functions that work with any MonadBroadcast
module BroadcastChannel.Class
  ( postSubscribe
  , subscribeTournamentData
  , subscribeAdminPanel
  , closeBroadcast
  ) where

import Prelude

import BroadcastChannel.Manager as BroadcastManager
import BroadcastChannel.Messages (SubscribeMessage, TournamentDataResponse, AdminPanelUpdate)
import BroadcastChannel.MonadBroadcast (class MonadBroadcast, getBroadcastManager)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Halogen.Subscription (Emitter)

-- | Post a subscribe message to the broadcast channel
postSubscribe
  :: forall m
   . MonadAff m
  => MonadBroadcast m
  => SubscribeMessage
  -> m Unit
postSubscribe msg = do
  manager <- getBroadcastManager
  liftEffect $ BroadcastManager.postSubscribe manager msg

-- | Get emitter for tournament data responses
subscribeTournamentData
  :: forall m
   . MonadAff m
  => MonadBroadcast m
  => m (Emitter TournamentDataResponse)
subscribeTournamentData = do
  manager <- getBroadcastManager
  pure manager.tournamentDataResponseEmitter

-- | Get emitter for admin panel updates
subscribeAdminPanel
  :: forall m
   . MonadAff m
  => MonadBroadcast m
  => m (Emitter AdminPanelUpdate)
subscribeAdminPanel = do
  manager <- getBroadcastManager
  pure manager.adminPanelUpdateEmitter

-- | Close the broadcast channel
closeBroadcast
  :: forall m
   . MonadAff m
  => MonadBroadcast m
  => m Unit
closeBroadcast = do
  manager <- getBroadcastManager
  liftEffect $ BroadcastManager.close manager
