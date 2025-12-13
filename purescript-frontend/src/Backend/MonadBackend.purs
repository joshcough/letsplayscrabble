-- | Typeclass for backend HTTP operations
-- | Allows components to be tested without real HTTP calls
module Backend.MonadBackend where

import Prelude

import API.Auth as AuthAPI
import API.CurrentMatch as CurrentMatchAPI
import API.Tournament as TournamentAPI
import Control.Monad.Error.Class (class MonadError, throwError)
import Data.Either (either)
import Data.Maybe (Maybe)
import Domain.Types (CreateCurrentMatch, CurrentMatch, Tournament, TournamentId(..), TournamentSummary, UserId(..))
import Effect.Aff (Aff)
import Effect.Exception (Error, error)

-- | Typeclass for backend operations
-- | Uses MonadError for error handling instead of returning Either
class MonadError Error m <= MonadBackend m where
  -- Auth operations
  login :: { username :: String, password :: String } -> m { token :: String, userId :: UserId, username :: String }

  -- Tournament operations
  createTournament ::
    { name :: String
    , city :: String
    , year :: Int
    , lexicon :: String
    , longFormName :: String
    , dataUrl :: String
    , theme :: String
    } -> m TournamentSummary

  listTournaments :: m (Array TournamentSummary)

  getTournamentRow :: UserId -> TournamentId -> m TournamentSummary

  updateTournament ::
    TournamentId ->
    { name :: String
    , longFormName :: String
    , city :: String
    , year :: Int
    , lexicon :: String
    , theme :: String
    , dataUrl :: String
    } -> m TournamentSummary

  enablePolling :: TournamentId -> Int -> m String

  stopPolling :: TournamentId -> m Unit

  clearCache :: m Unit

  refetchTournament :: TournamentId -> m String

  fullRefetchTournament :: TournamentId -> m String

  -- CurrentMatch operations
  getCurrentMatch :: UserId -> m (Maybe CurrentMatch)

  getTournament :: UserId -> TournamentId -> m Tournament

  setCurrentMatch :: CreateCurrentMatch -> m CurrentMatch

-- | Real Aff instance - uses real HTTP calls via Affjax
-- | Converts Either results to MonadError
instance MonadBackend Aff where
  login credentials =
    AuthAPI.login credentials >>= either (throwError <<< error) \res -> pure (res { userId = UserId res.userId })

  createTournament params =
    TournamentAPI.createTournament params >>= either (throwError <<< error) pure

  listTournaments =
    TournamentAPI.listTournaments >>= either (throwError <<< error) pure

  getTournamentRow (UserId userId) (TournamentId tournamentId) =
    TournamentAPI.getTournamentRow userId tournamentId >>= either (throwError <<< error) pure

  updateTournament (TournamentId tournamentId) params =
    TournamentAPI.updateTournament tournamentId params >>= either (throwError <<< error) pure

  enablePolling (TournamentId tournamentId) days =
    TournamentAPI.enablePolling tournamentId days >>= either (throwError <<< error) pure

  stopPolling (TournamentId tournamentId) =
    TournamentAPI.stopPolling tournamentId >>= either (throwError <<< error) pure

  clearCache =
    TournamentAPI.clearCache >>= either (throwError <<< error) pure

  refetchTournament (TournamentId tournamentId) =
    TournamentAPI.refetchTournament tournamentId >>= either (throwError <<< error) pure

  fullRefetchTournament (TournamentId tournamentId) =
    TournamentAPI.fullRefetchTournament tournamentId >>= either (throwError <<< error) pure

  getCurrentMatch (UserId userId) =
    CurrentMatchAPI.getCurrentMatch userId >>= either (throwError <<< error) pure

  getTournament (UserId userId) (TournamentId tournamentId) =
    CurrentMatchAPI.getTournament userId tournamentId >>= either (throwError <<< error) pure

  setCurrentMatch request =
    CurrentMatchAPI.setCurrentMatch request >>= either (throwError <<< error) pure
