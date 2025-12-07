module Test.Component.Overlay.RatingGainSpec where

import Prelude

import Component.Overlay.RatingGain (calculateRatingGainTableData, getRatingChangeColor)
import Data.Array (length, (!!))
import Data.Maybe (Maybe(..))
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createMockDivisionData, createMockDivisionDataWithManyPlayers)

spec :: Spec Unit
spec =
  describe "RatingGain Component" do
    describe "getRatingChangeColor" do
      it "returns red for positive rating change" do
        getRatingChangeColor "+50" `shouldEqual` "text-red-600"

      it "returns blue for negative rating change" do
        getRatingChangeColor "-25" `shouldEqual` "text-blue-600"

      it "returns gray for zero or unknown" do
        getRatingChangeColor "0" `shouldEqual` "text-gray-800"
        getRatingChangeColor "" `shouldEqual` "text-gray-800"

    describe "calculateRatingGainTableData" do
      it "creates table with correct title and subtitle" do
        let
          mockData = createMockDivisionData
          result = calculateRatingGainTableData mockData "A"

        result.title `shouldEqual` "Rating Gain"
        result.subtitle `shouldEqual` "Test Tournament TWL • Division A"

      it "creates table with 5 columns" do
        let
          mockData = createMockDivisionData
          result = calculateRatingGainTableData mockData "A"

        length result.columns `shouldEqual` 5

      it "limits to top 10 players" do
        let
          mockData = createMockDivisionDataWithManyPlayers 15
          result = calculateRatingGainTableData mockData "A"

        length result.rows `shouldEqual` 10

      it "includes rating diff column" do
        let
          mockData = createMockDivisionData
          result = calculateRatingGainTableData mockData "A"

        -- Check that rows include rating diff column (column index 2)
        case result.rows !! 0 of
          Just row ->
            -- Should have at least 5 columns (rank, name, ratingDiff, currentRating, initialRating)
            length row `shouldEqual` 5
          Nothing -> pure unit
