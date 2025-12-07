module Test.Utils.FormatSpec where

import Prelude

import Data.Maybe (Maybe(..))
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Utils.Format (formatNumberWithSign, formatPlayerName, formatLocation, getOrdinalSuffix, abbreviateTournamentName)

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
