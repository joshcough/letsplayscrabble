module Test.Component.Overlay.HighScoresSpec where

import Prelude

import Component.Overlay.HighScores (calculateHighScoresTableData)
import Data.Array (length)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createMockDivisionData, createMockDivisionDataWithManyPlayers)

spec :: Spec Unit
spec =
  describe "HighScores Component" do
    describe "calculateHighScoresTableData" do
      it "creates table with correct title and subtitle" do
        let
          mockData = createMockDivisionData
          result = calculateHighScoresTableData mockData "A"

        result.title `shouldEqual` "High Scores"
        result.subtitle `shouldEqual` "Test Tournament TWL • Division A"

      it "creates table with 3 columns" do
        let
          mockData = createMockDivisionData
          result = calculateHighScoresTableData mockData "A"

        length result.columns `shouldEqual` 3

      it "limits to top 10 players" do
        let
          mockData = createMockDivisionDataWithManyPlayers 15
          result = calculateHighScoresTableData mockData "A"

        length result.rows `shouldEqual` 10
