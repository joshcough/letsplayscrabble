-- | Standings Overlay Component
-- | Displays tournament standings sorted by wins/losses/spread
module Component.Standings where

import Prelude

import Component.BaseOverlay as BaseOverlay
import Data.Array as Array
import Data.Maybe (Maybe(..), maybe)
import Data.String (take) as String
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Renderer.TableRenderer as TableRenderer
import Stats.PlayerStats (SortType(..), calculateRankedStats)
import Utils.FormatUtils (formatNumberWithSign)

-- | Standings component
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
      -- Calculate standings from raw division data
      players = calculateRankedStats Standings tournamentData.division.players tournamentData.division.games
      topPlayers = Array.take 10 players

      -- Build table data
      tableData =
        { title: "Standings"
        , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> state.divisionName
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
      TableRenderer.renderTableOverlay state.theme tableData

-- | Get color for spread value based on sign
-- | Positive spread = red (winning), negative = blue (losing)
getSpreadColor :: String -> String
getSpreadColor value =
  case String.take 1 value of
    "+" -> "text-red-600"
    "-" -> "text-blue-600"
    _ -> "text-gray-800"  -- For 0 or unknown
