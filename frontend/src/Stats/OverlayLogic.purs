-- | Pure logic functions for overlay components
-- | Extracted from BaseOverlay for testability
module Stats.OverlayLogic where

import Prelude

import BroadcastChannel.Messages (SubscribeMessage, TournamentDataResponse, AdminPanelUpdate)
import Config.Themes (getTheme)
import Data.Array (find)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..), Division, Tournament, TournamentSummary, DivisionScopedData)
import Types.Theme (Theme)

--------------------------------------------------------------------------------
-- Subscription Mode
--------------------------------------------------------------------------------

-- | Represents what we're subscribing to
data TournamentSubscription
  = SpecificTournament { tournamentId :: TournamentId, divisionName :: String }
  | CurrentMatch

derive instance eqTournamentSubscription :: Eq TournamentSubscription

instance showTournamentSubscription :: Show TournamentSubscription where
  show CurrentMatch = "CurrentMatch"
  show (SpecificTournament { tournamentId, divisionName }) =
    "SpecificTournament { tournamentId: " <> show tournamentId <> ", divisionName: " <> show divisionName <> " }"

-- | Create a TournamentSubscription from input parameters
createTournamentSubscription :: Maybe TournamentId -> Maybe String -> Maybe TournamentSubscription
createTournamentSubscription maybeTournamentId maybeDivisionName =
  case maybeTournamentId, maybeDivisionName of
    Just tid, Just divName -> Just (SpecificTournament { tournamentId: tid, divisionName: divName })
    Nothing, Nothing -> Just CurrentMatch
    _, _ -> Nothing  -- Invalid combination (tournament ID without division name, or vice versa)

-- | Build subscribe message from TournamentSubscription
buildSubscribeMessage :: Int -> TournamentSubscription -> SubscribeMessage
buildSubscribeMessage userId subscription =
  case subscription of
    CurrentMatch ->
      { userId
      , tournament: Nothing
      }
    SpecificTournament { tournamentId, divisionName } ->
      { userId
      , tournament: Just
          { tournamentId
          , division: Just { divisionName }
          }
      }

--------------------------------------------------------------------------------
-- Response Filtering
--------------------------------------------------------------------------------

-- | Determine if a TournamentDataResponse should be accepted
-- | In current match mode: accept if response is marked as current match
-- | In specific tournament mode: accept if tournament IDs match
shouldAcceptResponse
  :: TournamentSubscription
  -> TournamentDataResponse
  -> Boolean
shouldAcceptResponse subscription response =
  case subscription of
    CurrentMatch -> response.isCurrentMatch
    SpecificTournament { tournamentId } ->
      let TournamentId tid = tournamentId
          TournamentId responseTid = response.tournamentId
      in tid == responseTid

--------------------------------------------------------------------------------
-- Division Resolution
--------------------------------------------------------------------------------

-- | Resolve which division name to use based on subscription mode
-- | In current match mode: use divisionName from currentMatch
-- | In specific tournament mode: use divisionName from subscription
resolveDivisionName
  :: forall r
   . TournamentSubscription
  -> Maybe { divisionName :: String | r }  -- currentMatch
  -> Maybe String
resolveDivisionName subscription currentMatch =
  case subscription of
    CurrentMatch -> _.divisionName <$> currentMatch
    SpecificTournament { divisionName } -> Just divisionName

-- | Find division by name in tournament
findDivisionByName :: String -> Array Division -> Maybe Division
findDivisionByName name divisions =
  find (\d -> d.name == name) divisions

--------------------------------------------------------------------------------
-- Data Conversion
--------------------------------------------------------------------------------

-- | Create TournamentSummary from full Tournament
createTournamentSummary :: Tournament -> TournamentSummary
createTournamentSummary tournament =
  { id: tournament.id
  , name: tournament.name
  , city: tournament.city
  , year: tournament.year
  , lexicon: tournament.lexicon
  , longFormName: tournament.longFormName
  , dataUrl: tournament.dataUrl
  , pollUntil: Nothing  -- Not present in Tournament type
  , theme: tournament.theme
  , transparentBackground: tournament.transparentBackground
  }

-- | Create DivisionScopedData from TournamentSummary and Division
createDivisionScopedData :: TournamentSummary -> Division -> DivisionScopedData
createDivisionScopedData tournament division =
  { tournament
  , division
  }

--------------------------------------------------------------------------------
-- Error Formatting
--------------------------------------------------------------------------------

-- | Format error message when division is not found
formatDivisionNotFoundError :: Maybe String -> String
formatDivisionNotFoundError divisionName =
  "Division not found: " <> show divisionName

--------------------------------------------------------------------------------
-- Admin Panel Update Processing
--------------------------------------------------------------------------------

-- | Type for CurrentMatchInfo extracted from AdminPanelUpdate
type CurrentMatchInfo =
  { tournamentId :: TournamentId
  , round :: Int
  , pairingId :: Int
  , divisionName :: String
  }

-- | Create CurrentMatchInfo from AdminPanelUpdate
createCurrentMatchInfo :: AdminPanelUpdate -> CurrentMatchInfo
createCurrentMatchInfo update =
  { tournamentId: update.tournamentId
  , round: update.round
  , pairingId: update.pairingId
  , divisionName: update.divisionName
  }

-- | Determine if we should process an admin panel update
shouldProcessAdminUpdate :: TournamentSubscription -> Boolean
shouldProcessAdminUpdate subscription =
  case subscription of
    CurrentMatch -> true
    SpecificTournament _ -> false

--------------------------------------------------------------------------------
-- Tournament Data Processing Pipeline
--------------------------------------------------------------------------------

-- | Result of processing tournament data
type TournamentDataResult =
  { divisionScopedData :: DivisionScopedData
  , theme :: Theme
  , divisionName :: String
  }

-- | Process a tournament data response into either an error or success result
-- | This encapsulates the entire "handle tournament data" logic
processTournamentDataResponse
  :: forall r
   . TournamentSubscription                     -- subscription mode (SpecificTournament or CurrentMatch)
  -> Maybe { divisionName :: String | r }      -- current match info (only used in CurrentMatch mode to get divisionName)
  -> TournamentDataResponse                     -- response
  -> Either String TournamentDataResult
processTournamentDataResponse subscription currentMatch response =
  let
    -- Resolve which division name to use:
    -- - SpecificTournament mode: use divisionName from subscription
    -- - CurrentMatch mode: use divisionName from currentMatch (AdminPanelUpdate)
    divisionName = resolveDivisionName subscription currentMatch

    -- Find the division in the tournament
    division = divisionName >>= \name -> findDivisionByName name response.data.divisions
  in
    case division of
      Nothing ->
        Left (formatDivisionNotFoundError divisionName)

      Just div ->
        let
          -- Create tournament summary
          tournamentSummary = createTournamentSummary response.data

          -- Create division scoped data
          divisionScopedData = createDivisionScopedData tournamentSummary div

          -- Get theme from tournament data
          theme = getTheme response.data.theme
        in
          Right
            { divisionScopedData
            , theme
            , divisionName: div.name
            }
