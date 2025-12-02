module Test.Types.CurrentMatchSpec where

import Prelude

import Data.Argonaut.Core (stringify)
import Data.Argonaut.Decode (decodeJson)
import Data.Argonaut.Encode (encodeJson)
import Data.Argonaut.Parser (jsonParser)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils (shouldRoundTrip)
import Types.CurrentMatch (CurrentMatch(..))

spec :: Spec Unit
spec =
  describe "CurrentMatch" do
    describe "JSON round trip" do
      it "should encode and decode correctly" do
        shouldRoundTrip $ CurrentMatch
          { tournamentId: 123
          , divisionId: 456
          , divisionName: "Division A"
          , round: 5
          , pairingId: Just 789
          , updatedAt: "2025-12-01T10:00:00Z"
          }

      it "should encode and decode with null pairingId" do
        shouldRoundTrip $ CurrentMatch
          { tournamentId: 123
          , divisionId: 456
          , divisionName: "Division A"
          , round: 5
          , pairingId: Nothing
          , updatedAt: "2025-12-01T10:00:00Z"
          }

      it "should decode from JSON string" do
        let
          jsonString = """{"tournamentId":123,"divisionId":456,"divisionName":"Division A","round":5,"pairingId":789,"updatedAt":"2025-12-01T10:00:00Z"}"""
          expected = CurrentMatch
            { tournamentId: 123
            , divisionId: 456
            , divisionName: "Division A"
            , round: 5
            , pairingId: Just 789
            , updatedAt: "2025-12-01T10:00:00Z"
            }

        case jsonParser jsonString of
          Left _ ->
            shouldEqual true false -- Force failure with readable message
          Right json ->
            decodeJson json `shouldEqual` Right expected

      it "should produce valid JSON that can be parsed" do
        let
          original = CurrentMatch
            { tournamentId: 123
            , divisionId: 456
            , divisionName: "Division A"
            , round: 5
            , pairingId: Just 789
            , updatedAt: "2025-12-01T10:00:00Z"
            }

          jsonString = stringify $ encodeJson original

        case jsonParser jsonString of
          Left _ ->
            shouldEqual true false -- Force failure
          Right json ->
            decodeJson json `shouldEqual` Right original
