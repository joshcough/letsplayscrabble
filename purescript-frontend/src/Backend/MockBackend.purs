-- | Mock implementation of MonadBackend for testing
-- | Returns hardcoded responses without making real HTTP calls
module Backend.MockBackend where

import Prelude

import Backend.MonadBackend (class MonadBackend)
import Control.Monad.State.Class (class MonadState, get, put)
import Control.Monad.State.Trans (StateT)
import Data.Array as Array
import Data.Either (Either(..))
import Data.Maybe (Maybe(..), fromMaybe)
import Domain.Types (CreateCurrentMatch, CurrentMatch, DivisionId(..), PairingId(..), Tournament, TournamentId(..), TournamentSummary)
import Effect.Aff (Aff)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (class MonadEffect)

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
newtype MockBackend a = MockBackend (StateT MockState Aff a)

derive newtype instance Functor MockBackend
derive newtype instance Apply MockBackend
derive newtype instance Applicative MockBackend
derive newtype instance Bind MockBackend
derive newtype instance Monad MockBackend
derive newtype instance MonadEffect MockBackend
derive newtype instance MonadAff MockBackend
derive newtype instance MonadState MockState MockBackend

-- | Instance for MockBackend
instance MonadBackend MockBackend where
  login credentials = do
    state <- get
    if state.loginSuccess
      then pure $ Right { token: "mock-token", userId: 1, username: credentials.username }
      else pure $ Left $ fromMaybe "Login failed" state.lastError

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
    pure $ Right tournament

  listTournaments = do
    state <- get
    pure $ Right state.tournaments

  getTournamentRow _userId _tournamentId = do
    state <- get
    case Array.head state.tournaments of
      Nothing -> pure $ Left "Tournament not found"
      Just t -> pure $ Right t

  updateTournament tournamentId params = do
    let tournament =
          { id: TournamentId tournamentId
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
    pure $ Right tournament

  enablePolling tournamentId _days =
    pure $ Right $ "Polling enabled for tournament " <> show tournamentId

  stopPolling _tournamentId =
    pure $ Right unit

  clearCache =
    pure $ Right unit

  refetchTournament tournamentId =
    pure $ Right $ "Refetched tournament " <> show tournamentId

  fullRefetchTournament tournamentId =
    pure $ Right $ "Full refetch for tournament " <> show tournamentId

  getCurrentMatch _userId = do
    state <- get
    case Array.head state.currentMatches of
      Nothing -> pure $ Right Nothing
      Just match -> pure $ Right $ Just match

  getTournament _userId tournamentId = do
    -- Return a mock tournament with divisions
    let tournament =
          { id: TournamentId tournamentId
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
    pure $ Right tournament

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
    pure $ Right match
