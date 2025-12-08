-- | Base overlay component
-- | Handles broadcast channel subscription and tournament data fetching
-- | All overlay components should use this as their base
module Component.Overlay.BaseOverlay where

import Prelude

import BroadcastChannel.Class (postSubscribe, subscribeTournamentData, subscribeAdminPanel, closeBroadcast)
import BroadcastChannel.Messages (TournamentDataResponse, AdminPanelUpdate)
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import CSS.Class as C
import Config.Themes (getTheme)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Domain.Types (DivisionScopedData)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Stats.OverlayLogic (TournamentSubscription)
import Stats.OverlayLogic as OverlayLogic
import Types.Theme (Theme)
import Utils.CSS (css, cls)

-- | Component input with polymorphic extra data
type Input extra =
  { userId :: Int
  , subscription :: TournamentSubscription
  , extra :: extra
  }

-- | Export current match info type for use by other components
-- | (Re-export from OverlayLogic)
type CurrentMatchInfo = OverlayLogic.CurrentMatchInfo

-- | Component state with polymorphic extra data
type State extra =
  { currentData :: Maybe DivisionScopedData
  , loading :: Boolean
  , error :: Maybe String
  , theme :: Theme
  , input :: Input extra
  , subscription :: TournamentSubscription
  , currentMatch :: Maybe CurrentMatchInfo
  , extra :: extra
  }

-- | Component actions
data Action
  = Initialize
  | HandleTournamentData TournamentDataResponse
  | HandleAdminPanelUpdate AdminPanelUpdate
  | Finalize

-- | Initialize the base overlay state
initialState :: forall extra. Input extra -> State extra
initialState input =
  { currentData: Nothing
  , loading: true
  , error: Nothing
  , theme: getTheme "scrabble"
  , input: input
  , subscription: input.subscription
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
handleTournamentDataUpdate response state@{ subscription, currentMatch }
  | not (OverlayLogic.shouldAcceptResponse subscription response) = state
  | otherwise = case OverlayLogic.processTournamentDataResponse subscription currentMatch response of
      Left error ->  state { error = Just error, loading = false }
      Right success ->
        state
          { currentData = Just success.divisionScopedData
          , theme = success.theme
          , loading = false
          , error = Nothing
          }

-- | Pure function to handle admin panel update
-- | Returns updated state with current match info if in CurrentMatch mode
handleAdminPanelUpdateState
  :: forall extra
   . AdminPanelUpdate
  -> State extra
  -> State extra
handleAdminPanelUpdateState update state@{ subscription }
  | OverlayLogic.shouldProcessAdminUpdate subscription =
      state { currentMatch = Just (OverlayLogic.createCurrentMatchInfo update) }
  | otherwise = state

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
  input <- H.gets _.input
  postSubscribe $ OverlayLogic.buildSubscribeMessage input.userId input.subscription

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
    [ css [cls C.Flex, cls C.ItemsCenter, cls C.JustifyCenter, cls C.HScreen] ]
    [ HH.text "Loading..." ]

-- | Render error state
renderError :: forall w i. String -> HH.HTML w i
renderError err =
  HH.div
    [ css [cls C.Flex, cls C.ItemsCenter, cls C.JustifyCenter, cls C.HScreen, cls C.TextRed600] ]
    [ HH.text $ "Error: " <> err ]

-- | Helper function to handle loading/error/success rendering pattern
-- | Usage: renderWithData state \tournamentData -> ... your component rendering ...
renderWithData :: forall extra w i. State extra -> (DivisionScopedData -> HH.HTML w i) -> HH.HTML w i
renderWithData state _ | state.loading = renderLoading
renderWithData state renderContent | otherwise =
  maybe (renderError $ fromMaybe "No tournament data" state.error) renderContent state.currentData
