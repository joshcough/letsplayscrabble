module Test.Stats.HeadToHeadStatsSpec where

import Prelude

import Data.Maybe (Maybe(..))
import Domain.Types (PlayerId(..))
import Stats.HeadToHeadStats (H2HGameExt, PlayerRecord, calculateRecord, getPlaceOrSeedLabel, sortGames, resolvePlayerIds, findPlayerPair, resolveAndFindPlayers)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createMockDivisionData)

spec :: Spec Unit
spec =
  describe "Stats.HeadToHeadStats" do
    describe "calculateRecord" do
      it "calculates wins, losses, and spread for a player" do
        let
          mockData = createMockDivisionData
          playerId = PlayerId 1
          record = calculateRecord playerId mockData.division

        -- Player 1 won 400-350, so 1 win, 0 losses, +50 spread
        record.wins `shouldEqual` 1
        record.losses `shouldEqual` 0
        record.spread `shouldEqual` 50

      it "handles player with no games" do
        let
          mockData = createMockDivisionData
          playerId = PlayerId 999  -- Non-existent player
          record = calculateRecord playerId mockData.division

        record.wins `shouldEqual` 0
        record.losses `shouldEqual` 0
        record.spread `shouldEqual` 0

      it "calculates negative spread for losing player" do
        let
          mockData = createMockDivisionData
          playerId = PlayerId 2  -- Lost 350-400
          record = calculateRecord playerId mockData.division

        record.wins `shouldEqual` 0
        record.losses `shouldEqual` 1
        record.spread `shouldEqual` (-50)

    describe "getPlaceOrSeedLabel" do
      it "returns 'Seed' for players with no games" do
        let record = { wins: 0, losses: 0, spread: 0 } :: PlayerRecord
        getPlaceOrSeedLabel record `shouldEqual` "Seed"

      it "returns 'Place' for players with wins" do
        let record = { wins: 5, losses: 2, spread: 100 } :: PlayerRecord
        getPlaceOrSeedLabel record `shouldEqual` "Place"

      it "returns 'Place' for players with losses but no wins" do
        let record = { wins: 0, losses: 3, spread: (-50) } :: PlayerRecord
        getPlaceOrSeedLabel record `shouldEqual` "Place"

    describe "sortGames" do
      it "sorts current tournament games before historical games" do
        let
          game1 = createMockH2HGame 1 "2024-01-01" false
          game2 = createMockH2HGame 2 "2024-02-01" true
          game3 = createMockH2HGame 3 "2024-03-01" false

          games = [game1, game2, game3]
          sorted = sortGames games

        -- Current tournament game (game2) should be first
        case sorted of
          [first, _, _] -> first.game.gameid `shouldEqual` 2
          _ -> pure unit

      it "sorts by date within same tournament type" do
        let
          game1 = createMockH2HGame 1 "2024-01-01" false
          game2 = createMockH2HGame 2 "2024-03-01" false
          game3 = createMockH2HGame 3 "2024-02-01" false

          games = [game1, game2, game3]
          sorted = sortGames games

        -- Most recent date (2024-03-01) should be first
        case sorted of
          [first, second, third] -> do
            first.game.date `shouldEqual` "2024-03-01"
            second.game.date `shouldEqual` "2024-02-01"
            third.game.date `shouldEqual` "2024-01-01"
          _ -> pure unit

    describe "resolvePlayerIds" do
      it "returns params directly when not in currentMatch mode" do
        let
          mockData = createMockDivisionData
          result = resolvePlayerIds 10 20 Nothing mockData.division.games

        result `shouldEqual` Just { playerId1: 10, playerId2: 20 }

      it "returns params directly when params are non-zero" do
        let
          mockData = createMockDivisionData
          currentMatch = Just { round: 1, pairingId: 1, divisionName: "A" }
          result = resolvePlayerIds 10 20 currentMatch mockData.division.games

        result `shouldEqual` Just { playerId1: 10, playerId2: 20 }

      it "extracts player IDs from current game when params are 0" do
        let
          mockData = createMockDivisionData
          currentMatch = Just { round: 1, pairingId: 1, divisionName: "A" }
          result = resolvePlayerIds 0 0 currentMatch mockData.division.games

        -- Should extract from the game (player 1 vs player 2)
        result `shouldEqual` Just { playerId1: 1, playerId2: 2 }

      it "returns Nothing when game not found for current match" do
        let
          mockData = createMockDivisionData
          currentMatch = Just { round: 99, pairingId: 99, divisionName: "A" }
          result = resolvePlayerIds 0 0 currentMatch mockData.division.games

        result `shouldEqual` Nothing

    describe "findPlayerPair" do
      it "finds both players when they exist" do
        let
          mockData = createMockDivisionData
          result = findPlayerPair 1 2 mockData.division.players

        case result of
          Just { player1, player2 } -> do
            player1.id `shouldEqual` PlayerId 1
            player2.id `shouldEqual` PlayerId 2
          Nothing -> pure unit

      it "returns Nothing when first player not found" do
        let
          mockData = createMockDivisionData
          result = findPlayerPair 999 2 mockData.division.players

        result `shouldEqual` Nothing

      it "returns Nothing when second player not found" do
        let
          mockData = createMockDivisionData
          result = findPlayerPair 1 999 mockData.division.players

        result `shouldEqual` Nothing

    describe "resolveAndFindPlayers" do
      it "resolves and finds players in specific player mode" do
        let
          mockData = createMockDivisionData
          result = resolveAndFindPlayers 1 2 Nothing mockData.division

        case result of
          Just { player1, player2 } -> do
            player1.id `shouldEqual` PlayerId 1
            player2.id `shouldEqual` PlayerId 2
          Nothing -> pure unit

      it "resolves and finds players in currentMatch mode" do
        let
          mockData = createMockDivisionData
          currentMatch = Just { round: 1, pairingId: 1, divisionName: "A" }
          result = resolveAndFindPlayers 0 0 currentMatch mockData.division

        case result of
          Just { player1, player2 } -> do
            player1.id `shouldEqual` PlayerId 1
            player2.id `shouldEqual` PlayerId 2
          Nothing -> pure unit

      it "returns Nothing when players cannot be resolved" do
        let
          mockData = createMockDivisionData
          result = resolveAndFindPlayers 999 999 Nothing mockData.division

        result `shouldEqual` Nothing

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- Create a mock H2H game for testing
createMockH2HGame :: Int -> String -> Boolean -> H2HGameExt
createMockH2HGame gameId date isCurrentTournament =
  { game:
      { gameid: gameId
      , date: date
      , tourneyname: Just "Test Tournament"
      , player1:
          { playerid: 100
          , name: "Player 1"
          , score: 400
          , oldrating: 1500
          , newrating: 1510
          , position: Nothing
          }
      , player2:
          { playerid: 200
          , name: "Player 2"
          , score: 350
          , oldrating: 1450
          , newrating: 1445
          , position: Nothing
          }
      , annotated: Nothing
      }
  , tournamentName: Just "Test Tournament"
  , isCurrentTournament: isCurrentTournament
  }
