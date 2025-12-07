-- | Common helpers for building table and picture overlays
module Stats.TableHelpers where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array as Array
import Data.Maybe (Maybe)
import Domain.Types (DivisionScopedData, Game, Player)
import Halogen as H
import Renderer.PictureRenderer as PictureRenderer
import Renderer.TableRenderer (TableData)
import Renderer.TableRenderer as TableRenderer
import Types.Theme (Theme)
import Utils.PlayerImage (getPlayerImageUrl)

-- | Build standard division subtitle: "Tournament TWL • Division A"
buildDivisionSubtitle :: DivisionScopedData -> String
buildDivisionSubtitle tournamentData =
  tournamentData.tournament.name <> " "
    <> tournamentData.tournament.lexicon <> " • "
    <> tournamentData.division.name

-- | Calculate top N players using a given calculation function
-- | Example: calculateTopPlayers 10 calculateRatingGainPlayers tournamentData
calculateTopPlayers
  :: forall a
   . Int
  -> (Array Player -> Array Game -> Array a)
  -> DivisionScopedData
  -> Array a
calculateTopPlayers n calculator tournamentData =
  Array.take n $ calculator tournamentData.division.players tournamentData.division.games

-- | Render a picture overlay with top 5 players using a stats calculation function
-- | This eliminates boilerplate from picture overlay components
-- | The stats type must have rank, name, photo, and xtPhotoUrl fields
renderPictureOverlayWithStats
  :: forall r m
   . String  -- title
  -> (Array Player -> Array Game -> Array { rank :: Int, name :: String, photo :: Maybe String, xtPhotoUrl :: Maybe String | r })  -- calculator
  -> (Theme -> { rank :: Int, name :: String, photo :: Maybe String, xtPhotoUrl :: Maybe String | r } -> Array { value :: String, color :: String, label :: Maybe String })  -- statsRenderer
  -> BaseOverlay.State Unit
  -> DivisionScopedData
  -> H.ComponentHTML BaseOverlay.Action () m
renderPictureOverlayWithStats title calculator statsRenderer state tournamentData =
  let
    top5 = calculateTopPlayers 5 calculator tournamentData
    pictureData =
      { title: title
      , subtitle: buildDivisionSubtitle tournamentData
      , players: top5 <#> \player ->
          { rank: player.rank
          , name: player.name
          , imageUrl: getPlayerImageUrl tournamentData.tournament.dataUrl player.photo player.xtPhotoUrl
          , stats: statsRenderer state.theme player
          }
      }
  in
    PictureRenderer.renderPictureOverlay state.theme pictureData

-- | Build table data with top 10 players using a stats calculation function
-- | This eliminates boilerplate from table overlay components
-- | The stats type must have rank and name fields
buildTableData
  :: forall r
   . String  -- title
  -> Array { header :: String, align :: TableRenderer.Alignment, renderer :: TableRenderer.CellRenderer }  -- columns
  -> ({ rank :: Int, name :: String | r } -> Array String)  -- row mapper
  -> (Array Player -> Array Game -> Array { rank :: Int, name :: String | r })  -- calculator
  -> DivisionScopedData
  -> TableData
buildTableData title columns rowMapper calculator tournamentData =
  let
    topPlayers = calculateTopPlayers 10 calculator tournamentData
  in
    { title: title
    , subtitle: buildDivisionSubtitle tournamentData
    , columns: columns
    , rows: topPlayers <#> rowMapper
    }
