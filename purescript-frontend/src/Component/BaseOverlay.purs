-- | Base overlay component
-- | Handles broadcast channel subscription and tournament data fetching
-- | All overlay components should use this as their base
module Component.BaseOverlay where

import Prelude

import BroadcastChannel.Manager as BroadcastManager
import BroadcastChannel.Messages (TournamentDataResponse, SubscribeMessage)
import Config.Themes (getTheme)
import Data.Array (length)
import Data.Maybe (Maybe(..))
import Domain.Types (DivisionScopedData, TournamentId(..), DivisionId)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Effect.Console as Console
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.PlayerStats (RankedPlayerStats, SortType, calculateRankedStats)
import Types.Theme (Theme)

-- | Component input
type Input =
  { userId :: Int
  , tournamentId :: Maybe TournamentId
  , divisionName :: Maybe String
  }

-- | Component state
type State =
  { manager :: Maybe BroadcastManager.BroadcastManager
  , tournament :: Maybe DivisionScopedData
  , players :: Array RankedPlayerStats
  , divisionName :: String
  , loading :: Boolean
  , error :: Maybe String
  , theme :: Theme
  , input :: Maybe Input
  , sortType :: SortType
  , subscribedToCurrentMatch :: Boolean
  }

-- | Component actions
data Action
  = Initialize
  | HandleTournamentData TournamentDataResponse
  | Finalize

-- | Initialize the base overlay state
initialState :: SortType -> Input -> State
initialState sortType input =
  { manager: Nothing
  , tournament: Nothing
  , players: []
  , divisionName: ""
  , loading: true
  , error: Nothing
  , theme: getTheme "scrabble"
  , input: Just input
  , sortType
  , subscribedToCurrentMatch: case input.tournamentId of
      Nothing -> true  -- No tournament in URL means subscribe to current match
      Just _ -> false  -- Tournament in URL means subscribe to specific tournament
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
      liftEffect $ Console.log "[BaseOverlay] Received tournament data response"
      liftEffect $ Console.log $ "[BaseOverlay] Division: " <> response.data.division.name
      liftEffect $ Console.log $ "[BaseOverlay] Players count: " <> show (length response.data.division.players)
      liftEffect $ Console.log $ "[BaseOverlay] Games count: " <> show (length response.data.division.games)

      -- Get theme from tournament data
      let themeName = response.data.tournament.theme
      let theme = getTheme themeName
      liftEffect $ Console.log $ "[BaseOverlay] Using theme: " <> themeName

      -- Calculate player stats with the component's sort type
      let
        players = calculateRankedStats
          state.sortType
          response.data.division.players
          response.data.division.games

      liftEffect $ Console.log $ "[BaseOverlay] Calculated " <> show (length players) <> " ranked players"

      -- Update state
      H.modify_ _
        { tournament = Just response.data
        , players = players
        , divisionName = response.data.division.name
        , theme = theme
        , loading = false
        , error = Nothing
        }

      liftEffect $ Console.log "[BaseOverlay] State updated with tournament data"

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
