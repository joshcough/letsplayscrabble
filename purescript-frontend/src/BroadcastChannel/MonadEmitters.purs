-- | MonadEmitters typeclass for accessing broadcast channel emitters
-- | Separated from MonadBroadcast to distinguish emitter access from basic operations
module BroadcastChannel.MonadEmitters
  ( class MonadEmitters
  , subscribeTournamentData
  , subscribeAdminPanel
  ) where

import Prelude

import BroadcastChannel.Messages (TournamentDataResponse, AdminPanelUpdate)
import BroadcastChannel.MonadBroadcast (class MonadBroadcast, getBroadcastManager)
import Effect.Aff.Class (class MonadAff)
import Halogen.Subscription (Emitter)
import Halogen as H

-- | Typeclass for accessing broadcast channel emitters
-- | Automatically provided for any monad with MonadBroadcast
class MonadBroadcast m <= MonadEmitters m

-- | Get emitter for tournament data responses
subscribeTournamentData
  :: forall m
   . MonadAff m
  => MonadEmitters m
  => m (Emitter TournamentDataResponse)
subscribeTournamentData = do
  manager <- getBroadcastManager
  pure manager.tournamentDataResponseEmitter

-- | Get emitter for admin panel updates
subscribeAdminPanel
  :: forall m
   . MonadAff m
  => MonadEmitters m
  => m (Emitter AdminPanelUpdate)
subscribeAdminPanel = do
  manager <- getBroadcastManager
  pure manager.adminPanelUpdateEmitter

-- | Lift MonadEmitters through HalogenM
instance monadEmittersHalogenM :: MonadEmitters m => MonadEmitters (H.HalogenM state action slots output m)
