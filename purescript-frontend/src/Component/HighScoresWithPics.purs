-- | High Scores With Pictures Overlay Component
-- | Displays top 5 high scores with player photos
module Component.HighScoresWithPics where

import Prelude

import Component.BaseOverlay as BaseOverlay
import Data.Array (take)
import Data.Maybe (Maybe(..), maybe)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Renderer.PictureRenderer as PictureRenderer
import Stats.PlayerStats (SortType(..), calculateRankedStats)
import Utils.PlayerImage (getPlayerImageUrl)

-- | HighScoresWithPics component
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
      -- Calculate high scores from raw division data
      players = calculateRankedStats HighScore tournamentData.division.players tournamentData.division.games
      top5 = take 5 players

      -- Build picture data
      pictureData =
        { title: "High Scores"
        , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> state.divisionName
        , players: top5 <#> \player ->
            { rank: player.rank
            , name: player.name
            , imageUrl: getPlayerImageUrl tournamentData.tournament.dataUrl player.photo player.xtPhotoUrl
            , stats:
                [ { value: show player.highScore
                  , color: state.theme.colors.textPrimary
                  , label: Nothing
                  }
                ]
            }
        }
    in
      PictureRenderer.renderPictureOverlay state.theme pictureData
