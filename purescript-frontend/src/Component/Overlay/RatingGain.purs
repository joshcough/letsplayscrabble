-- | Rating Gain Overlay Component
-- | Displays players sorted by rating gain during tournament
module Component.Overlay.RatingGain where

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
import Stats.TournamentStats (calculateRatingGainPlayers)
import Utils.FormatUtils (formatNumberWithSign)

-- | RatingGain component
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
    let tableData = calculateRatingGainTableData tournamentData state.divisionName
    in TableRenderer.renderTableOverlay state.theme tableData

--------------------------------------------------------------------------------
-- Pure Functions (extracted for testing)
--------------------------------------------------------------------------------

-- | Pure function to calculate rating gain table data
-- | This is extracted for testing
calculateRatingGainTableData :: DivisionScopedData -> String -> TableData
calculateRatingGainTableData tournamentData divisionName =
  let
    -- Calculate rating gain from raw division data
    players = calculateRatingGainPlayers tournamentData.division.players tournamentData.division.games
    topPlayers = Array.take 10 players

    -- Build table data
    tableData =
      { title: "Rating Gain"
      , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> divisionName
      , columns:
          [ { header: "Rank", align: TableRenderer.Center, renderer: TableRenderer.RankCell }
          , { header: "Name", align: TableRenderer.Left, renderer: TableRenderer.NameCell }
          , { header: "Rating +/-", align: TableRenderer.Center, renderer: TableRenderer.ColoredTextCell TableRenderer.Center getRatingChangeColor }
          , { header: "New Rating", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
          , { header: "Old Rating", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
          ]
      , rows: topPlayers <#> \player ->
          [ show player.rank
          , player.name
          , formatNumberWithSign player.ratingDiff
          , show player.currentRating
          , show player.initialRating
          ]
      }
  in
    tableData

-- | Get color for rating change value based on sign
-- | Positive rating change = red (gain), negative = blue (loss)
getRatingChangeColor :: String -> String
getRatingChangeColor value =
  case String.take 1 value of
    "+" -> "text-red-600"
    "-" -> "text-blue-600"
    _ -> "text-gray-800"  -- For 0 or unknown
