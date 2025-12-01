-- | High Scores Overlay Component
-- | Displays top individual game scores
module Component.HighScores where

import Prelude

import Component.BaseOverlay as BaseOverlay
import Data.Array as Array
import Data.Maybe (Maybe(..), maybe)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Renderer.TableRenderer as TableRenderer
import Stats.PlayerStats (SortType(..), calculateRankedStats)

-- | HighScores component
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
      -- Calculate high scores from raw division data
      players = calculateRankedStats HighScore tournamentData.division.players tournamentData.division.games
      topPlayers = Array.take 10 players

      -- Build table data
      tableData =
        { title: "High Scores"
        , subtitle: tournamentData.tournament.name <> " " <> tournamentData.tournament.lexicon <> " • Division " <> state.divisionName
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
      TableRenderer.renderTableOverlay state.theme tableData
