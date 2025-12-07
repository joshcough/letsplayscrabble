-- | Table Overlay Components
-- | All table overlay components and calculation functions consolidated in one module
module Component.Overlay.TableOverlay
  ( highScoresComponent
  , ratingGainComponent
  , scoringLeadersComponent
  , standingsComponent
  , calculateHighScoresTableData
  , calculateRatingGainTableData
  , calculateScoringLeadersTableData
  , calculateStandingsTableData
  , getRatingChangeColor
  , getSpreadColor
  ) where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import Data.Maybe (Maybe(..))
import Data.Number.Format (fixed, toStringWith)
import Data.String (take) as String
import Domain.Types (DivisionScopedData)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Renderer.TableRenderer (TableData)
import Renderer.TableRenderer as TableRenderer
import Stats.TableHelpers (buildTableData)
import Stats.TournamentStats (calculateHighScorePlayers, calculateRatingGainPlayers, calculateScoringLeadersPlayers, calculateStandingsPlayers)
import Utils.FormatUtils (formatNumberWithSign)

--------------------------------------------------------------------------------
-- Component Factory
--------------------------------------------------------------------------------

-- | Render function that takes a calculation function and produces the HTML
renderWithData
  :: forall m
   . (DivisionScopedData -> TableData)
  -> BaseOverlay.State Unit
  -> H.ComponentHTML BaseOverlay.Action () m
renderWithData calculator state =
  BaseOverlay.renderWithData state \tournamentData ->
    let
      tableData = calculator tournamentData
    in TableRenderer.renderTableOverlay state.theme tableData

-- | Component factory that creates a complete table overlay component
component
  :: forall query output m
   . MonadAff m
  => MonadBroadcast m
  => MonadEmitters m
  => (DivisionScopedData -> TableData)
  -> H.Component query (BaseOverlay.Input Unit) output m
component calculator = H.mkComponent
  { initialState: BaseOverlay.initialState
  , render: renderWithData calculator
  , eval: H.mkEval $ H.defaultEval
      { handleAction = BaseOverlay.handleAction
      , initialize = Just BaseOverlay.Initialize
      , finalize = Just BaseOverlay.Finalize
      }
  }

--------------------------------------------------------------------------------
-- High Scores Component
--------------------------------------------------------------------------------

highScoresComponent :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input Unit) output m
highScoresComponent = component calculateHighScoresTableData

calculateHighScoresTableData :: DivisionScopedData -> TableData
calculateHighScoresTableData =
  buildTableData
    "High Scores"
    [ { header: "Rank", align: TableRenderer.Center, renderer: TableRenderer.RankCell }
    , { header: "Name", align: TableRenderer.Left, renderer: TableRenderer.NameCell }
    , { header: "High Score", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
    ]
    (\player -> [show player.rank, player.name, show player.highScore])
    calculateHighScorePlayers

--------------------------------------------------------------------------------
-- Rating Gain Component
--------------------------------------------------------------------------------

ratingGainComponent :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input Unit) output m
ratingGainComponent = component calculateRatingGainTableData

calculateRatingGainTableData :: DivisionScopedData -> TableData
calculateRatingGainTableData =
  buildTableData
    "Rating Gain"
    [ { header: "Rank", align: TableRenderer.Center, renderer: TableRenderer.RankCell }
    , { header: "Name", align: TableRenderer.Left, renderer: TableRenderer.NameCell }
    , { header: "Rating +/-", align: TableRenderer.Center, renderer: TableRenderer.ColoredTextCell TableRenderer.Center getRatingChangeColor }
    , { header: "New Rating", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
    , { header: "Old Rating", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
    ]
    (\player ->
      [ show player.rank
      , player.name
      , formatNumberWithSign player.ratingDiff
      , show player.currentRating
      , show player.initialRating
      ]
    )
    calculateRatingGainPlayers

getRatingChangeColor :: String -> String
getRatingChangeColor value =
  case String.take 1 value of
    "+" -> "text-red-600"
    "-" -> "text-blue-600"
    _ -> "text-gray-800"

--------------------------------------------------------------------------------
-- Scoring Leaders Component
--------------------------------------------------------------------------------

scoringLeadersComponent :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input Unit) output m
scoringLeadersComponent = component calculateScoringLeadersTableData

calculateScoringLeadersTableData :: DivisionScopedData -> TableData
calculateScoringLeadersTableData =
  buildTableData
    "Scoring Leaders"
    [ { header: "Rank", align: TableRenderer.Center, renderer: TableRenderer.RankCell }
    , { header: "Name", align: TableRenderer.Left, renderer: TableRenderer.NameCell }
    , { header: "Avg Pts For", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
    , { header: "Avg Pts Against", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
    ]
    (\player ->
      [ show player.rank
      , player.name
      , toStringWith (fixed 1) player.averageScore
      , toStringWith (fixed 1) player.averageOpponentScore
      ]
    )
    calculateScoringLeadersPlayers

--------------------------------------------------------------------------------
-- Standings Component
--------------------------------------------------------------------------------

standingsComponent :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input Unit) output m
standingsComponent = component calculateStandingsTableData

calculateStandingsTableData :: DivisionScopedData -> TableData
calculateStandingsTableData =
  buildTableData
    "Standings"
    [ { header: "Rank", align: TableRenderer.Center, renderer: TableRenderer.RankCell }
    , { header: "Name", align: TableRenderer.Left, renderer: TableRenderer.NameCell }
    , { header: "Record", align: TableRenderer.Center, renderer: TableRenderer.TextCell TableRenderer.Center }
    , { header: "Spread", align: TableRenderer.Center, renderer: TableRenderer.ColoredTextCell TableRenderer.Center getSpreadColor }
    ]
    (\player ->
      [ show player.rank
      , player.name
      , show player.wins <> "-" <> show player.losses <> if player.ties > 0 then "-" <> show player.ties else ""
      , formatNumberWithSign player.spread
      ]
    )
    calculateStandingsPlayers

getSpreadColor :: String -> String
getSpreadColor value =
  case String.take 1 value of
    "+" -> "text-red-600"
    "-" -> "text-blue-600"
    _ -> "text-gray-800"
