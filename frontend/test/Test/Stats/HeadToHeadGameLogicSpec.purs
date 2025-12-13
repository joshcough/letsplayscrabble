module Test.Stats.HeadToHeadGameLogicSpec where

import Prelude

import Data.Maybe (Maybe(..))
import Stats.HeadToHeadGameLogic (calculateGameResult, getTournamentLocation)
import Stats.HeadToHeadStats (H2HGameExt)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)

spec :: Spec Unit
spec =
  describe "Stats.HeadToHeadGameLogic" do
    describe "calculateGameResult" do
      it "calculates win for player 1" do
        let game = mockH2HGame 100 450 400
        let result = calculateGameResult 100 game
        result.p1Score `shouldEqual` 450
        result.p2Score `shouldEqual` 400
        result.isTie `shouldEqual` false
        result.p1Won `shouldEqual` true
        result.p1Lost `shouldEqual` false
        result.p1Result `shouldEqual` "W"
        result.p2Result `shouldEqual` "L"
        result.scores `shouldEqual` "450-400"
        result.p1Color `shouldEqual` "text-red-600"
        result.p2Color `shouldEqual` "text-blue-600"

      it "calculates loss for player 1" do
        let game = mockH2HGame 100 350 450
        let result = calculateGameResult 100 game
        result.p1Won `shouldEqual` false
        result.p1Lost `shouldEqual` true
        result.isTie `shouldEqual` false
        result.p1Result `shouldEqual` "L"
        result.p2Result `shouldEqual` "W"
        result.scores `shouldEqual` "350-450"
        result.p1Color `shouldEqual` "text-blue-600"
        result.p2Color `shouldEqual` "text-red-600"

      it "calculates tie" do
        let game = mockH2HGame 100 400 400
        let result = calculateGameResult 100 game
        result.p1Won `shouldEqual` false
        result.p1Lost `shouldEqual` false
        result.isTie `shouldEqual` true
        result.p1Result `shouldEqual` "T"
        result.p2Result `shouldEqual` "T"
        result.scores `shouldEqual` "400-400"
        result.p1Color `shouldEqual` "text-black"
        result.p2Color `shouldEqual` "text-black"

      it "handles player 1 as player2 in game data" do
        let game = mockH2HGameReversed 100 400 450
        let result = calculateGameResult 100 game
        result.p1Won `shouldEqual` false
        result.p1Lost `shouldEqual` true
        result.p1Score `shouldEqual` 400
        result.p2Score `shouldEqual` 450

    describe "getTournamentLocation" do
      it "uses tournamentName when available" do
        let game = { tournamentName: Just "Seattle Open", isCurrentTournament: false, game: { player1: { playerid: 100, score: 400, name: "P1", oldrating: 1500, newrating: 1520, position: Nothing }, player2: { playerid: 200, score: 380, name: "P2", oldrating: 1500, newrating: 1490, position: Nothing }, date: "2024-01-01", tourneyname: Just "Old Name", gameid: 1, annotated: Nothing } }
        getTournamentLocation game `shouldEqual` "Seattle Open"

      it "falls back to tourneyname" do
        let game = { tournamentName: Nothing, isCurrentTournament: false, game: { player1: { playerid: 100, score: 400, name: "P1", oldrating: 1500, newrating: 1520, position: Nothing }, player2: { playerid: 200, score: 380, name: "P2", oldrating: 1500, newrating: 1490, position: Nothing }, date: "2024-01-01", tourneyname: Just "Fallback Name", gameid: 2, annotated: Nothing } }
        getTournamentLocation game `shouldEqual` "Fallback Name"

      it "uses 'Tournament' when both are Nothing" do
        let game = { tournamentName: Nothing, isCurrentTournament: false, game: { player1: { playerid: 100, score: 400, name: "P1", oldrating: 1500, newrating: 1520, position: Nothing }, player2: { playerid: 200, score: 380, name: "P2", oldrating: 1500, newrating: 1490, position: Nothing }, date: "2024-01-01", tourneyname: Nothing, gameid: 3, annotated: Nothing } }
        getTournamentLocation game `shouldEqual` "Tournament"

-- Helper functions
mockH2HGame :: Int -> Int -> Int -> H2HGameExt
mockH2HGame p1Id p1Score p2Score =
  { tournamentName: Just "Test Tournament"
  , isCurrentTournament: false
  , game:
      { player1: { playerid: p1Id, score: p1Score, name: "Player 1", position: Nothing, oldrating: 1500, newrating: 1520 }
      , player2: { playerid: 999, score: p2Score, name: "Opponent", position: Nothing, oldrating: 1500, newrating: 1480 }
      , date: "2024-01-01"
      , tourneyname: Just "Test Tournament"
      , gameid: 1
      , annotated: Nothing
      }
  }

mockH2HGameReversed :: Int -> Int -> Int -> H2HGameExt
mockH2HGameReversed p1Id p1Score p2Score =
  { tournamentName: Just "Test Tournament"
  , isCurrentTournament: false
  , game:
      { player1: { playerid: 999, score: p2Score, name: "Opponent", position: Nothing, oldrating: 1500, newrating: 1520 }
      , player2: { playerid: p1Id, score: p1Score, name: "Player 1", position: Nothing, oldrating: 1500, newrating: 1480 }
      , date: "2024-01-01"
      , tourneyname: Just "Test Tournament"
      , gameid: 2
      , annotated: Nothing
      }
  }
