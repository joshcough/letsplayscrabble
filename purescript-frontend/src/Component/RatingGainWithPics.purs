-- | Rating Gain with player pictures overlay
module Component.RatingGainWithPics where

import Prelude

import Component.BaseOverlay as BaseOverlay
import Data.Array (take, mapWithIndex)
import Data.Maybe (Maybe(..))
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.PlayerStats (RankedPlayerStats, SortType(..))
import Utils.Format (formatPlayerName)
import Utils.PlayerImage (getPlayerImageUrl)

-- | Component input (same as BaseOverlay)
type Input = BaseOverlay.Input

-- | Component state (same as BaseOverlay)
type State = BaseOverlay.State

-- | Component actions (same as BaseOverlay)
type Action = BaseOverlay.Action

-- | Rating Gain with pics component
component :: forall query output m. MonadAff m => H.Component query Input output m
component = H.mkComponent
  { initialState: BaseOverlay.initialState RatingGain  -- Use RatingGain sort type
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
      Just tournament -> renderRatingGainWithPics state
      Nothing -> BaseOverlay.renderError "No tournament data"

renderRatingGainWithPics :: forall m. State -> H.ComponentHTML Action () m
renderRatingGainWithPics state =
  case state.tournament of
    Nothing -> BaseOverlay.renderError "No tournament data"
    Just tournamentData ->
      let
        theme = state.theme
        top5 = take 5 state.players
        tournament = tournamentData.tournament
      in
        HH.div
          [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
          [ HH.div
              [ HP.class_ (HH.ClassName "max-w-7xl w-full") ]
              [ -- Title section
                HH.div
                  [ HP.class_ (HH.ClassName "text-center mb-8") ]
                  [ HH.h1
                      [ HP.class_ (HH.ClassName $ "text-6xl font-black leading-tight mb-4 " <>
                          if theme.name == "original"
                            then theme.colors.titleGradient
                            else "text-transparent bg-clip-text " <> theme.colors.titleGradient)
                      ]
                      [ HH.text "Rating Gain" ]
                  , HH.div
                      [ HP.class_ (HH.ClassName $ "text-3xl font-bold " <> theme.colors.textSecondary) ]
                      [ HH.text $ tournament.name <> " " <> tournament.lexicon <> " • Division " <> state.divisionName ]
                  ]
              , -- Players grid
                HH.div
                  [ HP.class_ (HH.ClassName "flex justify-center items-start gap-6 px-4") ]
                  (mapWithIndex (renderPlayer theme tournament.dataUrl) top5)
              ]
          ]

renderPlayer :: forall w. _ -> String -> Int -> RankedPlayerStats -> HH.HTML w Action
renderPlayer theme dataUrl index player =
  let
    ratingGainText = if player.ratingDiff >= 0
      then "+" <> show player.ratingDiff
      else show player.ratingDiff

    ratingGainColor = getRatingGainColor theme player.ratingDiff
  in
    HH.div
      [ HP.class_ (HH.ClassName "flex flex-col items-center") ]
      [ -- Rank badge and player image
        HH.div
          [ HP.class_ (HH.ClassName "relative mb-4") ]
          [ HH.div
              [ HP.class_ (HH.ClassName "absolute -top-2 -left-2 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-300") ]
              [ HH.span
                  [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " font-black text-lg") ]
                  [ HH.text $ "#" <> show (index + 1) ]
              ]
          , -- Player image
            HH.div
              [ HP.class_ (HH.ClassName $ "w-36 h-36 rounded-2xl overflow-hidden border-2 " <> theme.colors.primaryBorder <> " " <> theme.colors.cardBackground <> " shadow-xl") ]
              [ HH.img
                  [ HP.src $ getPlayerImageUrl dataUrl player.photo player.xtPhotoUrl
                  , HP.alt player.name
                  , HP.class_ (HH.ClassName "w-full h-full object-cover")
                  ]
              ]
          ]
      , -- Player name
        HH.div
          [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-3xl font-black text-center mb-4 max-w-48 min-h-[4rem] flex items-center justify-center") ]
          [ HH.text $ formatPlayerName player.name ]
      , -- Rating stats (gain and new rating)
        HH.div
          [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " rounded-xl px-6 py-4 border " <> theme.colors.secondaryBorder <> " min-h-[6rem] flex flex-col justify-center") ]
          [ HH.div
              [ HP.class_ (HH.ClassName $ "text-6xl font-black text-center mb-2 " <> ratingGainColor) ]
              [ HH.text ratingGainText ]
          , HH.div
              [ HP.class_ (HH.ClassName $ theme.colors.textSecondary <> " text-lg font-bold text-center uppercase tracking-wider mb-1") ]
              [ HH.text "New Rating" ]
          , HH.div
              [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-3xl font-black text-center") ]
              [ HH.text $ show player.currentRating ]
          ]
      ]

getRatingGainColor :: _ -> Int -> String
getRatingGainColor theme ratingDiff
  | ratingDiff > 0 = "text-red-600"
  | ratingDiff < 0 = "text-blue-600"
  | otherwise = theme.colors.textPrimary
