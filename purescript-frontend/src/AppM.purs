module AppM where

import Prelude

import Backend.MonadBackend (class MonadBackend, clearCache, createTournament, enablePolling, fullRefetchTournament, getCurrentMatch, getTournament, getTournamentRow, listTournaments, login, refetchTournament, setCurrentMatch, stopPolling, updateTournament)
import BroadcastChannel.Manager (BroadcastManager, EmitterManager)
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import Control.Monad.Error.Class (class MonadError, class MonadThrow)
import Control.Monad.Reader.Trans (class MonadAsk, ReaderT, asks, runReaderT)
import Effect.Aff (Aff)
import Effect.Aff.Class (class MonadAff, liftAff)
import Effect.Class (class MonadEffect)
import Effect.Exception (Error)

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
derive newtype instance monadThrowAppM :: MonadThrow Error AppM
derive newtype instance monadErrorAppM :: MonadError Error AppM

instance monadBroadcastAppM :: MonadBroadcast AppM where
  getBroadcastManager = asks _.broadcastManager

instance monadEmittersAppM :: MonadEmitters AppM where
  getEmitterManager = asks _.emitterManager

-- Delegate all MonadBackend operations to the underlying Aff instance
instance monadBackendAppM :: MonadBackend AppM where
  login = liftAff <<< login
  createTournament = liftAff <<< createTournament
  listTournaments = liftAff listTournaments
  getTournamentRow userId = liftAff <<< getTournamentRow userId
  updateTournament tid = liftAff <<< updateTournament tid
  enablePolling tid = liftAff <<< enablePolling tid
  stopPolling = liftAff <<< stopPolling
  clearCache = liftAff clearCache
  refetchTournament = liftAff <<< refetchTournament
  fullRefetchTournament = liftAff <<< fullRefetchTournament
  getCurrentMatch = liftAff <<< getCurrentMatch
  getTournament uid = liftAff <<< getTournament uid
  setCurrentMatch = liftAff <<< setCurrentMatch

runAppM :: forall a. AppEnv -> AppM a -> Aff a
runAppM env (AppM m) = runReaderT m env
