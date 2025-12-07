module Test.Component.Overlay.ScoringLeadersSpec where

import Prelude

import Component.Overlay.ScoringLeaders (calculateScoringLeadersTableData)
import Data.Array (length)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createMockDivisionData, createMockDivisionDataWithManyPlayers)

spec :: Spec Unit
spec =
  describe "ScoringLeaders Component" do
    describe "calculateScoringLeadersTableData" do
      it "creates table with correct title and subtitle" do
        let
          mockData = createMockDivisionData
          result = calculateScoringLeadersTableData mockData "A"

        result.title `shouldEqual` "Scoring Leaders"
        result.subtitle `shouldEqual` "Test Tournament TWL • Division A"

      it "creates table with 4 columns" do
        let
          mockData = createMockDivisionData
          result = calculateScoringLeadersTableData mockData "A"

        length result.columns `shouldEqual` 4

      it "limits to top 10 players" do
        let
          mockData = createMockDivisionDataWithManyPlayers 15
          result = calculateScoringLeadersTableData mockData "A"

        length result.rows `shouldEqual` 10
