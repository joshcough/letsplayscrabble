-- | High Scores With Pictures Overlay Component
-- | Displays top 5 high scores with player photos
module Component.Overlay.HighScoresWithPics where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import Data.Array (take)
import Data.Newtype (unwrap)
import Stats.TournamentStats (calculateHighScorePlayers)
import Data.Maybe (Maybe(..))
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Renderer.PictureRenderer as PictureRenderer
import Utils.PlayerImage (getPlayerImageUrl)

-- | HighScoresWithPics component
component :: forall query output m. MonadAff m => MonadBroadcast m => H.Component query (BaseOverlay.Input Unit) output m
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
      -- Calculate high scores from raw division data (shared with HighScores)
      players = calculateHighScorePlayers tournamentData.division.players tournamentData.division.games
      top5 = take 5 players

      -- Build picture data
      pictureData =
        { title: "High Scores"
        , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • " <> tournamentData.division.name
        , players: top5 <#> \player ->
            { rank: player.rank
            , name: player.name
            , imageUrl: getPlayerImageUrl tournamentData.tournament.dataUrl player.photo player.xtPhotoUrl
            , stats:
                [ { value: show player.highScore
                  , color: s.theme.colors.textPrimary
                  , label: Nothing
                  }
                ]
            }
        }
    in
      PictureRenderer.renderPictureOverlay s.theme pictureData
