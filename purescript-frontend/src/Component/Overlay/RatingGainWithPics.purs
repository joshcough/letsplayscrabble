-- | Rating Gain With Pictures Overlay Component
-- | Displays top 5 rating gainers with player photos
module Component.Overlay.RatingGainWithPics where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array (take)
import Data.Newtype (unwrap)
import Stats.TournamentStats (calculateRatingGainPlayers)
import Data.Maybe (Maybe(..))
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Renderer.PictureRenderer as PictureRenderer
import Types.Theme (Theme)
import Utils.Format (formatNumberWithSign)
import Utils.PlayerImage (getPlayerImageUrl)

-- | RatingGainWithPics component
component :: forall query output m. MonadAff m => H.Component query (BaseOverlay.Input Unit) output m
component = H.mkComponent
  { initialState: BaseOverlay.initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = BaseOverlay.handleAction
      , initialize = Just BaseOverlay.Initialize
      , finalize = Just BaseOverlay.Finalize
      }
  }

render :: forall m. BaseOverlay.State Unit -> H.ComponentHTML BaseOverlay.Action () m
render state =
  BaseOverlay.renderWithData state \tournamentData ->
    let
      s = unwrap state
      -- Calculate rating gain from raw division data (shared with RatingGain)
      players = calculateRatingGainPlayers tournamentData.division.players tournamentData.division.games
      top5 = take 5 players

      -- Build picture data
      pictureData =
        { title: "Rating Gain"
        , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • " <> tournamentData.division.name
        , players: top5 <#> \player ->
            { rank: player.rank
            , name: player.name
            , imageUrl: getPlayerImageUrl tournamentData.tournament.dataUrl player.photo player.xtPhotoUrl
            , stats:
                [ { value: formatNumberWithSign player.ratingDiff
                  , color: getRatingGainColor s.theme player.ratingDiff
                  , label: Nothing
                  }
                , { value: show player.currentRating
                  , color: s.theme.colors.textPrimary
                  , label: Just "New Rating"
                  }
                ]
            }
        }
    in
      PictureRenderer.renderPictureOverlay s.theme pictureData

getRatingGainColor :: Theme -> Int -> String
getRatingGainColor theme ratingChange
  | ratingChange > 0 = "text-red-600"
  | ratingChange < 0 = "text-blue-600"
  | otherwise = theme.colors.textPrimary
