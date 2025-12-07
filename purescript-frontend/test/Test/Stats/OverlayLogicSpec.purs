module Test.Stats.OverlayLogicSpec where

import Prelude

import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..), PlayerId(..), Tournament, DivisionId(..))
import BroadcastChannel.Messages (TournamentDataResponse, AdminPanelUpdate)
import Stats.OverlayLogic (TournamentSubscription(..), createTournamentSubscription, buildSubscribeMessage, shouldAcceptResponse, resolveDivisionName, findDivisionByName, createTournamentSummary, createDivisionScopedData, formatDivisionNotFoundError, createCurrentMatchInfo, shouldProcessAdminUpdate, processTournamentDataResponse)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createDivisionWith, createPlayer)
import Test.Utils.TestHelpers as TestHelpers

spec :: Spec Unit
spec =
  describe "Stats.OverlayLogic" do
    describe "createTournamentSubscription" do
      it "creates SpecificTournament when both tournamentId and divisionName are provided" do
        let result = createTournamentSubscription (Just (TournamentId 123)) (Just "Division A")
        case result of
          Just (SpecificTournament { tournamentId, divisionName }) -> do
            tournamentId `shouldEqual` TournamentId 123
            divisionName `shouldEqual` "Division A"
          _ -> pure unit

      it "creates CurrentMatch when neither tournamentId nor divisionName are provided" do
        let result = createTournamentSubscription Nothing Nothing
        result `shouldEqual` Just CurrentMatch

      it "returns Nothing when tournamentId is provided without divisionName" do
        let result = createTournamentSubscription (Just (TournamentId 123)) Nothing
        result `shouldEqual` Nothing

      it "returns Nothing when divisionName is provided without tournamentId" do
        let result = createTournamentSubscription Nothing (Just "Division A")
        result `shouldEqual` Nothing

    describe "buildSubscribeMessage" do
      it "builds message with tournament and division" do
        let msg = buildSubscribeMessage 1 (Just (TournamentId 123)) (Just "Division A")

        msg.userId `shouldEqual` 1
        case msg.tournament of
          Just t -> do
            t.tournamentId `shouldEqual` TournamentId 123
            case t.division of
              Just d -> d.divisionName `shouldEqual` "Division A"
              Nothing -> pure unit
          Nothing -> pure unit

      it "builds message with tournament but no division" do
        let msg = buildSubscribeMessage 1 (Just (TournamentId 123)) Nothing

        msg.userId `shouldEqual` 1
        case msg.tournament of
          Just t -> do
            t.tournamentId `shouldEqual` TournamentId 123
            t.division `shouldEqual` Nothing
          Nothing -> pure unit

      it "builds message for current match mode (no tournament)" do
        let msg = buildSubscribeMessage 1 Nothing Nothing

        msg.userId `shouldEqual` 1
        msg.tournament `shouldEqual` Nothing

    describe "shouldAcceptResponse" do
      it "accepts response in current match mode when isCurrentMatch is true" do
        let
          response = createMockResponse (TournamentId 123) true { data: createMockTournament }
          result = shouldAcceptResponse CurrentMatch response

        result `shouldEqual` true

      it "rejects response in current match mode when isCurrentMatch is false" do
        let
          response = createMockResponse (TournamentId 123) false { data: createMockTournament }
          result = shouldAcceptResponse CurrentMatch response

        result `shouldEqual` false

      it "accepts response in specific tournament mode when IDs match" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 123, divisionName: "Division A" }
          response = createMockResponse (TournamentId 123) false { data: createMockTournament }
          result = shouldAcceptResponse subscription response

        result `shouldEqual` true

      it "rejects response in specific tournament mode when IDs don't match" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 456, divisionName: "Division A" }
          response = createMockResponse (TournamentId 123) false { data: createMockTournament }
          result = shouldAcceptResponse subscription response

        result `shouldEqual` false

    describe "resolveDivisionName" do
      it "uses currentMatch division in current match mode" do
        let
          currentMatch = Just { divisionName: "Current Division", round: 1, pairingId: 1 }
          result = resolveDivisionName CurrentMatch currentMatch

        result `shouldEqual` Just "Current Division"

      it "returns Nothing in current match mode when currentMatch is Nothing" do
        let
          result = resolveDivisionName CurrentMatch Nothing

        result `shouldEqual` Nothing

      it "uses subscription division in specific tournament mode" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 123, divisionName: "Input Division" }
          currentMatch = Just { divisionName: "Current Division", round: 1, pairingId: 1 }
          result = resolveDivisionName subscription currentMatch

        result `shouldEqual` Just "Input Division"

      it "uses subscription division in specific tournament mode even when currentMatch is Nothing" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 123, divisionName: "Input Division" }
          result = resolveDivisionName subscription Nothing

        result `shouldEqual` Just "Input Division"

    describe "findDivisionByName" do
      it "finds division by exact name match" do
        let
          divA = createDivisionWith [] []
          divB = (createDivisionWith [] []) { name = "Division B" }
          divisions = [divA, divB]
          result = findDivisionByName "Division B" divisions

        case result of
          Just div -> div.name `shouldEqual` "Division B"
          Nothing -> pure unit

      it "returns Nothing when division not found" do
        let
          divA = createDivisionWith [] []
          divisions = [divA]
          result = findDivisionByName "Division Z" divisions

        result `shouldEqual` Nothing

      it "returns Nothing for empty divisions array" do
        let
          result = findDivisionByName "Division A" []

        result `shouldEqual` Nothing

      it "returns first match when multiple divisions have same name" do
        let
          divA1 = createDivisionWith
            [ createPlayer (PlayerId 1) "Player 1" 1500 ]
            []
          divA2 = createDivisionWith
            [ createPlayer (PlayerId 2) "Player 2" 1500 ]
            []
          divisions = [divA1, divA2]
          result = findDivisionByName "Division A" divisions

        case result of
          Just div -> case div.players of
            [player] -> player.id `shouldEqual` PlayerId 1
            _ -> pure unit
          Nothing -> pure unit

    describe "createTournamentSummary" do
      it "converts Tournament to TournamentSummary" do
        let
          tournament = createMockTournament
          summary = createTournamentSummary tournament

        summary.id `shouldEqual` tournament.id
        summary.name `shouldEqual` tournament.name
        summary.city `shouldEqual` tournament.city
        summary.year `shouldEqual` tournament.year
        summary.lexicon `shouldEqual` tournament.lexicon
        summary.theme `shouldEqual` tournament.theme

      it "sets pollUntil to Nothing" do
        let
          tournament = createMockTournament
          summary = createTournamentSummary tournament

        summary.pollUntil `shouldEqual` Nothing

      it "preserves transparentBackground" do
        let
          tournament = createMockTournament { transparentBackground = true }
          summary = createTournamentSummary tournament

        summary.transparentBackground `shouldEqual` true

    describe "createDivisionScopedData" do
      it "creates DivisionScopedData from TournamentSummary and Division" do
        let
          summary = TestHelpers.createTournamentSummary
          division = createDivisionWith [] []
          result = createDivisionScopedData summary division

        result.tournament `shouldEqual` summary
        result.division `shouldEqual` division

    describe "formatDivisionNotFoundError" do
      it "formats error message with division name" do
        let error = formatDivisionNotFoundError (Just "Division A")
        error `shouldEqual` "Division not found: (Just \"Division A\")"

      it "formats error message when division name is Nothing" do
        let error = formatDivisionNotFoundError Nothing
        error `shouldEqual` "Division not found: Nothing"

    describe "createCurrentMatchInfo" do
      it "extracts CurrentMatchInfo from AdminPanelUpdate" do
        let
          update = createMockAdminPanelUpdate
          matchInfo = createCurrentMatchInfo update

        matchInfo.tournamentId `shouldEqual` TournamentId 123
        matchInfo.round `shouldEqual` 5
        matchInfo.pairingId `shouldEqual` 10
        matchInfo.divisionName `shouldEqual` "Division A"

    describe "shouldProcessAdminUpdate" do
      it "returns true when subscribed to current match" do
        shouldProcessAdminUpdate CurrentMatch `shouldEqual` true

      it "returns false when subscribed to specific tournament" do
        let subscription = SpecificTournament { tournamentId: TournamentId 123, divisionName: "Division A" }
        shouldProcessAdminUpdate subscription `shouldEqual` false

    describe "processTournamentDataResponse" do
      it "returns success when division is found" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 1, divisionName: "Division A" }
          divA = createDivisionWith [] []
          tournament = createMockTournament { divisions = [divA] }
          response = createMockResponse (TournamentId 1) true { data: tournament }
          result = processTournamentDataResponse subscription Nothing response

        case result of
          Right success -> do
            success.divisionName `shouldEqual` "Division A"
            success.divisionScopedData.division.name `shouldEqual` "Division A"
          Left _ -> pure unit

      it "returns error when division is not found" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 1, divisionName: "Division Z" }
          tournament = createMockTournament { divisions = [] }
          response = createMockResponse (TournamentId 1) true { data: tournament }
          result = processTournamentDataResponse subscription Nothing response

        case result of
          Left error -> error `shouldEqual` "Division not found: (Just \"Division Z\")"
          Right _ -> pure unit

      it "uses currentMatch division in current match mode" do
        let
          divCurrent = (createDivisionWith [] []) { name = "Current Division" }
          tournament = createMockTournament { divisions = [divCurrent] }
          response = createMockResponse (TournamentId 1) true { data: tournament }
          currentMatch = Just { round: 1, pairingId: 1, divisionName: "Current Division" }
          result = processTournamentDataResponse CurrentMatch currentMatch response

        case result of
          Right success -> success.divisionName `shouldEqual` "Current Division"
          Left _ -> pure unit

      it "uses subscription division in specific tournament mode" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 1, divisionName: "Input Division" }
          divInput = (createDivisionWith [] []) { name = "Input Division" }
          tournament = createMockTournament { divisions = [divInput] }
          response = createMockResponse (TournamentId 1) true { data: tournament }
          currentMatch = Just { round: 1, pairingId: 1, divisionName: "Current Division" }
          result = processTournamentDataResponse subscription currentMatch response

        case result of
          Right success -> success.divisionName `shouldEqual` "Input Division"
          Left _ -> pure unit

      it "returns theme from tournament data" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 1, divisionName: "Division A" }
          divA = createDivisionWith [] []
          tournament = createMockTournament { divisions = [divA], theme = "scrabble" }
          response = createMockResponse (TournamentId 1) true { data: tournament }
          result = processTournamentDataResponse subscription Nothing response

        case result of
          Right success -> success.theme.name `shouldEqual` "Scrabble"
          Left _ -> pure unit

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- | Create a mock TournamentDataResponse for testing
createMockResponse :: TournamentId -> Boolean -> { data :: Tournament } -> TournamentDataResponse
createMockResponse tournamentId isCurrentMatch overrides =
  { userId: 1
  , tournamentId: tournamentId
  , isCurrentMatch: isCurrentMatch
  , data: overrides.data
  }

-- | Create a mock Tournament for testing
createMockTournament :: Tournament
createMockTournament =
  { id: TournamentId 1
  , name: "Test Tournament"
  , city: "Test City"
  , year: 2025
  , lexicon: "TWL"
  , longFormName: "Test Tournament 2025"
  , dataUrl: "http://example.com"
  , divisions: []
  , theme: "scrabble"
  , transparentBackground: false
  }

-- | Create a mock AdminPanelUpdate for testing
createMockAdminPanelUpdate :: AdminPanelUpdate
createMockAdminPanelUpdate =
  { userId: 1
  , tournamentId: TournamentId 123
  , divisionId: DivisionId 1
  , divisionName: "Division A"
  , round: 5
  , pairingId: 10
  }
