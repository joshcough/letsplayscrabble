module Test.Component.RouterHelpersSpec where

import Prelude

import Component.RouterHelpers (createSubscription, createSubscriptionFromRoute, getUserIdFromRoute)
import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..))
import Route (Route(..))
import Stats.OverlayLogic as OverlayLogic
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)

spec :: Spec Unit
spec =
  describe "Component.RouterHelpers" do
    describe "createSubscription" do
      it "creates OverlayLogic.SpecificTournament when both tournament ID and division name are provided" do
        let result = createSubscription (Just 123) (Just "Division A")
        result `shouldEqual` Just (OverlayLogic.SpecificTournament { tournamentId: TournamentId 123, divisionName: "Division A" })

      it "creates CurrentMatch when neither tournament ID nor division name are provided" do
        let result = createSubscription Nothing Nothing
        result `shouldEqual` Just OverlayLogic.CurrentMatch

      it "returns Nothing when tournament ID is provided without division name" do
        let result = createSubscription (Just 123) Nothing
        result `shouldEqual` Nothing

      it "returns Nothing when division name is provided without tournament ID" do
        let result = createSubscription Nothing (Just "Division A")
        result `shouldEqual` Nothing

    describe "createSubscriptionFromRoute" do
      it "extracts subscription from Standings route with both tournament and division" do
        let
          route = Standings
            { userId: 1
            , tournamentId: Just 123
            , divisionName: Just "Division A"
            , pics: Nothing
            }
          result = createSubscriptionFromRoute route
        result `shouldEqual` Just (OverlayLogic.SpecificTournament { tournamentId: TournamentId 123, divisionName: "Division A" })

      it "extracts CurrentMatch subscription from Standings route with no tournament" do
        let
          route = Standings
            { userId: 1
            , tournamentId: Nothing
            , divisionName: Nothing
            , pics: Nothing
            }
          result = createSubscriptionFromRoute route
        result `shouldEqual` Just OverlayLogic.CurrentMatch

      it "returns Nothing for Standings route with only tournament ID" do
        let
          route = Standings
            { userId: 1
            , tournamentId: Just 123
            , divisionName: Nothing
            , pics: Nothing
            }
          result = createSubscriptionFromRoute route
        result `shouldEqual` Nothing

      it "returns Nothing for non-overlay routes" do
        let
          route = Home
          result = createSubscriptionFromRoute route
        result `shouldEqual` Nothing

      it "extracts subscription from HighScores route" do
        let
          route = HighScores
            { userId: 1
            , tournamentId: Just 456
            , divisionName: Just "Division B"
            , pics: Nothing
            }
          result = createSubscriptionFromRoute route
        result `shouldEqual` Just (OverlayLogic.SpecificTournament { tournamentId: TournamentId 456, divisionName: "Division B" })

      it "extracts subscription from RatingGain route" do
        let
          route = RatingGain
            { userId: 1
            , tournamentId: Just 789
            , divisionName: Just "Division C"
            , pics: Nothing
            }
          result = createSubscriptionFromRoute route
        result `shouldEqual` Just (OverlayLogic.SpecificTournament { tournamentId: TournamentId 789, divisionName: "Division C" })

      it "extracts subscription from ScoringLeaders route" do
        let
          route = ScoringLeaders
            { userId: 1
            , tournamentId: Just 999
            , divisionName: Just "Division D"
            , pics: Nothing
            }
          result = createSubscriptionFromRoute route
        result `shouldEqual` Just (OverlayLogic.SpecificTournament { tournamentId: TournamentId 999, divisionName: "Division D" })

    describe "getUserIdFromRoute" do
      it "extracts userId from Standings route" do
        let
          route = Standings
            { userId: 42
            , tournamentId: Nothing
            , divisionName: Nothing
            , pics: Nothing
            }
          result = getUserIdFromRoute route
        result `shouldEqual` Just 42

      it "extracts userId from HighScores route" do
        let
          route = HighScores
            { userId: 123
            , tournamentId: Nothing
            , divisionName: Nothing
            , pics: Nothing
            }
          result = getUserIdFromRoute route
        result `shouldEqual` Just 123

      it "extracts userId from CrossTablesPlayerProfile route" do
        let
          route = CrossTablesPlayerProfile
            { userId: 999
            , tournamentId: Nothing
            , divisionName: Nothing
            , playerId: 12345
            }
          result = getUserIdFromRoute route
        result `shouldEqual` Just 999

      it "returns Nothing for Home route" do
        let
          route = Home
          result = getUserIdFromRoute route
        result `shouldEqual` Nothing

      it "returns Nothing for Login route" do
        let
          route = Login
          result = getUserIdFromRoute route
        result `shouldEqual` Nothing
