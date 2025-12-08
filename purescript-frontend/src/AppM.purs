module AppM where

import Prelude

import BroadcastChannel.Manager (BroadcastManager, EmitterManager)
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import Control.Monad.Reader.Trans (class MonadAsk, ReaderT, asks, runReaderT)
import Effect.Aff (Aff)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (class MonadEffect)

type AppEnv =
  { broadcastManager :: BroadcastManager
  , emitterManager :: EmitterManager
  }

newtype AppM a = AppM (ReaderT AppEnv Aff a)

derive newtype instance functorAppM :: Functor AppM
derive newtype instance applyAppM :: Apply AppM
derive newtype instance applicativeAppM :: Applicative AppM
derive newtype instance bindAppM :: Bind AppM
derive newtype instance monadAppM :: Monad AppM
derive newtype instance monadEffectAppM :: MonadEffect AppM
derive newtype instance monadAffAppM :: MonadAff AppM
derive newtype instance monadAskAppM :: MonadAsk AppEnv AppM

instance monadBroadcastAppM :: MonadBroadcast AppM where
  getBroadcastManager = asks _.broadcastManager

instance monadEmittersAppM :: MonadEmitters AppM where
  getEmitterManager = asks _.emitterManager

runAppM :: forall a. AppEnv -> AppM a -> Aff a
runAppM env (AppM m) = runReaderT m env
