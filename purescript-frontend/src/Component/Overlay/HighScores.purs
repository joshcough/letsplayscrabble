-- | High Scores Overlay Component
-- | Displays top individual game scores
module Component.Overlay.HighScores where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array as Array
import Data.Maybe (Maybe(..))
import Domain.Types (DivisionScopedData, Game, Player)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Renderer.TableRenderer (TableData)
import Renderer.TableRenderer as TableRenderer
import Stats.TournamentStats (calculateHighScorePlayers)

-- | HighScores component
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
    let tableData = calculateHighScoresTableData tournamentData state.divisionName
    in TableRenderer.renderTableOverlay state.theme tableData

--------------------------------------------------------------------------------
-- Pure Functions (extracted for testing)
--------------------------------------------------------------------------------

-- | Pure function to calculate high scores table data
-- | This is extracted for testing
calculateHighScoresTableData :: DivisionScopedData -> String -> TableData
calculateHighScoresTableData tournamentData divisionName =
  let
    -- Calculate high scores from raw division data
    players = calculateHighScorePlayers tournamentData.division.players tournamentData.division.games
    topPlayers = Array.take 10 players

    -- Build table data
    tableData =
      { title: "High Scores"
      , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> divisionName
      , columns:
          [ { header: "Rank", align: TableRenderer.Center, renderer: TableRenderer.RankCell }
          , { header: "Name", align: TableRenderer.Left, renderer: TableRenderer.NameCell }
          , { header: "High Score", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
          ]
      , rows: topPlayers <#> \player ->
          [ show player.rank
          , player.name
          , show player.highScore
          ]
      }
  in
    tableData
