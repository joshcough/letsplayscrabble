-- | Standings With Pictures Overlay Component
-- | Displays top 5 standings with player photos
module Component.Overlay.StandingsWithPics where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array (take)
import Stats.TournamentStats (calculateStandingsPlayers)
import Data.Maybe (Maybe(..))
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Renderer.PictureRenderer as PictureRenderer
import Types.Theme (Theme)
import Utils.Format (formatNumberWithSign)
import Utils.PlayerImage (getPlayerImageUrl)

-- | StandingsWithPics component
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
      -- Calculate standings from raw division data (shared with Standings)
      players = calculateStandingsPlayers tournamentData.division.players tournamentData.division.games
      top5 = take 5 players

      -- Build picture data
      pictureData =
        { title: "Standings"
        , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> state.divisionName
        , players: top5 <#> \player ->
            { rank: player.rank
            , name: player.name
            , imageUrl: getPlayerImageUrl tournamentData.tournament.dataUrl player.photo player.xtPhotoUrl
            , stats:
                [ { value: show player.wins <> "-" <> show player.losses <> if player.ties > 0 then "-" <> show player.ties else ""
                  , color: state.theme.colors.textPrimary
                  , label: Nothing
                  }
                , { value: formatNumberWithSign player.spread
                  , color: getSpreadColor state.theme player.spread
                  , label: Nothing
                  }
                ]
            }
        }
    in
      PictureRenderer.renderPictureOverlay state.theme pictureData

getSpreadColor :: Theme -> Int -> String
getSpreadColor theme spread
  | spread > 0 = "text-red-600"
  | spread < 0 = "text-blue-600"
  | otherwise = theme.colors.textPrimary
