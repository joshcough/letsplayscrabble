-- | Tournament Statistics Overlay Component
-- | Displays tournament-wide statistics across all divisions or for a specific division
module Component.Overlay.TournamentStats where

import Prelude

import BroadcastChannel.Class (postSubscribe, subscribeTournamentData, subscribeAdminPanel, closeBroadcast)
import BroadcastChannel.Messages (TournamentDataResponse, AdminPanelUpdate)
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import CSS.Class as C
import CSS.ThemeColor as TC
import Config.Themes (getTheme)
import Control.Alt ((<|>))
import Data.Array as Array
import Data.Maybe (Maybe(..), maybe)
import Data.Newtype (class Newtype, over, unwrap)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Utils.Logger (log)
import Halogen as H
import Halogen.HTML as HH
import Stats.OverlayLogic as OverlayLogic
import Stats.TournamentStats (TournamentStats, calculateAllTournamentStats, calculateTournamentStats)
import Types.Theme (Theme)
import Utils.CSS (css, cls, thm, raw)
import Utils.Format (formatWithCommas, formatPercent)

-- | Component input
type Input =
  { userId :: Int
  , subscription :: TournamentSubscription
  }

type TournamentSubscription = OverlayLogic.TournamentSubscription

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
component :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query Input output m
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
  , subscribedToCurrentMatch: case input.subscription of
      OverlayLogic.CurrentMatch -> true
      _ -> false
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
    [ css [cls C.Flex, cls C.ItemsCenter, cls C.JustifyCenter, cls C.HScreen] ]
    [ HH.text "Loading..." ]

renderError :: forall w i. String -> HH.HTML w i
renderError err =
  HH.div
    [ css [cls C.Flex, cls C.ItemsCenter, cls C.JustifyCenter, cls C.HScreen, cls C.TextRed600] ]
    [ HH.text $ "Error: " <> err ]

renderStats :: forall m. State -> TournamentStats -> H.ComponentHTML Action () m
renderStats state stats =
  let
    s = unwrap state
    theme = s.theme
    titleGradient = raw $ theme.titleExtraClasses <> " bg-gradient-to-r " <> theme.colors.titleGradient
  in
    HH.div
      [ css [thm theme TC.PageBackground, cls C.MinHScreen, cls C.Flex, cls C.ItemsCenter, cls C.JustifyCenter, cls C.P_6] ]
      [ HH.div
          [ css [cls C.MaxW_7xl, cls C.W_Full] ]
          [ -- Title section
            HH.div
              [ css [cls C.TextCenter, cls C.Mb_16] ]
              [ HH.h1
                  [ css [cls C.Text_6xl, cls C.FontBlack, cls C.Mb_4, titleGradient] ]
                  [ HH.text "Tournament Statistics" ]
              , HH.div
                  [ css [cls C.Text_3xl, thm theme TC.TextSecondary] ]
                  [ HH.text s.title ]
              ]
          , -- Stats grid
            HH.div
              [ css [cls C.Flex, cls C.JustifyCenter, cls C.Gap_6, cls C.FlexWrap, cls C.Mt_8] ]
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
  HH.div
    [ css [thm theme TC.CardBackground, cls C.Rounded_2xl, cls C.P_6, cls C.Border, thm theme TC.PrimaryBorder, cls C.ShadowXl, raw "min-w-[180px]"] ]
    [ HH.div
        [ css [cls C.Flex, cls C.FlexCol, cls C.ItemsCenter] ]
        [ HH.div
            [ css [cls C.Text_3xl, cls C.Mb_2] ]
            [ HH.text icon ]
        , HH.div
            [ css [thm theme TC.TextAccent, cls C.Text_Lg, cls C.FontBold, cls C.Uppercase, cls C.TrackingWider, cls C.Mb_3] ]
            [ HH.text label ]
        , HH.div
            [ css [cls C.Text_5xl, cls C.FontBlack, thm theme TC.TextPrimary] ]
            [ HH.text value ]
        ]
    ]

--------------------------------------------------------------------------------
-- Helper functions for handleAction
--------------------------------------------------------------------------------

-- | Determine which division to use based on subscription mode
resolveDivisionName :: State -> Maybe String
resolveDivisionName state =
  let s = unwrap state
  in if s.subscribedToCurrentMatch
    then s.currentMatchDivisionName  -- Use division from AdminPanelUpdate
    else case s.input.subscription of
      OverlayLogic.SpecificTournament { divisionName: name } -> Just name
      _ -> Nothing

-- | Calculate stats for the resolved division or all divisions
calculateStatsForDivision :: TournamentDataResponse -> Maybe String -> Maybe TournamentStats
calculateStatsForDivision response divisionName =
  (divisionName >>= \divName ->
      Array.find (\d -> d.name == divName) response.data.divisions
        <#> \div -> calculateTournamentStats div.games div.players
    ) <|> Just (calculateAllTournamentStats response.data)

-- | Build title based on tournament name and division
buildTitleForStats :: String -> Maybe String -> String
buildTitleForStats tournamentName divisionName =
  maybe
    (tournamentName <> " - Total Tournament Stats")
    (\divName -> tournamentName <> " Div " <> divName <> " - Total Tournament Stats")
    divisionName

-- | Update state when stats calculation succeeds
updateStateWithStats :: forall output m. TournamentStats -> String -> String -> Theme -> H.HalogenM State Action () output m Unit
updateStateWithStats statsResult tournamentName title theme =
  H.modify_ $ over State _
    { stats = Just statsResult
    , tournamentName = tournamentName
    , title = title
    , theme = theme
    , loading = false
    , error = Nothing
    }

-- | Update state when stats calculation fails
updateStateWithError :: forall output m. MonadAff m => H.HalogenM State Action () output m Unit
updateStateWithError = do
  liftEffect $ log "[TournamentStats] ERROR: Could not calculate stats"
  H.modify_ $ over State _ { error = Just "Could not calculate tournament stats", loading = false }

--------------------------------------------------------------------------------
-- Handle component actions
--------------------------------------------------------------------------------
handleAction :: forall output m. MonadAff m => MonadBroadcast m => MonadEmitters m => Action -> H.HalogenM State Action () output m Unit
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
    postSubscribe $ OverlayLogic.buildSubscribeMessage input.userId input.subscription

  HandleTournamentData response -> do
    state <- H.get

    let
      divisionName = resolveDivisionName state
      stats = calculateStatsForDivision response divisionName
      title = buildTitleForStats response.data.name divisionName
      theme = getTheme response.data.theme

    maybe
      updateStateWithError
      (\statsResult -> updateStateWithStats statsResult response.data.name title theme)
      stats

  HandleAdminPanelUpdate update -> do
    state <- H.get
    let s = unwrap state
    when s.subscribedToCurrentMatch do
      H.modify_ $ over State _ { currentMatchDivisionName = Just update.divisionName }

  Finalize ->
    closeBroadcast
