-- | Typeclass for backend HTTP operations
-- | Allows components to be tested without real HTTP calls
module Backend.MonadBackend where

import Prelude

import API.Auth as AuthAPI
import API.CurrentMatch as CurrentMatchAPI
import API.Tournament as TournamentAPI
import Data.Either (Either)
import Data.Maybe (Maybe)
import Domain.Types (CreateCurrentMatch, CurrentMatch, Tournament, TournamentSummary)
import Effect.Aff (Aff)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (class MonadEffect)

-- | Typeclass for backend operations
class (MonadAff m, MonadEffect m) <= MonadBackend m where
  -- Auth operations
  login :: { username :: String, password :: String } -> m (Either String { token :: String, userId :: Int, username :: String })

  -- Tournament operations
  createTournament ::
    { name :: String
    , city :: String
    , year :: Int
    , lexicon :: String
    , longFormName :: String
    , dataUrl :: String
    , theme :: String
    } -> m (Either String TournamentSummary)

  listTournaments :: m (Either String (Array TournamentSummary))

  getTournamentRow :: Int -> Int -> m (Either String TournamentSummary)

  updateTournament ::
    Int ->
    { name :: String
    , longFormName :: String
    , city :: String
    , year :: Int
    , lexicon :: String
    , theme :: String
    , dataUrl :: String
    } -> m (Either String TournamentSummary)

  enablePolling :: Int -> Int -> m (Either String String)

  stopPolling :: Int -> m (Either String Unit)

  clearCache :: m (Either String Unit)

  refetchTournament :: Int -> m (Either String String)

  fullRefetchTournament :: Int -> m (Either String String)

  -- CurrentMatch operations
  getCurrentMatch :: Int -> m (Either String (Maybe CurrentMatch))

  getTournament :: Int -> Int -> m (Either String Tournament)

  setCurrentMatch :: CreateCurrentMatch -> m (Either String CurrentMatch)

-- | Real Aff instance - uses real HTTP calls via Affjax
instance MonadBackend Aff where
  login credentials = AuthAPI.login credentials

  createTournament params = TournamentAPI.createTournament params

  listTournaments = TournamentAPI.listTournaments

  getTournamentRow userId tournamentId = TournamentAPI.getTournamentRow userId tournamentId

  updateTournament tournamentId params = TournamentAPI.updateTournament tournamentId params

  enablePolling tournamentId days = TournamentAPI.enablePolling tournamentId days

  stopPolling tournamentId = TournamentAPI.stopPolling tournamentId

  clearCache = TournamentAPI.clearCache

  refetchTournament tournamentId = TournamentAPI.refetchTournament tournamentId

  fullRefetchTournament tournamentId = TournamentAPI.fullRefetchTournament tournamentId

  getCurrentMatch userId = CurrentMatchAPI.getCurrentMatch userId

  getTournament userId tournamentId = CurrentMatchAPI.getTournament userId tournamentId

  setCurrentMatch request = CurrentMatchAPI.setCurrentMatch request
