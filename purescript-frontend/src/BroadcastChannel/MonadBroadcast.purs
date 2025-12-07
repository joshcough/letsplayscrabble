module BroadcastChannel.MonadBroadcast where

import Prelude

import BroadcastChannel.Manager (BroadcastManager)
import Halogen as H

class Monad m <= MonadBroadcast m where
  getBroadcastManager :: m BroadcastManager

-- | Lift MonadBroadcast through HalogenM
instance monadBroadcastHalogenM :: MonadBroadcast m => MonadBroadcast (H.HalogenM state action slots output m) where
  getBroadcastManager = H.lift getBroadcastManager
