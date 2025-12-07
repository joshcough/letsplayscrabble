-- | Tournament Statistics Overlay Component
-- | Displays tournament-wide statistics across all divisions or for a specific division
module Component.Overlay.TournamentStats where

import Prelude

import BroadcastChannel.Class (postSubscribe, subscribeTournamentData, subscribeAdminPanel, closeBroadcast)
import BroadcastChannel.Manager as BroadcastManager
import BroadcastChannel.Messages (TournamentDataResponse, AdminPanelUpdate)
import Config.Themes (getTheme)
import Data.Array (length)
import Data.Array as Array
import Data.Maybe (Maybe(..), isNothing, maybe)
import Data.Newtype (class Newtype, over, unwrap)
import Control.Alt ((<|>))
import Data.String.CodePoints as String
import Domain.Types (TournamentId)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Effect.Console as Console
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.TournamentStats (TournamentStats, calculateAllTournamentStats, calculateTournamentStats)
import Types.Theme (Theme)
import Data.Int (round, toNumber)
import Data.Number.Format (fixed, toStringWith)

-- | Component input
type Input =
  { userId :: Int
  , tournamentId :: Maybe TournamentId
  , divisionName :: Maybe String
  , manager :: BroadcastManager.BroadcastManager
  }

-- | Component state
newtype State = State
  { input :: Input
  , stats :: Maybe TournamentStats
  , tournamentName :: String
  , title :: String
  , loading :: Boolean
  , error :: Maybe String
  , theme :: Theme
  , subscribedToCurrentMatch :: Boolean
  , currentMatchDivisionName :: Maybe String
  }

-- Derive Newtype instance for easier field access
derive instance newtypeStateTournamentStats :: Newtype State _

-- | Component actions
data Action
  = Initialize
  | HandleTournamentData TournamentDataResponse
  | HandleAdminPanelUpdate AdminPanelUpdate
  | Finalize

-- | TournamentStats component
component :: forall query output m. MonadAff m => H.Component query Input output m
component = H.mkComponent
  { initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = handleAction
      , initialize = Just Initialize
      , finalize = Just Finalize
      }
  }

