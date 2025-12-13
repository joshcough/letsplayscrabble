module Test.Domain.TypesSpec where

import Prelude

import Domain.Types (DivisionId(..), GameId(..), PairingId(..), PlayerId(..), TournamentId(..), XTId(..))
import Test.Spec (Spec, describe, it)
import Test.Utils (shouldRoundTrip)

spec :: Spec Unit
spec =
  describe "Domain.Types" do
    describe "Newtype wrappers JSON round trip" do
      it "TournamentId should encode and decode correctly" do
        shouldRoundTrip (TournamentId 123)

      it "DivisionId should encode and decode correctly" do
        shouldRoundTrip (DivisionId 456)

      it "PlayerId should encode and decode correctly" do
        shouldRoundTrip (PlayerId 789)

      it "GameId should encode and decode correctly" do
        shouldRoundTrip (GameId 111)

      it "PairingId should encode and decode correctly" do
        shouldRoundTrip (PairingId 222)

      it "XTId should encode and decode correctly" do
        shouldRoundTrip (XTId 333)

      it "Should handle large numbers" do
        shouldRoundTrip (TournamentId 999999999)

      it "Should handle zero" do
        shouldRoundTrip (PlayerId 0)

      it "Should handle negative numbers" do
        shouldRoundTrip (GameId (-1))
