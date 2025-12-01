-- | Rating Gain Overlay Component
-- | Displays players sorted by rating gain during tournament
module Component.Overlay.RatingGain where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array as Array
import Data.Maybe (Maybe(..), maybe)
import Data.String (take) as String
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Renderer.TableRenderer as TableRenderer
import Stats.PlayerStats (SortType(..), calculateRankedStats)
import Utils.FormatUtils (formatNumberWithSign)

-- | RatingGain component
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
      -- Calculate rating gain from raw division data
      players = calculateRankedStats RatingGain tournamentData.division.players tournamentData.division.games
      topPlayers = Array.take 10 players

      -- Build table data
      tableData =
        { title: "Rating Gain"
        , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> state.divisionName
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
      TableRenderer.renderTableOverlay state.theme tableData

-- | Get color for rating change value based on sign
-- | Positive rating change = red (gain), negative = blue (loss)
getRatingChangeColor :: String -> String
getRatingChangeColor value =
  case String.take 1 value of
    "+" -> "text-red-600"
    "-" -> "text-blue-600"
    _ -> "text-gray-800"  -- For 0 or unknown
