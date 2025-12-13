module Test.Component.Overlay.BaseOverlaySpec where

import Prelude

import BroadcastChannel.Messages (TournamentDataResponse, AdminPanelUpdate)
import Component.Overlay.BaseOverlay (State, handleTournamentDataUpdate, handleAdminPanelUpdateState)
import Config.Themes (getTheme)
import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..), DivisionId(..), Division)
import Stats.OverlayLogic (TournamentSubscription(..))
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createDivisionWith)

spec :: Spec Unit
spec =
  describe "Component.Overlay.BaseOverlay" do
    describe "handleTournamentDataUpdate" do
      it "ignores response when tournament IDs don't match and subscription is CurrentMatch" do
        let
          subscription = CurrentMatch
          state = createMockState { subscription: subscription, currentMatch: Nothing }
          response = (createMockTournamentDataResponse (TournamentId 123)) { isCurrentMatch = false }
          newState = handleTournamentDataUpdate response state

        -- Should be unchanged (ignored)
        newState.currentData `shouldEqual` state.currentData
        newState.error `shouldEqual` state.error

      it "ignores response when tournament IDs don't match in SpecificTournament mode" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 456, divisionName: "Division A" }
          state = createMockState { subscription: subscription, currentMatch: Nothing }
          response = createMockTournamentDataResponse (TournamentId 123)
          newState = handleTournamentDataUpdate response state

        -- State should be unchanged (ignored)
        newState.currentData `shouldEqual` state.currentData
        newState.error `shouldEqual` state.error

      it "accepts response when tournament IDs match in SpecificTournament mode" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 123, divisionName: "Division A" }
          divA = createDivisionWith [] []
          tournament = createMockTournament [divA]
          state = createMockState { subscription: subscription, currentMatch: Nothing }
          response = (createMockTournamentDataResponse (TournamentId 123)) { data = tournament }
          newState = handleTournamentDataUpdate response state

        -- Should successfully set data when division is found
        case newState.currentData of
          Just divData -> do
            divData.division.name `shouldEqual` "Division A"
            newState.loading `shouldEqual` false
            newState.error `shouldEqual` Nothing
          Nothing ->
            pure unit  -- Fail if no data

      it "returns error when division not found" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 123, divisionName: "Division Z" }
          tournament = createMockTournament []
          state = createMockState { subscription: subscription, currentMatch: Nothing }
          response = (createMockTournamentDataResponse (TournamentId 123)) { data = tournament }
          newState = handleTournamentDataUpdate response state

        newState.error `shouldEqual` Just "Division not found: (Just \"Division Z\")"
        newState.loading `shouldEqual` false

      it "accepts response in CurrentMatch mode when isCurrentMatch is true" do
        let
          subscription = CurrentMatch
          currentMatch = Just { tournamentId: TournamentId 123, round: 1, pairingId: 1, divisionName: "Division A" }
          divA = createDivisionWith [] []
          tournament = createMockTournament [divA]
          state = createMockState { subscription: subscription, currentMatch: currentMatch }
          response = (createMockTournamentDataResponse (TournamentId 123)) { isCurrentMatch = true, data = tournament }
          newState = handleTournamentDataUpdate response state

        -- Should successfully set data when division is found
        case newState.currentData of
          Just divData -> do
            divData.division.name `shouldEqual` "Division A"
            newState.loading `shouldEqual` false
            newState.error `shouldEqual` Nothing
          Nothing ->
            pure unit  -- Fail if no data

      it "ignores response in CurrentMatch mode when isCurrentMatch is false" do
        let
          subscription = CurrentMatch
          state = createMockState { subscription: subscription, currentMatch: Nothing }
          response = (createMockTournamentDataResponse (TournamentId 123)) { isCurrentMatch = false }
          newState = handleTournamentDataUpdate response state

        -- State should be unchanged (ignored)
        newState.currentData `shouldEqual` state.currentData
        newState.error `shouldEqual` state.error

    describe "handleAdminPanelUpdateState" do
      it "updates currentMatch when in CurrentMatch mode" do
        let
          subscription = CurrentMatch
          state = createMockState { subscription: subscription, currentMatch: Nothing }
          update = createMockAdminPanelUpdate
          newState = handleAdminPanelUpdateState update state

        case newState.currentMatch of
          Just matchInfo -> do
            matchInfo.tournamentId `shouldEqual` TournamentId 123
            matchInfo.divisionName `shouldEqual` "Division A"
            matchInfo.round `shouldEqual` 5
            matchInfo.pairingId `shouldEqual` 10
          Nothing -> pure unit

      it "does not update currentMatch when in SpecificTournament mode" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 456, divisionName: "Division B" }
          state = createMockState { subscription: subscription, currentMatch: Nothing }
          update = createMockAdminPanelUpdate
          newState = handleAdminPanelUpdateState update state

        newState.currentMatch `shouldEqual` state.currentMatch

      it "does not update when in SpecificTournament mode (different tournament)" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 999, divisionName: "Division C" }
          state = createMockState { subscription: subscription, currentMatch: Nothing }
          update = createMockAdminPanelUpdate
          newState = handleAdminPanelUpdateState update state

        newState.currentMatch `shouldEqual` state.currentMatch

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

type MockStateFields =
  { subscription :: TournamentSubscription
  , currentMatch :: Maybe { tournamentId :: TournamentId, round :: Int, pairingId :: Int, divisionName :: String }
  }

createMockState :: MockStateFields -> State Unit
createMockState fields =
  { currentData: Nothing
  , loading: true
  , error: Nothing
  , theme: getTheme "scrabble"
  , input:
      { userId: 1
      , subscription: fields.subscription
      , extra: unit
      }
  , subscription: fields.subscription
  , currentMatch: fields.currentMatch
  , extra: unit
  }

type MockTournament =
  { id :: TournamentId
  , name :: String
  , city :: String
  , year :: Int
  , lexicon :: String
  , longFormName :: String
  , dataUrl :: String
  , divisions :: Array Division
  , theme :: String
  , transparentBackground :: Boolean
  }

createMockTournament :: Array Division -> MockTournament
createMockTournament divisions =
  { id: TournamentId 1
  , name: "Test Tournament"
  , city: "Test City"
  , year: 2025
  , lexicon: "TWL"
  , longFormName: "Test Tournament 2025"
  , dataUrl: "http://example.com"
  , divisions: divisions
  , theme: "scrabble"
  , transparentBackground: false
  }

-- Helper to create a response with defaults
createMockTournamentDataResponse :: TournamentId -> TournamentDataResponse
createMockTournamentDataResponse tid =
  { userId: 1
  , tournamentId: tid
  , isCurrentMatch: false
  , data: createMockTournament []
  }

createMockAdminPanelUpdate :: AdminPanelUpdate
createMockAdminPanelUpdate =
  { userId: 1
  , tournamentId: TournamentId 123
  , divisionId: DivisionId 1
  , divisionName: "Division A"
  , round: 5
  , pairingId: 10
  }
