-- | Base overlay component
-- | Handles broadcast channel subscription and tournament data fetching
-- | All overlay components should use this as their base
module Component.Overlay.BaseOverlay where

import Prelude

import BroadcastChannel.Class (postSubscribe, subscribeTournamentData, subscribeAdminPanel, closeBroadcast)
import BroadcastChannel.Messages (TournamentDataResponse, AdminPanelUpdate)
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import Config.Themes (getTheme)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Data.Newtype (class Newtype, over, unwrap)
import Domain.Types (DivisionScopedData, TournamentId)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.OverlayLogic (TournamentSubscription)
import Stats.OverlayLogic as OverlayLogic
import Types.Theme (Theme)

-- | Component input with polymorphic extra data
type Input extra =
  { userId :: Int
  , tournamentId :: Maybe TournamentId
  , divisionName :: Maybe String
  , extra :: extra
  }

-- | Export current match info type for use by other components
-- | (Re-export from OverlayLogic)
type CurrentMatchInfo = OverlayLogic.CurrentMatchInfo

-- | Component state with polymorphic extra data
newtype State extra = State
  { currentData :: Maybe DivisionScopedData
  , loading :: Boolean
  , error :: Maybe String
  , theme :: Theme
  , input :: Input extra
  , subscription :: Maybe TournamentSubscription
  , currentMatch :: Maybe CurrentMatchInfo
  , extra :: extra
  }

-- Derive Newtype instance for easier field access
derive instance newtypeState :: Newtype (State extra) _

-- | Component actions
data Action
  = Initialize
  | HandleTournamentData TournamentDataResponse
  | HandleAdminPanelUpdate AdminPanelUpdate
  | Finalize

-- | Initialize the base overlay state
-- | Manager is injected via input (dependency injection)
initialState :: forall extra. Input extra -> State extra
initialState input = State
  { currentData: Nothing
  , loading: true
  , error: Nothing
  , theme: getTheme "scrabble"
  , input: input
  , subscription: OverlayLogic.createTournamentSubscription input.tournamentId input.divisionName
  , currentMatch: Nothing
  , extra: input.extra
  }

--------------------------------------------------------------------------------
-- Pure State Update Functions (extracted for testing)
--------------------------------------------------------------------------------

-- | Pure function to handle tournament data response
-- | Returns updated state based on subscription mode and response validation
handleTournamentDataUpdate
  :: forall extra
   . TournamentDataResponse
  -> State extra
  -> State extra
handleTournamentDataUpdate response state =
  let s = unwrap state
  in case s.subscription of
    Nothing ->
      over State (_ { error = Just "Invalid subscription parameters", loading = false }) state

    Just subscription ->
      if not (OverlayLogic.shouldAcceptResponse subscription response) then
        state  -- Silently ignore responses not meant for us
      else
        case OverlayLogic.processTournamentDataResponse subscription s.currentMatch response of
          Left error ->
            over State (_ { error = Just error, loading = false }) state
          Right success ->
            over State (_
              { currentData = Just success.divisionScopedData
              , theme = success.theme
              , loading = false
              , error = Nothing
              }) state

-- | Pure function to handle admin panel update
-- | Returns updated state with current match info if in CurrentMatch mode
handleAdminPanelUpdateState
  :: forall extra
   . AdminPanelUpdate
  -> State extra
  -> State extra
handleAdminPanelUpdateState update state =
  let s = unwrap state
  in case s.subscription of
    Just subscription ->
      if OverlayLogic.shouldProcessAdminUpdate subscription then
        over State (_ { currentMatch = Just (OverlayLogic.createCurrentMatchInfo update) }) state
      else
        state
    Nothing ->
      state

-- | Initialize overlay: subscribe to broadcast channels and post subscribe message
initialize :: forall extra slots o m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.HalogenM (State extra) Action slots o m Unit
initialize = do
  -- Subscribe to tournament data responses
  tournamentDataEmitter <- subscribeTournamentData
  void $ H.subscribe $ tournamentDataEmitter <#> HandleTournamentData

  -- Subscribe to admin panel updates
  adminPanelEmitter <- subscribeAdminPanel
  void $ H.subscribe $ adminPanelEmitter <#> HandleAdminPanelUpdate

  -- Build and post subscribe message
  input <- H.gets \s -> (unwrap s).input
  postSubscribe $ OverlayLogic.buildSubscribeMessage input.userId input.tournamentId input.divisionName

-- | Handle base overlay actions
handleAction :: forall extra slots o m. MonadAff m => MonadBroadcast m => MonadEmitters m => Action -> H.HalogenM (State extra) Action slots o m Unit
handleAction = case _ of
  Initialize -> initialize
  HandleTournamentData response -> H.modify_ (handleTournamentDataUpdate response)
  HandleAdminPanelUpdate update -> H.modify_ (handleAdminPanelUpdateState update)
  Finalize -> closeBroadcast

-- | Render loading state
renderLoading :: forall w i. HH.HTML w i
renderLoading =
  HH.div
    [ HP.class_ (HH.ClassName "flex items-center justify-center h-screen") ]
    [ HH.text "Loading..." ]

-- | Render error state
renderError :: forall w i. String -> HH.HTML w i
renderError err =
  HH.div
    [ HP.class_ (HH.ClassName "flex items-center justify-center h-screen text-red-600") ]
    [ HH.text $ "Error: " <> err ]

-- | Helper function to handle loading/error/success rendering pattern
-- | Usage: renderWithData state \tournamentData -> ... your component rendering ...
renderWithData :: forall extra w i. State extra -> (DivisionScopedData -> HH.HTML w i) -> HH.HTML w i
renderWithData state renderContent =
  let s = unwrap state
  in if s.loading then
    renderLoading
  else
    maybe (renderError $ fromMaybe "No tournament data" s.error) renderContent s.currentData
