-- | Scoring Leaders With Pictures Overlay Component
-- | Displays top 5 scoring leaders with player photos
module Component.Overlay.ScoringLeadersWithPics where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array (take)
import Data.Maybe (Maybe(..), maybe)
import Data.Number.Format (fixed, toStringWith)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Renderer.PictureRenderer as PictureRenderer
import Stats.PlayerStats (SortType(..), calculateRankedStats)
import Utils.PlayerImage (getPlayerImageUrl)

-- | ScoringLeadersWithPics component
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
      -- Calculate scoring leaders from raw division data
      players = calculateRankedStats AverageScore tournamentData.division.players tournamentData.division.games
      top5 = take 5 players

      -- Build picture data
      pictureData =
        { title: "Scoring Leaders"
        , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> state.divisionName
        , players: top5 <#> \player ->
            { rank: player.rank
            , name: player.name
            , imageUrl: getPlayerImageUrl tournamentData.tournament.dataUrl player.photo player.xtPhotoUrl
            , stats:
                [ { value: toStringWith (fixed 1) player.averageScore
                  , color: state.theme.colors.textPrimary
                  , label: Just "Avg Points For"
                  }
                ]
            }
        }
    in
      PictureRenderer.renderPictureOverlay state.theme pictureData
