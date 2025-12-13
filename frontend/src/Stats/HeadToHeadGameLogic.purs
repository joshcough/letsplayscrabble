-- | Pure game logic functions for Head-to-Head display
-- | All functions are pure and testable
module Stats.HeadToHeadGameLogic where

import Prelude

import Data.Maybe (Maybe(..), fromMaybe)
import Stats.HeadToHeadStats (H2HGameExt)

-- | Game result from player 1's perspective
type GameResult =
  { isTie :: Boolean
  , p1Won :: Boolean
  , p1Lost :: Boolean
  , p1Score :: Int
  , p2Score :: Int
  , scores :: String
  , p1Result :: String  -- "W", "L", or "T"
  , p2Result :: String  -- "W", "L", or "T"
  , p1Color :: String
  , p2Color :: String
  }

-- | Calculate game result for head-to-head display
-- | Takes player 1's XT ID and the game, returns result from player 1's perspective
calculateGameResult :: Int -> H2HGameExt -> GameResult
calculateGameResult p1XtId game =
  let
    p1Score = if game.game.player1.playerid == p1XtId
              then game.game.player1.score
              else game.game.player2.score
    p2Score = if game.game.player1.playerid == p1XtId
              then game.game.player2.score
              else game.game.player1.score

    isTie = p1Score == p2Score
    p1Won = not isTie && p1Score > p2Score
    p1Lost = not isTie && p1Score < p2Score

    scores = show p1Score <> "-" <> show p2Score
    p1Result = if isTie then "T" else if p1Won then "W" else "L"
    p2Result = if isTie then "T" else if p1Won then "L" else "W"

    p1Color = if isTie then "text-black" else if p1Won then "text-red-600" else "text-blue-600"
    p2Color = if isTie then "text-black" else if p1Lost then "text-red-600" else "text-blue-600"
  in
    { isTie, p1Won, p1Lost, p1Score, p2Score, scores, p1Result, p2Result, p1Color, p2Color }

-- | Get tournament location string from game
getTournamentLocation :: H2HGameExt -> String
getTournamentLocation game =
  case game.tournamentName of
    Just tn -> tn
    Nothing -> fromMaybe "Tournament" game.game.tourneyname
