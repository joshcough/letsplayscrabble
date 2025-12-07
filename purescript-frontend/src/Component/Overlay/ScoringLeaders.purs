-- | ScoringLeaders Overlay Component
-- | Displays players sorted by average score
module Component.Overlay.ScoringLeaders where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array as Array
import Data.Maybe (Maybe(..))
import Data.Number.Format (fixed, toStringWith)
import Domain.Types (DivisionScopedData, Game, Player)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Renderer.TableRenderer (TableData)
import Renderer.TableRenderer as TableRenderer
import Stats.TournamentStats (calculateScoringLeadersPlayers)

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
    let tableData = calculateScoringLeadersTableData tournamentData state.divisionName
    in TableRenderer.renderTableOverlay state.theme tableData

--------------------------------------------------------------------------------
-- Pure Functions (extracted for testing)
--------------------------------------------------------------------------------

-- | Pure function to calculate scoring leaders table data
-- | This is extracted for testing
calculateScoringLeadersTableData :: DivisionScopedData -> String -> TableData
calculateScoringLeadersTableData tournamentData divisionName =
  let
    -- Calculate scoring leaders from raw division data
    players = calculateScoringLeadersPlayers tournamentData.division.players tournamentData.division.games
    topPlayers = Array.take 10 players

    -- Build table data
    tableData =
      { title: "Scoring Leaders"
      , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> divisionName
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
    tableData
