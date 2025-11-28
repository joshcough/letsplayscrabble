-- | Standings Overlay Component
-- | Displays tournament standings sorted by wins/losses/spread
module Component.Standings where

import Prelude

import BroadcastChannel.Manager as BroadcastManager
import BroadcastChannel.Messages (TournamentDataResponse, SubscribeMessage)
import Data.Array (length)
import Data.Maybe (Maybe(..))
import Effect.Console as Console
import Domain.Types (DivisionScopedData, TournamentId(..), DivisionId(..))
import Effect.Aff.Class (class MonadAff)
import Effect.Class (class MonadEffect, liftEffect)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.PlayerStats (RankedPlayerStats, SortType(..), calculateRankedStats)
import Types.Theme (Theme, defaultTheme)
import Utils.FormatUtils (formatNumberWithSign)

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
  }

-- | Component actions
data Action
  = Initialize
  | HandleTournamentData TournamentDataResponse
  | Finalize

-- | Component input
type Input =
  { userId :: Int
  , tournamentId :: TournamentId
  , divisionId :: Maybe DivisionId
  , divisionName :: Maybe String
  }

-- | Component definition
component :: forall q o m. MonadAff m => H.Component q Input o m
component =
  H.mkComponent
    { initialState
    , render
    , eval: H.mkEval $ H.defaultEval
        { handleAction = handleAction
        , initialize = Just Initialize
        , finalize = Just Finalize
        }
    }

-- | Initial state
initialState :: Input -> State
initialState input =
  { manager: Nothing
  , tournament: Nothing
  , players: []
  , divisionName: ""
  , loading: true
  , error: Nothing
  , theme: defaultTheme
  , input: Just input
  }

-- | Render function
render :: forall m. State -> H.ComponentHTML Action () m
render state =
  HH.div
    [ HP.class_ (HH.ClassName "standings-overlay") ]
    [ if state.loading then
        renderLoading
      else case state.error of
        Just err -> renderError err
        Nothing -> renderStandings state
    ]

-- | Render loading state
renderLoading :: forall w i. HH.HTML w i
renderLoading =
  HH.div
    [ HP.class_ (HH.ClassName "flex items-center justify-center h-screen") ]
    [ HH.text "Loading standings..." ]

-- | Render error state
renderError :: forall w i. String -> HH.HTML w i
renderError err =
  HH.div
    [ HP.class_ (HH.ClassName "flex items-center justify-center h-screen text-red-600") ]
    [ HH.text $ "Error: " <> err ]

-- | Render standings table
renderStandings :: forall w. State -> HH.HTML w Action
renderStandings state =
  HH.div
    [ HP.class_ (HH.ClassName "container mx-auto p-4") ]
    [ HH.h1
        [ HP.class_ (HH.ClassName "text-4xl font-bold mb-4") ]
        [ HH.text $ "Standings - " <> state.divisionName ]
    , HH.table
        [ HP.class_ (HH.ClassName "w-full border-collapse") ]
        [ renderTableHeader
        , HH.tbody_ $ map (renderPlayerRow state.theme) state.players
        ]
    ]

-- | Render table header
renderTableHeader :: forall w i. HH.HTML w i
renderTableHeader =
  HH.thead_
    [ HH.tr_
        [ HH.th
            [ HP.class_ (HH.ClassName "border p-2 text-left") ]
            [ HH.text "Rank" ]
        , HH.th
            [ HP.class_ (HH.ClassName "border p-2 text-left") ]
            [ HH.text "Name" ]
        , HH.th
            [ HP.class_ (HH.ClassName "border p-2 text-left") ]
            [ HH.text "Record" ]
        , HH.th
            [ HP.class_ (HH.ClassName "border p-2 text-left") ]
            [ HH.text "Spread" ]
        ]
    ]

