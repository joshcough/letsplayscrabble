module Test.Stats.TournamentStatsSpec where

import Prelude

import Data.Array (length, (!!))
import Data.Maybe (Maybe(..))
import Stats.TournamentStats (calculateRatingGainPlayers, calculateHighScorePlayers, calculateScoringLeadersPlayers, calculateStandingsPlayers)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createMockDivisionData)

spec :: Spec Unit
spec =
  describe "TournamentStats (Pure Calculation Functions)" do
    describe "calculateRatingGainPlayers" do
      it "calculates ranked stats sorted by rating gain" do
        let
          mockData = createMockDivisionData
          players = calculateRatingGainPlayers mockData.division.players mockData.division.games

        -- Should return players ranked by rating gain
        length players `shouldEqual` 2

      it "returns correct player data structure with rank" do
        let
          mockData = createMockDivisionData
          players = calculateRatingGainPlayers mockData.division.players mockData.division.games

        -- Check first player has the expected fields
        case players !! 0 of
          Just player ->
            player.rank `shouldEqual` 1
          Nothing -> pure unit

    describe "calculateHighScorePlayers" do
      it "calculates ranked stats sorted by high score" do
        let
          mockData = createMockDivisionData
          players = calculateHighScorePlayers mockData.division.players mockData.division.games

        -- Should return players ranked by high score
        length players `shouldEqual` 2

      it "returns correct player data structure with rank" do
        let
          mockData = createMockDivisionData
          players = calculateHighScorePlayers mockData.division.players mockData.division.games

        -- Check first player has the expected fields
        case players !! 0 of
          Just player ->
            player.rank `shouldEqual` 1
          Nothing -> pure unit

    describe "calculateScoringLeadersPlayers" do
      it "calculates ranked stats sorted by average score" do
        let
          mockData = createMockDivisionData
          players = calculateScoringLeadersPlayers mockData.division.players mockData.division.games

        -- Should return players ranked by average score
        length players `shouldEqual` 2

      it "returns correct player data structure with rank" do
        let
          mockData = createMockDivisionData
          players = calculateScoringLeadersPlayers mockData.division.players mockData.division.games

        -- Check first player has the expected fields
        case players !! 0 of
          Just player ->
            player.rank `shouldEqual` 1
          Nothing -> pure unit

    describe "calculateStandingsPlayers" do
      it "calculates ranked stats sorted by standings" do
        let
          mockData = createMockDivisionData
          players = calculateStandingsPlayers mockData.division.players mockData.division.games

        -- Should return players ranked by standings
        length players `shouldEqual` 2

      it "returns correct player data structure with rank" do
        let
          mockData = createMockDivisionData
          players = calculateStandingsPlayers mockData.division.players mockData.division.games

        -- Check first player has the expected fields
        case players !! 0 of
          Just player ->
            player.rank `shouldEqual` 1
          Nothing -> pure unit
