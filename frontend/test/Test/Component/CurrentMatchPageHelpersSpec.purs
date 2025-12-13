module Test.Component.CurrentMatchPageHelpersSpec where

import Prelude

import Component.CurrentMatchPageHelpers (getPlayerName, getPairingsForRound, getRoundsForDivision)
import Data.Maybe (Maybe(..))
import Domain.Types (DivisionId(..), PlayerId(..))
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createCompletedGame, createDivision, createPlayer, createTournament)

spec :: Spec Unit
spec = do
  describe "CurrentMatchPageHelpers" do
    describe "getRoundsForDivision" do
      it "returns unique sorted round numbers from division games" do
        let player1 = createPlayer (PlayerId 1) "Alice" 1500
            player2 = createPlayer (PlayerId 2) "Bob" 1400
            game1 = createCompletedGame { gameId: 1, round: 3, player1: PlayerId 1, player2: PlayerId 2, score1: 400, score2: 350 }
            game2 = createCompletedGame { gameId: 2, round: 1, player1: PlayerId 1, player2: PlayerId 2, score1: 380, score2: 370 }
            game3 = createCompletedGame { gameId: 3, round: 3, player1: PlayerId 1, player2: PlayerId 2, score1: 420, score2: 360 }
            game4 = createCompletedGame { gameId: 4, round: 2, player1: PlayerId 1, player2: PlayerId 2, score1: 390, score2: 380 }
            division = createDivision (DivisionId 1) "A" [player1, player2] [game1, game2, game3, game4]
            tournament = createTournament 100 "Test Tournament" [division]

        getRoundsForDivision tournament 1 `shouldEqual` Just [1, 2, 3]

      it "returns Nothing when division not found" do
        let player = createPlayer (PlayerId 1) "Alice" 1500
            division = createDivision (DivisionId 1) "A" [player] []
            tournament = createTournament 100 "Test Tournament" [division]

        getRoundsForDivision tournament 999 `shouldEqual` Nothing

      it "returns empty array when division has no games" do
        let player = createPlayer (PlayerId 1) "Alice" 1500
            division = createDivision (DivisionId 1) "A" [player] []
            tournament = createTournament 100 "Test Tournament" [division]

        getRoundsForDivision tournament 1 `shouldEqual` Just []

    describe "getPairingsForRound" do
      it "returns all games from specified round" do
        let player1 = createPlayer (PlayerId 1) "Alice" 1500
            player2 = createPlayer (PlayerId 2) "Bob" 1400
            player3 = createPlayer (PlayerId 3) "Charlie" 1600
            game1 = createCompletedGame { gameId: 1, round: 2, player1: PlayerId 1, player2: PlayerId 2, score1: 400, score2: 350 }
            game2 = createCompletedGame { gameId: 2, round: 1, player1: PlayerId 1, player2: PlayerId 3, score1: 380, score2: 370 }
            game3 = createCompletedGame { gameId: 3, round: 2, player1: PlayerId 2, player2: PlayerId 3, score1: 420, score2: 360 }
            division = createDivision (DivisionId 1) "A" [player1, player2, player3] [game1, game2, game3]

        let round2Games = getPairingsForRound division 2
        round2Games `shouldEqual` [game1, game3]

      it "returns empty array when no games in round" do
        let player = createPlayer (PlayerId 1) "Alice" 1500
            game = createCompletedGame { gameId: 1, round: 1, player1: PlayerId 1, player2: PlayerId 1, score1: 400, score2: 350 }
            division = createDivision (DivisionId 1) "A" [player] [game]

        getPairingsForRound division 999 `shouldEqual` []

    describe "getPlayerName" do
      it "returns player name when found" do
        let player1 = createPlayer (PlayerId 101) "Alice" 1500
            player2 = createPlayer (PlayerId 102) "Bob" 1400
            players = [player1, player2]

        getPlayerName players 101 `shouldEqual` Just "Alice"
        getPlayerName players 102 `shouldEqual` Just "Bob"

      it "returns Nothing when player not found" do
        let player = createPlayer (PlayerId 101) "Alice" 1500
            players = [player]

        getPlayerName players 999 `shouldEqual` Nothing

      it "returns Nothing for empty player array" do
        getPlayerName [] 101 `shouldEqual` Nothing