initialState :: Input -> State
initialState input = State
  { input: input
  , stats: Nothing
  , tournamentName: ""
  , title: ""
  , loading: true
  , error: Nothing
  , theme: getTheme "scrabble"
  , subscribedToCurrentMatch: isNothing input.tournamentId  -- No tournament in URL means current match mode
  , currentMatchDivisionName: Nothing
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  let s = unwrap state
  in if s.loading then
    renderLoading
  else case s.error of
    Just err -> renderError err
    Nothing -> case s.stats of
      Just stats -> renderStats state stats
      Nothing -> renderError "No tournament data"

renderLoading :: forall w i. HH.HTML w i
renderLoading =
  HH.div
    [ HP.class_ (HH.ClassName "flex items-center justify-center h-screen") ]
    [ HH.text "Loading..." ]

renderError :: forall w i. String -> HH.HTML w i
renderError err =
  HH.div
    [ HP.class_ (HH.ClassName "flex items-center justify-center h-screen text-red-600") ]
    [ HH.text $ "Error: " <> err ]

renderStats :: forall m. State -> TournamentStats -> H.ComponentHTML Action () m
renderStats state stats =
  let
    s = unwrap state
    theme = s.theme
    titleGradient = theme.titleExtraClasses <> " bg-gradient-to-r " <> theme.colors.titleGradient
  in
    HH.div
      [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
      [ HH.div
          [ HP.class_ (HH.ClassName "max-w-7xl w-full") ]
          [ -- Title section
            HH.div
              [ HP.class_ (HH.ClassName "text-center mb-16") ]
              [ HH.h1
                  [ HP.class_ (HH.ClassName $ "text-6xl font-black mb-4 " <> titleGradient) ]
                  [ HH.text "Tournament Statistics" ]
              , HH.div
                  [ HP.class_ (HH.ClassName $ "text-3xl " <> theme.colors.textSecondary) ]
                  [ HH.text s.title ]
              ]
          , -- Stats grid
            HH.div
              [ HP.class_ (HH.ClassName "flex justify-center gap-6 flex-wrap mt-8") ]
              [ renderStatItem theme "Games Played" (show stats.gamesPlayed) "🎮" "from-green-400 to-blue-500"
              , renderStatItem theme "Points Scored" (formatWithCommas stats.pointsScored) "💯" "from-yellow-400 to-orange-500"
              , renderStatItem theme "Average Score" stats.averageScore "📊" "from-purple-400 to-pink-500"
              , renderStatItem theme "Higher Rated Win%" (formatPercent stats.higherRatedWinPercent) "🏆" "from-blue-400 to-cyan-500"
              , renderStatItem theme "Going First Win%" (formatPercent stats.goingFirstWinPercent) "🥇" "from-red-400 to-pink-500"
              ]
          ]
      ]

renderStatItem :: forall w i. Theme -> String -> String -> String -> String -> HH.HTML w i
renderStatItem theme label value icon _colorGradient =
  let
    -- Use solid textPrimary color for better visibility
    -- The TypeScript gradients don't work well on dark card backgrounds
    valueClass = theme.colors.textPrimary
  in
    HH.div
      [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " rounded-2xl p-6 border " <> theme.colors.primaryBorder <> " shadow-xl min-w-[180px]") ]
      [ HH.div
          [ HP.class_ (HH.ClassName "flex flex-col items-center") ]
          [ HH.div
              [ HP.class_ (HH.ClassName "text-3xl mb-2") ]
              [ HH.text icon ]
          , HH.div
              [ HP.class_ (HH.ClassName $ theme.colors.textAccent <> " text-lg font-bold uppercase tracking-wider mb-3") ]
              [ HH.text label ]
          , HH.div
              [ HP.class_ (HH.ClassName $ "text-5xl font-black " <> valueClass) ]
              [ HH.text value ]
          ]
      ]

-- | Format number with commas
formatWithCommas :: Int -> String
formatWithCommas n =
  let
    str = show n
    len = length (String.toCodePointArray str)
    go :: Int -> String -> String
    go idx acc =
      if idx <= 0 then acc
      else
        let
          digitIdx = len - idx
          digit = String.take 1 (String.drop digitIdx str)
          needsComma = idx `mod` 3 == 0 && idx < len
        in
          go (idx - 1) (acc <> digit <> if needsComma then "," else "")
  in
    go len ""

-- | Format percentage to 1 decimal place
formatPercent :: Number -> String
formatPercent n =
  let
    rounded = toNumber (round (n * 10.0)) / 10.0
  in
    toStringWith (fixed 1) rounded <> "%"

-- | Handle component actions
handleAction :: forall output m. MonadAff m => Action -> H.HalogenM State Action () output m Unit
handleAction = case _ of
  Initialize -> do
    state <- H.get
    let input = (unwrap state).input

    -- Subscribe to tournament data responses
    tournamentDataEmitter <- subscribeTournamentData
    void $ H.subscribe $ tournamentDataEmitter <#> HandleTournamentData

    -- Subscribe to admin panel updates (for current match division name)
    adminPanelEmitter <- subscribeAdminPanel
    void $ H.subscribe $ adminPanelEmitter <#> HandleAdminPanelUpdate

    -- Build and post subscribe message
    let
      tournament = input.tournamentId <#> \tid ->
        { tournamentId: tid
        , division: input.divisionName <#> \name -> { divisionName: name }
        }

      subscribeMsg =
        { userId: input.userId
        , tournament
        }

    postSubscribe subscribeMsg

  HandleTournamentData response -> do
    state <- H.get
    let s = unwrap state

    -- Determine which division(s) to use:
    -- 1. Current match mode: use division from AdminPanelUpdate
    -- 2. Specific tournament + divisionName: use that division
    -- 3. Specific tournament, no divisionName: use all divisions
    let
      divisionName = if s.subscribedToCurrentMatch
        then s.currentMatchDivisionName  -- Use division from AdminPanelUpdate
        else s.input.divisionName  -- Use division from URL

      stats = (divisionName >>= \divName ->
          Array.find (\d -> d.name == divName) response.data.divisions
            <#> \div -> calculateTournamentStats div.games div.players
        ) <|> Just (calculateAllTournamentStats response.data)

      title = maybe
        (response.data.name <> " - Total Tournament Stats")
        (\divName -> response.data.name <> " Div " <> divName <> " - Total Tournament Stats")
        divisionName

      theme = getTheme response.data.theme

    maybe
      (do
        liftEffect $ Console.log "[TournamentStats] ERROR: Could not calculate stats"
        H.modify_ $ over State _ { error = Just "Could not calculate tournament stats", loading = false }
      )
      (\statsResult -> do
        H.modify_ $ over State _
          { stats = Just statsResult
          , tournamentName = response.data.name
          , title = title
          , theme = theme
          , loading = false
          , error = Nothing
          }
      )
      stats

  HandleAdminPanelUpdate update -> do
    state <- H.get
    let s = unwrap state
    when s.subscribedToCurrentMatch do
      H.modify_ $ over State _ { currentMatchDivisionName = Just update.divisionName }

  Finalize ->
    closeBroadcast
