-- | MonadEmitters typeclass for accessing broadcast channel emitters
-- | Separated from MonadBroadcast to distinguish emitter access from basic operations
module BroadcastChannel.MonadEmitters
  ( class MonadEmitters
  , getEmitterManager
  , subscribeTournamentData
  , subscribeAdminPanel
  ) where

import Prelude

import BroadcastChannel.Manager (EmitterManager)
import BroadcastChannel.Messages (TournamentDataResponse, AdminPanelUpdate)
import Effect.Aff.Class (class MonadAff)
import Halogen.Subscription (Emitter)
import Halogen as H

-- | Typeclass for accessing broadcast channel emitters
class Monad m <= MonadEmitters m where
  getEmitterManager :: m EmitterManager

-- | Get emitter for tournament data responses
subscribeTournamentData
  :: forall m
   . MonadAff m
  => MonadEmitters m
  => m (Emitter TournamentDataResponse)
subscribeTournamentData = do
  emitterManager <- getEmitterManager
  pure emitterManager.tournamentDataResponseEmitter

-- | Get emitter for admin panel updates
subscribeAdminPanel
  :: forall m
   . MonadAff m
  => MonadEmitters m
  => m (Emitter AdminPanelUpdate)
subscribeAdminPanel = do
  emitterManager <- getEmitterManager
  pure emitterManager.adminPanelUpdateEmitter

-- | Lift MonadEmitters through HalogenM
instance monadEmittersHalogenM :: MonadEmitters m => MonadEmitters (H.HalogenM state action slots output m) where
  getEmitterManager = H.lift getEmitterManager
