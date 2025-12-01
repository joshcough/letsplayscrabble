-- | ScoringLeaders Overlay Component
-- | Displays players sorted by average score
module Component.Overlay.ScoringLeaders where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array as Array
import Data.Maybe (Maybe(..), maybe)
import Data.Number.Format (fixed, toStringWith)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Renderer.TableRenderer as TableRenderer
import Stats.PlayerStats (SortType(..), calculateRankedStats)

-- | ScoringLeaders component
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
      topPlayers = Array.take 10 players

      -- Build table data
      tableData =
        { title: "Scoring Leaders"
        , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> state.divisionName
        , columns:
            [ { header: "Rank", align: TableRenderer.Center, renderer: TableRenderer.RankCell }
            , { header: "Name", align: TableRenderer.Left, renderer: TableRenderer.NameCell }
            , { header: "Avg Pts For", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
            , { header: "Avg Pts Against", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
            ]
        , rows: topPlayers <#> \player ->
            [ show player.rank
            , player.name
            , toStringWith (fixed 1) player.averageScore
            , toStringWith (fixed 1) player.averageOpponentScore
            ]
        }
    in
      TableRenderer.renderTableOverlay state.theme tableData
