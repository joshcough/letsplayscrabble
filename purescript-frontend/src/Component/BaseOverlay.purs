-- | Base overlay component
-- | Handles broadcast channel subscription and tournament data fetching
-- | All overlay components should use this as their base
module Component.BaseOverlay where

import Prelude

import BroadcastChannel.Manager as BroadcastManager
import BroadcastChannel.Messages (TournamentDataResponse, SubscribeMessage, AdminPanelUpdate)
import Config.Themes (getTheme)
import Data.Array (length)
import Data.Maybe (Maybe(..))
import Domain.Types (DivisionScopedData, TournamentId(..), DivisionId, PairingId, Tournament, Division, TournamentSummary)
import Data.Array (find)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Effect.Console as Console
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)

-- | Component input
type Input =
  { userId :: Int
  , tournamentId :: Maybe TournamentId
  , divisionName :: Maybe String
  , extraData :: Maybe String  -- Extra data field for component-specific needs (e.g., MiscOverlay source)
  }

-- | Export current match info type for use by other components
type CurrentMatchInfo =
  { round :: Int
  , pairingId :: Int
  , divisionName :: String
  }

-- | Component state
type State =
  { manager :: Maybe BroadcastManager.BroadcastManager
  , tournament :: Maybe DivisionScopedData
  , divisionName :: String
  , loading :: Boolean
  , error :: Maybe String
  , theme :: Theme
  , input :: Maybe Input
  , subscribedToCurrentMatch :: Boolean
  , currentMatch :: Maybe CurrentMatchInfo
  , extraData :: Maybe String  -- Extra data from input
  }

-- | Component actions
data Action
  = Initialize
  | HandleTournamentData TournamentDataResponse
  | HandleAdminPanelUpdate AdminPanelUpdate
  | Finalize

-- | Initialize the base overlay state
initialState :: Input -> State
initialState input =
  { manager: Nothing
  , tournament: Nothing
  , divisionName: ""
  , loading: true
  , error: Nothing
  , theme: getTheme "scrabble"
  , input: Just input
  , subscribedToCurrentMatch: case input.tournamentId of
      Nothing -> true  -- No tournament in URL means subscribe to current match
      Just _ -> false  -- Tournament in URL means subscribe to specific tournament
  , currentMatch: Nothing
  , extraData: input.extraData
  }

