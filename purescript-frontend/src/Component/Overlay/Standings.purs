-- | Standings Overlay Component
-- | Displays tournament standings sorted by wins/losses/spread
module Component.Overlay.Standings where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array as Array
import Data.Maybe (Maybe(..))
import Data.String (take) as String
import Domain.Types (DivisionScopedData, Game, Player)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Renderer.TableRenderer (TableData)
import Renderer.TableRenderer as TableRenderer
import Stats.TournamentStats (calculateStandingsPlayers)
import Utils.FormatUtils (formatNumberWithSign)

-- | Standings component
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
    let tableData = calculateStandingsTableData tournamentData state.divisionName
    in TableRenderer.renderTableOverlay state.theme tableData

--------------------------------------------------------------------------------
-- Pure Functions (extracted for testing)
--------------------------------------------------------------------------------

-- | Pure function to calculate standings table data
-- | This is extracted for testing
calculateStandingsTableData :: DivisionScopedData -> String -> TableData
calculateStandingsTableData tournamentData divisionName =
  let
    -- Calculate standings from raw division data
    players = calculateStandingsPlayers tournamentData.division.players tournamentData.division.games
    topPlayers = Array.take 10 players

    -- Build table data
    tableData =
      { title: "Standings"
      , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> divisionName
      , columns:
          [ { header: "Rank", align: TableRenderer.Center, renderer: TableRenderer.RankCell }
          , { header: "Name", align: TableRenderer.Left, renderer: TableRenderer.NameCell }
          , { header: "Record", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
          , { header: "Spread", align: TableRenderer.Center, renderer: TableRenderer.ColoredTextCell TableRenderer.Center getSpreadColor }
          ]
      , rows: topPlayers <#> \player ->
          [ show player.rank
          , player.name
          , show player.wins <> "-" <> show player.losses <> if player.ties > 0 then "-" <> show player.ties else ""
          , formatNumberWithSign player.spread
          ]
      }
  in
    tableData

-- | Get color for spread value based on sign
-- | Positive spread = red (winning), negative = blue (losing)
getSpreadColor :: String -> String
getSpreadColor value =
  case String.take 1 value of
    "+" -> "text-red-600"
    "-" -> "text-blue-600"
    _ -> "text-gray-800"  -- For 0 or unknown
