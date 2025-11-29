-- | Standings Overlay Component
-- | Displays tournament standings sorted by wins/losses/spread
module Component.Standings where

import Prelude

import BroadcastChannel.Manager as BroadcastManager
import BroadcastChannel.Messages (TournamentDataResponse, SubscribeMessage)
import Config.Themes (getTheme)
import Data.Array (length)
import Data.Array as Array
import Data.Maybe (Maybe(..))
import Effect.Console as Console
import Effect.Unsafe (unsafePerformEffect)
import Domain.Types (DivisionScopedData, TournamentId(..), DivisionId)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.PlayerStats (RankedPlayerStats, SortType(..), calculateRankedStats)
import Types.Theme (Theme)
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
  , theme: getTheme "scrabble" -- Default to scrabble, will be updated when data arrives
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
renderStandings state = do
  let _ = unsafePerformEffect $ Console.log "[Standings] renderStandings called - WITH NEW STYLING!"
  let theme = state.theme
  case state.tournament of
    Nothing -> HH.text "No tournament data"
    Just tournamentData ->
      HH.div
        [ HP.class_ (HH.ClassName "min-h-screen bg-white") ]
        [ HH.div
            [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
            [ HH.div
            [ HP.class_ (HH.ClassName "max-w-7xl w-full") ]
            [ -- Header
              HH.div
                [ HP.class_ (HH.ClassName "text-center mb-8") ]
                [ HH.h1
                    [ HP.class_ (HH.ClassName $ "text-6xl font-black leading-tight mb-4 " <> theme.colors.textPrimary) ]
                    [ HH.text "Standings" ]
                , HH.div
                    [ HP.class_ (HH.ClassName $ "text-3xl font-bold " <> theme.colors.textSecondary) ]
                    [ HH.text $ tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> state.divisionName ]
                ]
            , -- Card container
              HH.div
                [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " rounded-2xl px-6 py-3 border-2 " <> theme.colors.primaryBorder <> " shadow-2xl " <> theme.colors.shadowColor) ]
                [ HH.div
                    [ HP.class_ (HH.ClassName "overflow-x-auto") ]
                    [ HH.table
                        [ HP.class_ (HH.ClassName "w-full") ]
                        [ renderTableHeader theme
                        , HH.tbody_ $ renderTopPlayers theme state.players
                        ]
                    ]
                ]
            ]
        ]
        ]

-- | Render table header
renderTableHeader :: forall w i. Theme -> HH.HTML w i
renderTableHeader theme =
  HH.thead_
    [ HH.tr
        [ HP.class_ (HH.ClassName $ "border-b-2 " <> theme.colors.primaryBorder) ]
        [ HH.th
            [ HP.class_ (HH.ClassName $ "px-4 py-1 text-xl font-black uppercase tracking-wider " <> theme.colors.textPrimary <> " text-center")
            , HP.style "min-width: 100px"
            ]
            [ HH.text "Rank" ]
        , HH.th
            [ HP.class_ (HH.ClassName $ "px-4 py-1 text-xl font-black uppercase tracking-wider " <> theme.colors.textPrimary <> " text-left")
            , HP.style "min-width: 200px"
            ]
            [ HH.text "Name" ]
        , HH.th
            [ HP.class_ (HH.ClassName $ "px-4 py-1 text-xl font-black uppercase tracking-wider " <> theme.colors.textPrimary <> " text-center")
            , HP.style "min-width: 100px"
            ]
            [ HH.text "Record" ]
        , HH.th
            [ HP.class_ (HH.ClassName $ "px-4 py-1 text-xl font-black uppercase tracking-wider " <> theme.colors.textPrimary <> " text-center")
            , HP.style "min-width: 100px"
            ]
            [ HH.text "Spread" ]
        ]
    ]

-- | Render player row with index for medals
renderPlayerRow :: forall w i. Theme -> Int -> RankedPlayerStats -> HH.HTML w i
renderPlayerRow theme index player =
  HH.tr
    [ HP.class_ (HH.ClassName $ "border-b last:border-0 transition-colors " <> theme.colors.secondaryBorder <> " " <> theme.colors.hoverBackground) ]
    [ HH.td
        [ HP.class_ (HH.ClassName $ "px-4 py-1 text-xl font-bold " <> theme.colors.textPrimary <> " text-center") ]
        [ HH.span
            [ HP.class_ (HH.ClassName "text-2xl font-black") ]
            [ HH.text $ "#" <> show player.rank ]
        ]
    , HH.td
        [ HP.class_ (HH.ClassName $ "px-4 py-1 text-xl font-bold " <> theme.colors.textPrimary <> " text-left") ]
        [ HH.div
            [ HP.class_ (HH.ClassName "flex items-center gap-2") ]
            [ if index < 3 then
                HH.span
                  [ HP.class_ (HH.ClassName "text-lg") ]
                  [ HH.text $ getMedalEmoji index ]
              else
                HH.text ""
            , HH.text player.name
            ]
        ]
    , HH.td
        [ HP.class_ (HH.ClassName $ "px-4 py-1 text-xl font-bold " <> theme.colors.textPrimary <> " text-center") ]
        [ HH.span
            [ HP.class_ (HH.ClassName "font-mono font-black text-2xl") ]
            [ HH.text $ formatRecord player ]
        ]
    , HH.td
        [ HP.class_ (HH.ClassName $ "px-4 py-1 text-xl font-bold " <> theme.colors.textPrimary <> " text-center") ]
        [ HH.span
            [ HP.class_ (HH.ClassName $ "font-black text-2xl " <> getSpreadColor theme player.spread) ]
            [ HH.text $ formatNumberWithSign player.spread ]
        ]
    ]

-- | Render top 10 players
renderTopPlayers :: forall w i. Theme -> Array RankedPlayerStats -> Array (HH.HTML w i)
renderTopPlayers theme players =
  Array.take 10 players
    # Array.mapWithIndex (\index player -> renderPlayerRow theme index player)

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
  | spread > 0 = theme.colors.positiveColor
  | spread < 0 = theme.colors.negativeColor
  | otherwise = theme.colors.neutralColor

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

    -- Get theme from tournament data
    let themeName = response.data.tournament.theme
    let theme = getTheme themeName
    liftEffect $ Console.log $ "[Standings] Using theme: " <> themeName

    -- Calculate player stats
    let
      players = calculateRankedStats
        Standings
        response.data.division.players
        response.data.division.games

    liftEffect $ Console.log $ "[Standings] Calculated " <> show (length players) <> " ranked players"

    -- Update state with new data and theme
    H.modify_ _
      { tournament = Just response.data
      , players = players
      , divisionName = response.data.division.name
      , theme = theme
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

-- | Get medal emoji for top 3 positions
getMedalEmoji :: Int -> String
getMedalEmoji index = case index of
  0 -> "🥇"
  1 -> "🥈"
  2 -> "🥉"
  _ -> ""
