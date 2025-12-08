-- | Picture Overlay Components
-- | All picture overlay components consolidated in one module
module Component.Overlay.PictureOverlay
  ( highScoresComponent
  , ratingGainComponent
  , scoringLeadersComponent
  , standingsComponent
  ) where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import Data.Maybe (Maybe(..))
import Data.Number.Format (fixed, toStringWith)
import Domain.Types (Game, Player)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Stats.TableHelpers (renderPictureOverlayWithStats)
import Stats.TournamentStats (calculateHighScorePlayers, calculateRatingGainPlayers, calculateScoringLeadersPlayers, calculateStandingsPlayers)
import Types.Theme (Theme)
import Utils.Color (getSignedNumberColor)
import Utils.Format (formatNumberWithSign)

--------------------------------------------------------------------------------
-- Component Factory
--------------------------------------------------------------------------------

-- | Render function for picture overlays
renderWithData
  :: forall r m
   . String
  -> (Array Player -> Array Game -> Array { rank :: Int, name :: String, photo :: Maybe String, xtPhotoUrl :: Maybe String | r })
  -> (Theme -> { rank :: Int, name :: String, photo :: Maybe String, xtPhotoUrl :: Maybe String | r } -> Array { value :: String, color :: String, label :: Maybe String })
  -> BaseOverlay.State Unit
  -> H.ComponentHTML BaseOverlay.Action () m
renderWithData title calculator statsRenderer state =
  BaseOverlay.renderWithData state $
    renderPictureOverlayWithStats title calculator statsRenderer state

-- | Component factory that creates a complete picture overlay component
component
  :: forall query output r m
   . MonadAff m
  => MonadBroadcast m
  => MonadEmitters m
  => String
  -> (Array Player -> Array Game -> Array { rank :: Int, name :: String, photo :: Maybe String, xtPhotoUrl :: Maybe String | r })
  -> (Theme -> { rank :: Int, name :: String, photo :: Maybe String, xtPhotoUrl :: Maybe String | r } -> Array { value :: String, color :: String, label :: Maybe String })
  -> H.Component query (BaseOverlay.Input Unit) output m
component title calculator statsRenderer =
  BaseOverlay.mkComponent (renderWithData title calculator statsRenderer)

--------------------------------------------------------------------------------
-- High Scores Component
--------------------------------------------------------------------------------

highScoresComponent :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input Unit) output m
highScoresComponent = component
  "High Scores"
  calculateHighScorePlayers
  \theme player ->
    [ { value: show player.highScore
      , color: theme.colors.textPrimary
      , label: Nothing
      }
    ]

--------------------------------------------------------------------------------
-- Rating Gain Component
--------------------------------------------------------------------------------

ratingGainComponent :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input Unit) output m
ratingGainComponent = component
  "Rating Gain"
  calculateRatingGainPlayers
  \theme player ->
    [ { value: formatNumberWithSign player.ratingDiff
      , color: getSignedNumberColor theme player.ratingDiff
      , label: Nothing
      }
    , { value: show player.currentRating
      , color: theme.colors.textPrimary
      , label: Just "New Rating"
      }
    ]

--------------------------------------------------------------------------------
-- Scoring Leaders Component
--------------------------------------------------------------------------------

scoringLeadersComponent :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input Unit) output m
scoringLeadersComponent = component
  "Scoring Leaders"
  calculateScoringLeadersPlayers
  \theme player ->
    [ { value: toStringWith (fixed 1) player.averageScore
      , color: theme.colors.textPrimary
      , label: Just "Avg Points For"
      }
    ]

--------------------------------------------------------------------------------
-- Standings Component
--------------------------------------------------------------------------------

standingsComponent :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input Unit) output m
standingsComponent = component
  "Standings"
  calculateStandingsPlayers
  \theme player ->
    [ { value: show player.wins <> "-" <> show player.losses <> if player.ties > 0 then "-" <> show player.ties else ""
      , color: theme.colors.textPrimary
      , label: Nothing
      }
    , { value: formatNumberWithSign player.spread
      , color: getSignedNumberColor theme player.spread
      , label: Nothing
      }
    ]
