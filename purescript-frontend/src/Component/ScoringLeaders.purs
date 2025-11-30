-- | ScoringLeaders Overlay Component
-- | Displays tournament leaders sorted by average score
module Component.ScoringLeaders where

import Prelude

import Component.BaseOverlay as BaseOverlay
import Data.Array as Array
import Data.Maybe (Maybe(..))
import Data.Number.Format (fixed, toStringWith)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.PlayerStats (RankedPlayerStats, SortType(..))

-- | Component input (same as BaseOverlay)
type Input = BaseOverlay.Input

-- | Component state (same as BaseOverlay)
type State = BaseOverlay.State

-- | Component actions (same as BaseOverlay)
type Action = BaseOverlay.Action

-- | ScoringLeaders component
component :: forall query output m. MonadAff m => H.Component query Input output m
component = H.mkComponent
  { initialState: BaseOverlay.initialState AverageScore  -- Use AverageScore sort type
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = BaseOverlay.handleAction
      , initialize = Just BaseOverlay.Initialize
      , finalize = Just BaseOverlay.Finalize
      }
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  if state.loading then
    BaseOverlay.renderLoading
  else case state.error of
    Just err -> BaseOverlay.renderError err
    Nothing -> case state.tournament of
      Just tournament -> renderScoringLeaders state
      Nothing -> BaseOverlay.renderError "No tournament data"

renderScoringLeaders :: forall m. State -> H.ComponentHTML Action () m
renderScoringLeaders state =
  case state.tournament of
    Nothing -> BaseOverlay.renderError "No tournament data"
    Just tournamentData ->
      let
        theme = state.theme
        tournament = tournamentData.tournament
        topPlayers = Array.take 10 state.players
      in
        HH.div
          [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
          [ HH.div
              [ HP.class_ (HH.ClassName "max-w-7xl w-full") ]
              [ -- Title section
                HH.div
                  [ HP.class_ (HH.ClassName "text-center mb-8") ]
                  [ HH.h1
                      [ HP.class_ (HH.ClassName $ "text-6xl font-black leading-tight mb-4 " <> theme.colors.textPrimary) ]
                      [ HH.text "Scoring Leaders" ]
                  , HH.div
                      [ HP.class_ (HH.ClassName $ "text-3xl font-bold " <> theme.colors.textSecondary) ]
                      [ HH.text $ tournament.name <> " " <> tournament.lexicon <> " • Division " <> state.divisionName ]
                  ]
              , -- Players table
                HH.div
                  [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " rounded-2xl px-6 py-3 border-2 " <> theme.colors.primaryBorder <> " shadow-2xl " <> theme.colors.shadowColor) ]
                  [ HH.div
                      [ HP.class_ (HH.ClassName "overflow-x-auto") ]
                      [ HH.table
                          [ HP.class_ (HH.ClassName "w-full") ]
                          [ HH.thead_
                              [ HH.tr
                                  [ HP.class_ (HH.ClassName $ "border-b-2 " <> theme.colors.primaryBorder) ]
                                  [ HH.th [ HP.class_ (HH.ClassName $ "px-4 py-1 text-center " <> theme.colors.textPrimary <> " text-xl font-black uppercase tracking-wider") ] [ HH.text "Rank" ]
                                  , HH.th [ HP.class_ (HH.ClassName $ "px-4 py-1 text-left " <> theme.colors.textPrimary <> " text-xl font-black uppercase tracking-wider") ] [ HH.text "Name" ]
                                  , HH.th [ HP.class_ (HH.ClassName $ "px-4 py-1 text-center " <> theme.colors.textPrimary <> " text-xl font-black uppercase tracking-wider") ] [ HH.text "Avg Pts For" ]
                                  , HH.th [ HP.class_ (HH.ClassName $ "px-4 py-1 text-center " <> theme.colors.textPrimary <> " text-xl font-black uppercase tracking-wider") ] [ HH.text "Avg Pts Ag" ]
                                  ]
                              ]
                          , HH.tbody_
                              (Array.mapWithIndex (renderPlayerRow theme) topPlayers)
                          ]
                      ]
                  ]
              ]
          ]

renderPlayerRow :: forall w. _ -> Int -> RankedPlayerStats -> HH.HTML w Action
renderPlayerRow theme index player =
  let
    medal = case index of
      0 -> Just "🥇"
      1 -> Just "🥈"
      2 -> Just "🥉"
      _ -> Nothing

    avgScoreText = toStringWith (fixed 1) player.averageScore
    avgOppScoreText = toStringWith (fixed 1) player.averageOpponentScore
  in
    HH.tr
      [ HP.class_ (HH.ClassName $ "border-b last:border-0 transition-colors " <> theme.colors.secondaryBorder <> " " <> theme.colors.hoverBackground) ]
      [ HH.td
          [ HP.class_ (HH.ClassName $ "px-4 py-1 text-center " <> theme.colors.textPrimary <> " text-xl font-bold") ]
          [ HH.span
              [ HP.class_ (HH.ClassName "text-2xl font-black") ]
              [ HH.text $ "#" <> show player.rank ]
          ]
      , HH.td
          [ HP.class_ (HH.ClassName $ "px-4 py-1 text-left " <> theme.colors.textPrimary <> " text-xl font-bold") ]
          [ HH.div
              [ HP.class_ (HH.ClassName "flex items-center gap-2") ]
              [ case medal of
                  Just m -> HH.span [ HP.class_ (HH.ClassName "text-lg") ] [ HH.text m ]
                  Nothing -> HH.text ""
              , HH.text player.name
              ]
          ]
      , HH.td
          [ HP.class_ (HH.ClassName $ "px-4 py-1 text-center " <> theme.colors.textPrimary <> " text-xl font-bold") ]
          [ HH.span
              [ HP.class_ (HH.ClassName "font-mono font-black text-2xl") ]
              [ HH.text avgScoreText ]
          ]
      , HH.td
          [ HP.class_ (HH.ClassName $ "px-4 py-1 text-center " <> theme.colors.textPrimary <> " text-xl font-bold") ]
          [ HH.span
              [ HP.class_ (HH.ClassName "font-mono font-black text-xl") ]
              [ HH.text avgOppScoreText ]
          ]
      ]