-- | Handle base overlay actions
handleAction :: forall slots o m. MonadAff m => Action -> H.HalogenM State Action slots o m Unit
handleAction = case _ of
  Initialize -> do
    liftEffect $ Console.log "[BaseOverlay] Initialize called"

    state <- H.get
    case state.input of
      Nothing -> do
        liftEffect $ Console.log "[BaseOverlay] ERROR: No input found in state"
        H.modify_ _ { error = Just "No tournament parameters provided", loading = false }
      Just input -> do
        liftEffect $ Console.log $ "[BaseOverlay] Input: userId=" <> show input.userId <>
          ", tournamentId=" <> show input.tournamentId <>
          ", divisionName=" <> show input.divisionName

        -- Create broadcast manager
        liftEffect $ Console.log "[BaseOverlay] Creating broadcast manager"
        manager <- liftEffect BroadcastManager.create

        -- Subscribe to tournament data responses
        liftEffect $ Console.log "[BaseOverlay] Subscribing to tournament data responses"
        void $ H.subscribe $
          manager.tournamentDataResponseEmitter
            <#> HandleTournamentData

        -- Subscribe to admin panel updates
        liftEffect $ Console.log "[BaseOverlay] Subscribing to admin panel updates"
        void $ H.subscribe $
          manager.adminPanelUpdateEmitter
            <#> HandleAdminPanelUpdate

        -- Store manager in state
        H.modify_ _ { manager = Just manager }

        -- Build tournament selection
        let
          tournament = case input.tournamentId of
            Nothing -> Nothing
            Just tid -> Just
              { tournamentId: tid
              , division: case input.divisionName of
                  Nothing -> Nothing
                  Just name -> Just { divisionName: name }
              }

          subscribeMsg :: SubscribeMessage
          subscribeMsg =
            { userId: input.userId
            , tournament
            }

          logMsg = case tournament of
            Nothing -> "[BaseOverlay] Sending subscribe message for current match"
            Just t -> "[BaseOverlay] Sending subscribe message for tournament " <> show t.tournamentId

        liftEffect $ Console.log logMsg
        liftEffect $ BroadcastManager.postSubscribe manager subscribeMsg
        liftEffect $ Console.log "[BaseOverlay] Subscribe message sent"

  HandleTournamentData response -> do
    state <- H.get

    -- Check if this response is for us
    let shouldAccept = if state.subscribedToCurrentMatch
          then response.isCurrentMatch  -- Accept if marked as current match
          else case state.input of
            Nothing -> false
            Just input -> case input.tournamentId of
              Nothing -> false
              Just (TournamentId tid) ->
                let (TournamentId responseTid) = response.tournamentId
                in tid == responseTid  -- Accept if tournament IDs match

    if not shouldAccept then do
      liftEffect $ Console.log $ "[BaseOverlay] Ignoring tournament data response (isCurrentMatch=" <> show response.isCurrentMatch <> ", subscribedToCurrentMatch=" <> show state.subscribedToCurrentMatch <> ")"
    else do
      liftEffect $ Console.log "[BaseOverlay] Received tournament data response (full tournament)"
      liftEffect $ Console.log $ "[BaseOverlay] Tournament has " <> show (length response.data.divisions) <> " divisions"

      -- Extract the division we care about
      -- For current match mode, use divisionName from AdminPanelUpdate (stored in currentMatch)
      -- For specific tournament mode, use divisionName from URL input
      let divisionName = if state.subscribedToCurrentMatch
            then case state.currentMatch of
              Just cm -> Just cm.divisionName
              Nothing -> Nothing  -- Haven't received AdminPanelUpdate yet
            else case state.input of
              Just input -> input.divisionName
              Nothing -> Nothing

      liftEffect $ Console.log $ "[BaseOverlay] Looking for division: " <> show divisionName <> " (subscribedToCurrentMatch=" <> show state.subscribedToCurrentMatch <> ")"

      let division = case divisionName of
            Just name -> find (\d -> d.name == name) response.data.divisions
            Nothing -> Nothing  -- No division specified, can't proceed

      case division of
        Nothing -> do
          liftEffect $ Console.log $ "[BaseOverlay] ERROR: Could not find division " <> show divisionName
          H.modify_ _ { error = Just $ "Division not found: " <> show divisionName, loading = false }

        Just div -> do
          liftEffect $ Console.log $ "[BaseOverlay] Found division: " <> div.name
          liftEffect $ Console.log $ "[BaseOverlay] Players count: " <> show (length div.players)
          liftEffect $ Console.log $ "[BaseOverlay] Games count: " <> show (length div.games)

          -- Get theme from tournament data
          let themeName = response.data.theme
          let theme = getTheme themeName
          liftEffect $ Console.log $ "[BaseOverlay] Using theme: " <> themeName

          -- Create TournamentSummary from full Tournament
          let tournamentSummary :: TournamentSummary
              tournamentSummary =
                { id: response.data.id
                , name: response.data.name
                , city: response.data.city
                , year: response.data.year
                , lexicon: response.data.lexicon
                , longFormName: response.data.longFormName
                , dataUrl: response.data.dataUrl
                , pollUntil: Nothing  -- Not present in Tournament
                , theme: response.data.theme
                , transparentBackground: response.data.transparentBackground
                }

          -- Create DivisionScopedData
          let divisionScopedData :: DivisionScopedData
              divisionScopedData =
                { tournament: tournamentSummary
                , division: div
                }

          -- Update state with division data
          -- Overlays will calculate their own stats from div.players and div.games
          H.modify_ _
            { tournament = Just divisionScopedData
            , divisionName = div.name
            , theme = theme
            , loading = false
            , error = Nothing
            }

          liftEffect $ Console.log "[BaseOverlay] State updated with tournament data"

  HandleAdminPanelUpdate update -> do
    state <- H.get
    liftEffect $ Console.log $ "[BaseOverlay] HandleAdminPanelUpdate called! subscribedToCurrentMatch=" <> show state.subscribedToCurrentMatch
    liftEffect $ Console.log $ "[BaseOverlay] Update details: userId=" <> show update.userId <> ", tournamentId=" <> show update.tournamentId <> ", divisionName=" <> update.divisionName <> ", round=" <> show update.round <> ", pairingId=" <> show update.pairingId
    -- Only process if we're subscribed to current match
    if state.subscribedToCurrentMatch then do
      liftEffect $ Console.log $ "[BaseOverlay] Processing admin panel update: divisionName=" <> update.divisionName <> ", round=" <> show update.round <> ", pairingId=" <> show update.pairingId
      H.modify_ _ { currentMatch = Just { round: update.round, pairingId: update.pairingId, divisionName: update.divisionName } }
      liftEffect $ Console.log "[BaseOverlay] currentMatch updated in state with divisionName"
    else
      liftEffect $ Console.log "[BaseOverlay] Ignoring admin panel update (not subscribed to current match)"

  Finalize -> do
    state <- H.get
    case state.manager of
      Just manager -> BroadcastManager.close manager
      Nothing -> pure unit

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
renderWithData :: forall w i. State -> (DivisionScopedData -> HH.HTML w i) -> HH.HTML w i
renderWithData state renderContent =
  if state.loading then
    renderLoading
  else case state.tournament of
    Nothing -> renderError $ case state.error of
      Just err -> err
      Nothing -> "No tournament data"
    Just tournamentData -> renderContent tournamentData
