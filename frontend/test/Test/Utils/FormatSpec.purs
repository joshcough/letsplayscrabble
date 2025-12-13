module Test.Utils.FormatSpec where

import Prelude

import Data.Maybe (Maybe(..))
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Utils.Format (formatNumberWithSign, formatPlayerName, formatLocation, getOrdinalSuffix, formatRankOrdinal, abbreviateTournamentName, getInitials, formatNumber, formatDate, getCurrentRating, getRanking, calculateWinPercentage, getRecentTournament)
import Domain.Types (CrossTablesPlayer, TournamentResult)

spec :: Spec Unit
spec =
  describe "Utils.Format" do
    describe "formatNumberWithSign" do
      it "formats positive numbers with +" do
        formatNumberWithSign 50 `shouldEqual` "+50"
        formatNumberWithSign 1 `shouldEqual` "+1"

      it "formats negative numbers with -" do
        formatNumberWithSign (-50) `shouldEqual` "-50"
        formatNumberWithSign (-1) `shouldEqual` "-1"

      it "formats zero without sign" do
        formatNumberWithSign 0 `shouldEqual` "0"

    describe "formatPlayerName" do
      it "converts 'Last, First' to 'First Last'" do
        formatPlayerName "Smith, John" `shouldEqual` "John Smith"
        formatPlayerName "Doe, Jane" `shouldEqual` "Jane Doe"

      it "handles names without commas" do
        formatPlayerName "JohnSmith" `shouldEqual` "JohnSmith"
        formatPlayerName "John" `shouldEqual` "John"

      it "trims whitespace around first name" do
        formatPlayerName "Smith,   John  " `shouldEqual` "John Smith"

    describe "formatLocation" do
      it "formats city and state" do
        formatLocation (Just { city: Just "Seattle", state: Just "WA", country: Nothing }) `shouldEqual` Just "Seattle, WA"

      it "formats city only when no state" do
        formatLocation (Just { city: Just "Seattle", state: Nothing, country: Nothing }) `shouldEqual` Just "Seattle"

      it "returns Nothing when no city" do
        formatLocation (Just { city: Nothing, state: Just "WA", country: Nothing }) `shouldEqual` Nothing

      it "returns Nothing when input is Nothing" do
        formatLocation Nothing `shouldEqual` (Nothing :: Maybe String)

    describe "getOrdinalSuffix" do
      it "returns 'st' for 1, 21, 31, etc." do
        getOrdinalSuffix 1 `shouldEqual` "st"
        getOrdinalSuffix 21 `shouldEqual` "st"
        getOrdinalSuffix 31 `shouldEqual` "st"
        getOrdinalSuffix 101 `shouldEqual` "st"

      it "returns 'nd' for 2, 22, 32, etc." do
        getOrdinalSuffix 2 `shouldEqual` "nd"
        getOrdinalSuffix 22 `shouldEqual` "nd"
        getOrdinalSuffix 32 `shouldEqual` "nd"
        getOrdinalSuffix 102 `shouldEqual` "nd"

      it "returns 'rd' for 3, 23, 33, etc." do
        getOrdinalSuffix 3 `shouldEqual` "rd"
        getOrdinalSuffix 23 `shouldEqual` "rd"
        getOrdinalSuffix 33 `shouldEqual` "rd"
        getOrdinalSuffix 103 `shouldEqual` "rd"

      it "returns 'th' for 11, 12, 13" do
        getOrdinalSuffix 11 `shouldEqual` "th"
        getOrdinalSuffix 12 `shouldEqual` "th"
        getOrdinalSuffix 13 `shouldEqual` "th"
        getOrdinalSuffix 111 `shouldEqual` "th"
        getOrdinalSuffix 112 `shouldEqual` "th"
        getOrdinalSuffix 113 `shouldEqual` "th"

      it "returns 'th' for 4-10, 14-20, etc." do
        getOrdinalSuffix 4 `shouldEqual` "th"
        getOrdinalSuffix 5 `shouldEqual` "th"
        getOrdinalSuffix 10 `shouldEqual` "th"
        getOrdinalSuffix 14 `shouldEqual` "th"
        getOrdinalSuffix 20 `shouldEqual` "th"

    describe "abbreviateTournamentName" do
      it "abbreviates 'International'" do
        abbreviateTournamentName "International Tournament" `shouldEqual` "Int'l Tourney"

      it "abbreviates 'Tournament'" do
        abbreviateTournamentName "Seattle Tournament" `shouldEqual` "Seattle Tourney"

      it "abbreviates 'National'" do
        abbreviateTournamentName "National Championship" `shouldEqual` "Nat'l Championship"

      it "abbreviates 'Invitational'" do
        abbreviateTournamentName "Seattle Invitational" `shouldEqual` "Seattle Invit'l"

      it "handles multiple abbreviations" do
        abbreviateTournamentName "International National Tournament" `shouldEqual` "Int'l Nat'l Tourney"

      it "returns unchanged if no abbreviations match" do
        abbreviateTournamentName "Seattle Open" `shouldEqual` "Seattle Open"

    describe "formatRankOrdinal" do
      it "formats rank with ordinal suffix" do
        formatRankOrdinal 1 `shouldEqual` "1st"
        formatRankOrdinal 2 `shouldEqual` "2nd"
        formatRankOrdinal 3 `shouldEqual` "3rd"
        formatRankOrdinal 4 `shouldEqual` "4th"
        formatRankOrdinal 11 `shouldEqual` "11th"
        formatRankOrdinal 21 `shouldEqual` "21st"

    describe "getInitials" do
      it "gets initials from player name" do
        getInitials "Smith, John" `shouldEqual` "JS"
        getInitials "Doe, Jane Mary" `shouldEqual` "JMD"

      it "handles names without commas" do
        getInitials "John Smith" `shouldEqual` "JS"

    describe "formatNumber" do
      it "formats number with specified decimal places" do
        formatNumber 12.344 2 `shouldEqual` "12.34"
        formatNumber 12.345 2 `shouldEqual` "12.35"
        formatNumber 12.3 1 `shouldEqual` "12.3"

    describe "formatDate" do
      it "formats YYYY-MM-DD to 'Mon DD, YYYY'" do
        formatDate "2024-01-15" `shouldEqual` "Jan 15, 2024"
        formatDate "2024-12-25" `shouldEqual` "Dec 25, 2024"

      it "removes leading zero from day" do
        formatDate "2024-06-05" `shouldEqual` "Jun 5, 2024"

      it "returns unchanged if invalid format" do
        formatDate "invalid" `shouldEqual` "invalid"

    describe "getCurrentRating" do
      it "returns last rating from history" do
        getCurrentRating { initialRating: 1500, ratingsHistory: [1520, 1530, 1540] } `shouldEqual` Just 1540

      it "returns initial rating when history is empty" do
        getCurrentRating { initialRating: 1500, ratingsHistory: [] } `shouldEqual` Just 1500

    describe "getRanking" do
      it "prefers TWL ranking" do
        let xt = mockXtData { twlranking = Just 100, cswranking = Just 200 }
        getRanking (Just xt) `shouldEqual` Just 100

      it "falls back to CSW ranking" do
        let xt = mockXtData { cswranking = Just 200 }
        getRanking (Just xt) `shouldEqual` Just 200

      it "returns Nothing when no rankings" do
        getRanking (Just mockXtData) `shouldEqual` (Nothing :: Maybe Int)

      it "returns Nothing when input is Nothing" do
        getRanking Nothing `shouldEqual` (Nothing :: Maybe Int)

    describe "calculateWinPercentage" do
      it "calculates win percentage" do
        let xt = mockXtData { w = Just 10, l = Just 5, t = Just 0 }
        calculateWinPercentage (Just xt) `shouldEqual` Just 66.7

      it "counts ties as 0.5 wins" do
        let xt = mockXtData { w = Just 10, l = Just 8, t = Just 2 }
        -- (10 + 1) / 20 * 100 = 55%
        calculateWinPercentage (Just xt) `shouldEqual` Just 55.0

      it "returns 0 when no games" do
        let xt = mockXtData { w = Just 0, l = Just 0, t = Just 0 }
        calculateWinPercentage (Just xt) `shouldEqual` Just 0.0

      it "returns Nothing when data is missing" do
        calculateWinPercentage Nothing `shouldEqual` (Nothing :: Maybe Number)

    describe "getRecentTournament" do
      it "prefers wins" do
        let result1 :: TournamentResult
            result1 = { place: 2, name: "Tournament A", wins: 5, losses: 3, date: "2024-01-01", division: "A", points: 100, averagepoints: 100, ties: 0, rating: 1500, ratingchange: 10, tourneyid: 1, totalplayers: 20 }
            result2 :: TournamentResult
            result2 = { place: 1, name: "Tournament B", wins: 7, losses: 1, date: "2024-01-15", division: "A", points: 120, averagepoints: 110, ties: 0, rating: 1520, ratingchange: 20, tourneyid: 2, totalplayers: 25 }
            xt = mockXtData { results = Just [result1, result2] }
        getRecentTournament (Just xt) `shouldEqual` Just result2

      it "returns first result if no wins" do
        let result1 :: TournamentResult
            result1 = { place: 2, name: "Tournament A", wins: 5, losses: 3, date: "2024-01-01", division: "A", points: 100, averagepoints: 100, ties: 0, rating: 1500, ratingchange: 10, tourneyid: 1, totalplayers: 20 }
            result2 :: TournamentResult
            result2 = { place: 3, name: "Tournament B", wins: 4, losses: 4, date: "2024-01-15", division: "A", points: 95, averagepoints: 95, ties: 0, rating: 1490, ratingchange: -10, tourneyid: 2, totalplayers: 18 }
            xt = mockXtData { results = Just [result1, result2] }
        getRecentTournament (Just xt) `shouldEqual` Just result1

      it "returns Nothing when no results" do
        getRecentTournament (Just mockXtData) `shouldEqual` (Nothing :: Maybe TournamentResult)

-- Helper to create mock CrossTablesPlayer data
mockXtData :: CrossTablesPlayer
mockXtData =
  { playerid: 1
  , name: "Test Player"
  , twlrating: Nothing
  , cswrating: Nothing
  , twlranking: Nothing
  , cswranking: Nothing
  , w: Nothing
  , l: Nothing
  , t: Nothing
  , b: Nothing
  , photourl: Nothing
  , city: Nothing
  , state: Nothing
  , country: Nothing
  , tournamentCount: Nothing
  , averageScore: Nothing
  , opponentAverageScore: Nothing
  , results: Nothing
  }
