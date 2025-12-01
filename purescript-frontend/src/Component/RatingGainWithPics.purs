-- | Rating Gain With Pictures Overlay Component
-- | Displays top 5 rating gainers with player photos
module Component.RatingGainWithPics where

import Prelude

import Component.BaseOverlay as BaseOverlay
import Data.Array (take)
import Data.Maybe (Maybe(..), maybe)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Renderer.PictureRenderer as PictureRenderer
import Stats.PlayerStats (SortType(..), calculateRankedStats)
import Types.Theme (Theme)
import Utils.Format (formatNumberWithSign)
import Utils.PlayerImage (getPlayerImageUrl)

-- | RatingGainWithPics component
component :: forall query output m. MonadAff m => H.Component query BaseOverlay.Input output m
component = H.mkComponent
  { initialState: BaseOverlay.initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = BaseOverlay.handleAction
      , initialize = Just BaseOverlay.Initialize
      , finalize = Just BaseOverlay.Finalize
      }
  }

render :: forall m. BaseOverlay.State -> H.ComponentHTML BaseOverlay.Action () m
render state =
  BaseOverlay.renderWithData state \tournamentData ->
    let
      -- Calculate rating gain from raw division data
      players = calculateRankedStats RatingGain tournamentData.division.players tournamentData.division.games
      top5 = take 5 players

      -- Build picture data
      pictureData =
        { title: "Rating Gain"
        , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> state.divisionName
        , players: top5 <#> \player ->
            { rank: player.rank
            , name: player.name
            , imageUrl: getPlayerImageUrl tournamentData.tournament.dataUrl player.photo player.xtPhotoUrl
            , stats:
                [ { value: formatNumberWithSign player.ratingDiff
                  , color: getRatingGainColor state.theme player.ratingDiff
                  , label: Nothing
                  }
                , { value: show player.currentRating
                  , color: state.theme.colors.textPrimary
                  , label: Just "New Rating"
                  }
                ]
            }
        }
    in
      PictureRenderer.renderPictureOverlay state.theme pictureData

getRatingGainColor :: Theme -> Int -> String
getRatingGainColor theme ratingChange
  | ratingChange > 0 = "text-red-600"
  | ratingChange < 0 = "text-blue-600"
  | otherwise = theme.colors.textPrimary
