-- | Broadcast channel operations abstraction
-- | Provides helper functions that work with any MonadBroadcast
module BroadcastChannel.Class
  ( postSubscribe
  , closeBroadcast
  , module Exports
  ) where

import Prelude

import BroadcastChannel.Manager as BroadcastManager
import BroadcastChannel.Messages (SubscribeMessage)
import BroadcastChannel.MonadBroadcast (class MonadBroadcast, getBroadcastManager)
import BroadcastChannel.MonadEmitters (subscribeTournamentData, subscribeAdminPanel) as Exports
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)

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

-- | Close the broadcast channel
closeBroadcast
  :: forall m
   . MonadAff m
  => MonadBroadcast m
  => m Unit
closeBroadcast = do
  manager <- getBroadcastManager
  liftEffect $ BroadcastManager.close manager
