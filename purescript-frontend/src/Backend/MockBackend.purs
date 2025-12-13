-- | Mock implementation of MonadBackend for testing
-- | Returns hardcoded responses without making real HTTP calls
module Backend.MockBackend where

import Prelude

import Backend.MonadBackend (class MonadBackend)
import Control.Monad.Error.Class (class MonadError, class MonadThrow, throwError)
import Control.Monad.Except.Trans (ExceptT)
import Control.Monad.State.Class (class MonadState, get, put)
import Control.Monad.State.Trans (StateT)
import Data.Array as Array
import Data.Identity (Identity)
import Data.Maybe (Maybe(..), fromMaybe)
import Domain.Types (CreateCurrentMatch, CurrentMatch, DivisionId(..), PairingId(..), Tournament, TournamentId(..), TournamentSummary, UserId(..))
import Effect.Exception (Error, error)

-- | Mock backend state for testing
type MockState =
  { tournaments :: Array TournamentSummary
  , currentMatches :: Array CurrentMatch
  , loginSuccess :: Boolean
  , lastError :: Maybe String
  }

-- | Initial mock state
initialMockState :: MockState
initialMockState =
  { tournaments: []
  , currentMatches: []
  , loginSuccess: true
  , lastError: Nothing
  }

-- | Mock backend monad - wrapped in newtype to avoid orphan instance issues
-- | Pure ExceptT over StateT over Identity for fast, synchronous tests
newtype MockBackend a = MockBackend (ExceptT Error (StateT MockState Identity) a)

derive newtype instance Functor MockBackend
derive newtype instance Apply MockBackend
derive newtype instance Applicative MockBackend
derive newtype instance Bind MockBackend
derive newtype instance Monad MockBackend
derive newtype instance MonadState MockState MockBackend
derive newtype instance MonadThrow Error MockBackend
derive newtype instance MonadError Error MockBackend

-- | Instance for MockBackend
instance MonadBackend MockBackend where
  login credentials = do
    state <- get
    if state.loginSuccess
      then pure { token: "mock-token", userId: UserId 1, username: credentials.username }
      else throwError $ error $ fromMaybe "Login failed" state.lastError

  createTournament params = do
    let tournament =
          { id: TournamentId 999
          , name: params.name
          , city: params.city
          , year: params.year
          , lexicon: params.lexicon
          , longFormName: params.longFormName
          , dataUrl: params.dataUrl
          , pollUntil: Nothing
          , theme: params.theme
          , transparentBackground: false
          }
    state <- get
    put $ state { tournaments = state.tournaments <> [tournament] }
    pure tournament

  listTournaments = do
    state <- get
    pure state.tournaments

  getTournamentRow _userId _tournamentId = do
    state <- get
    case Array.head state.tournaments of
      Nothing -> throwError (error "Tournament not found")
      Just t -> pure t

  updateTournament tournamentId params = do
    let tournament =
          { id: tournamentId
          , name: params.name
          , city: params.city
          , year: params.year
          , lexicon: params.lexicon
          , longFormName: params.longFormName
          , dataUrl: params.dataUrl
          , pollUntil: Nothing
          , theme: params.theme
          , transparentBackground: false
          }
    pure tournament

  enablePolling tournamentId _days =
    pure $ "Polling enabled for tournament " <> show tournamentId

  stopPolling _tournamentId =
    pure unit

  clearCache =
    pure unit

  refetchTournament tournamentId =
    pure $ "Refetched tournament " <> show tournamentId

  fullRefetchTournament tournamentId =
    pure $ "Full refetch for tournament " <> show tournamentId

  getCurrentMatch _userId = do
    state <- get
    case Array.head state.currentMatches of
      Nothing -> pure Nothing
      Just match -> pure $ Just match

  getTournament _userId tournamentId = do
    -- Return a mock tournament with divisions
    let tournament =
          { id: tournamentId
          , name: "Mock Tournament"
          , city: "Mock City"
          , year: 2025
          , lexicon: "TWL"
          , longFormName: "Mock Tournament 2025"
          , dataUrl: "http://example.com"
          , theme: "scrabble"
          , transparentBackground: false
          , divisions: []
          }
    pure tournament

  setCurrentMatch request = do
    let match =
          { tournamentId: request.tournamentId
          , divisionId: request.divisionId
          , divisionName: "Division A"  -- Mock division name
          , round: request.round
          , pairingId: request.pairingId
          , updatedAt: "2025-12-08T00:00:00Z"  -- Mock timestamp
          }
    state <- get
    put $ state { currentMatches = [match] <> state.currentMatches }
    pure match
