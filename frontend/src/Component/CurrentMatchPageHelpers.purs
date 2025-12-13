-- | Pure helper functions for CurrentMatchPage
-- | Extracted for testability
module Component.CurrentMatchPageHelpers
  ( getRoundsForDivision
  , getPairingsForRound
  , getPlayerName
  ) where

import Prelude

import Data.Array (filter, sort)
import Data.Array as Array
import Data.Maybe (Maybe)
import Data.Set as Set
import Domain.Types (DivisionId(..), Game, PlayerId(..), Tournament, Division)

-- | Get all unique round numbers from a division's games
getRoundsForDivision :: Tournament -> Int -> Maybe (Array Int)
getRoundsForDivision tournament divId = do
  division <- Array.find (\d -> let DivisionId did = d.id in did == divId) tournament.divisions
  let roundNumbers = map _.roundNumber division.games
  pure $ sort $ Array.fromFoldable $ Set.fromFoldable roundNumbers

-- | Get all pairings/games for a specific round in a division
getPairingsForRound :: Division -> Int -> Array Game
getPairingsForRound division roundNum =
  Array.filter (\g -> g.roundNumber == roundNum) division.games

-- | Get player name by ID from an array of players
getPlayerName :: forall r. Array { id :: PlayerId, name :: String | r } -> Int -> Maybe String
getPlayerName players playerId = do
  player <- Array.find (\p -> let PlayerId pid = p.id in pid == playerId) players
  pure player.name
