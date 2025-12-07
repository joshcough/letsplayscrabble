module Test.Component.Overlay.StandingsSpec where

import Prelude

import Component.Overlay.TableOverlay (calculateStandingsTableData, getSpreadColor)
import Data.Array (length)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createMockDivisionData, createMockDivisionDataWithManyPlayers)

spec :: Spec Unit
spec =
  describe "Standings Component" do
    describe "getSpreadColor" do
      it "returns red for positive spread" do
        getSpreadColor "+100" `shouldEqual` "text-red-600"

      it "returns blue for negative spread" do
        getSpreadColor "-50" `shouldEqual` "text-blue-600"

      it "returns gray for zero or unknown" do
        getSpreadColor "0" `shouldEqual` "text-gray-800"
        getSpreadColor "" `shouldEqual` "text-gray-800"

    describe "calculateStandingsTableData" do
      it "creates table with correct title and subtitle" do
        let
          mockData = createMockDivisionData
          result = calculateStandingsTableData mockData

        result.title `shouldEqual` "Standings"
        result.subtitle `shouldEqual` "Test Tournament TWL • Division A"

      it "creates table with 4 columns" do
        let
          mockData = createMockDivisionData
          result = calculateStandingsTableData mockData

        length result.columns `shouldEqual` 4

      it "limits to top 10 players" do
        let
          mockData = createMockDivisionDataWithManyPlayers 15
          result = calculateStandingsTableData mockData

        length result.rows `shouldEqual` 10