-- | Render player row
renderPlayerRow :: forall w i. Theme -> RankedPlayerStats -> HH.HTML w i
renderPlayerRow theme player =
  HH.tr_
    [ HH.td
        [ HP.class_ (HH.ClassName "border p-2") ]
        [ HH.span
            [ HP.class_ (HH.ClassName "text-2xl font-black") ]
            [ HH.text $ "#" <> show player.rank ]
        ]
    , HH.td
        [ HP.class_ (HH.ClassName "border p-2") ]
        [ HH.text player.name ]
    , HH.td
        [ HP.class_ (HH.ClassName "border p-2") ]
        [ HH.span
            [ HP.class_ (HH.ClassName "font-mono font-black text-2xl") ]
            [ HH.text $ formatRecord player ]
        ]
    , HH.td
        [ HP.class_ (HH.ClassName "border p-2") ]
        [ HH.span
            [ HP.class_ (HH.ClassName $ "font-black text-2xl " <> getSpreadColor theme player.spread) ]
            [ HH.text $ formatNumberWithSign player.spread ]
        ]
    ]

-- | Format win-loss record
formatRecord :: RankedPlayerStats -> String
formatRecord player =
  if player.ties == 0 then
    show player.wins <> "-" <> show player.losses
  else
    show player.wins <> "-" <> show player.losses <> "-" <> show player.ties

-- | Get color class for spread
getSpreadColor :: Theme -> Int -> String
getSpreadColor theme spread
  | spread > 0 = "text-red-600"
  | spread < 0 = "text-blue-600"
  | otherwise = theme.colors.textPrimary

-- | Handle actions
handleAction :: forall o m. MonadAff m => Action -> H.HalogenM State Action () o m Unit
handleAction = case _ of
  Initialize -> do
    liftEffect $ Console.log "[Standings] Initialize called"

    -- Get input from state
    state <- H.get
    case state.input of
      Nothing -> do
        liftEffect $ Console.log "[Standings] ERROR: No input found in state"
        H.modify_ _ { error = Just "No tournament parameters provided", loading = false }
      Just input -> do
        liftEffect $ Console.log $ "[Standings] Input: userId=" <> show input.userId <>
          ", tournamentId=" <> show input.tournamentId <>
          ", divisionId=" <> show input.divisionId

        -- Create broadcast manager
        liftEffect $ Console.log "[Standings] Creating broadcast manager"
        manager <- liftEffect BroadcastManager.create

        -- Subscribe to tournament data responses
        liftEffect $ Console.log "[Standings] Subscribing to tournament data responses"
        void $ H.subscribe $
          manager.tournamentDataResponseEmitter
            <#> HandleTournamentData

        -- Store manager in state
        H.modify_ _ { manager = Just manager }

        -- Send subscribe message to request tournament data
        let
          TournamentId tournamentIdInt = input.tournamentId
          subscribeMsg :: SubscribeMessage
          subscribeMsg =
            { userId: input.userId
            , tournamentId: input.tournamentId
            , divisionId: input.divisionId
            , divisionName: input.divisionName
            }

        liftEffect $ Console.log $ "[Standings] Sending subscribe message for tournament " <> show tournamentIdInt
        liftEffect $ BroadcastManager.postSubscribe manager subscribeMsg
        liftEffect $ Console.log "[Standings] Subscribe message sent"

  HandleTournamentData response -> do
    liftEffect $ Console.log "[Standings] Received tournament data response"
    liftEffect $ Console.log $ "[Standings] Division: " <> response.data.division.name
    liftEffect $ Console.log $ "[Standings] Players count: " <> show (length response.data.division.players)
    liftEffect $ Console.log $ "[Standings] Games count: " <> show (length response.data.division.games)

    -- Calculate player stats
    let
      players = calculateRankedStats
        Standings
        response.data.division.players
        response.data.division.games

    liftEffect $ Console.log $ "[Standings] Calculated " <> show (length players) <> " ranked players"

    -- Update state with new data
    H.modify_ _
      { tournament = Just response.data
      , players = players
      , divisionName = response.data.division.name
      , loading = false
      , error = Nothing
      }

    liftEffect $ Console.log "[Standings] State updated with tournament data"

  Finalize -> do
    -- Close broadcast channel when component unmounts
    state <- H.get
    case state.manager of
      Just manager -> BroadcastManager.close manager
      Nothing -> pure unit
