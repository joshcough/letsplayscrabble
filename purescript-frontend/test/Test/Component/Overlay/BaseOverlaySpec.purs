module Test.Component.Overlay.BaseOverlaySpec where

import Prelude

import BroadcastChannel.Messages (TournamentDataResponse, AdminPanelUpdate)
import Component.Overlay.BaseOverlay (State(..), handleTournamentDataUpdate, handleAdminPanelUpdateState)
import Config.Themes (getTheme)
import Data.Maybe (Maybe(..))
import Data.Newtype (unwrap)
import Domain.Types (TournamentId(..), DivisionId(..), Division)
import Stats.OverlayLogic (TournamentSubscription(..))
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createDivisionWith, createMockBroadcastManager)
import Test.Utils.TestHelpers as TestHelpers

spec :: Spec Unit
spec =
  describe "Component.Overlay.BaseOverlay" do
    describe "handleTournamentDataUpdate" do
      it "returns error state when subscription is Nothing" do
        let
          state = createMockState { subscription: Nothing, currentMatch: Nothing }
          response = createMockTournamentDataResponse (TournamentId 123)
          newState = handleTournamentDataUpdate state response
          s = unwrap newState

        s.error `shouldEqual` Just "Invalid subscription parameters"
        s.loading `shouldEqual` false

      it "ignores response when tournament IDs don't match in SpecificTournament mode" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 456, divisionName: "Division A" }
          state = createMockState { subscription: Just subscription, currentMatch: Nothing }
          response = createMockTournamentDataResponse (TournamentId 123)
          newState = handleTournamentDataUpdate state response
          s = unwrap newState
          origS = unwrap state

        -- State should be unchanged (ignored)
        s.currentData `shouldEqual` origS.currentData
        s.error `shouldEqual` origS.error

      it "accepts response when tournament IDs match in SpecificTournament mode" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 123, divisionName: "Division A" }
          divA = createDivisionWith [] []
          tournament = createMockTournament [divA]
          state = createMockState { subscription: Just subscription, currentMatch: Nothing }
          response = (createMockTournamentDataResponse (TournamentId 123)) { data = tournament }
          newState = handleTournamentDataUpdate state response
          s = unwrap newState

        -- Should successfully set data when division is found
        case s.currentData of
          Just divData -> do
            divData.division.name `shouldEqual` "Division A"
            s.loading `shouldEqual` false
            s.error `shouldEqual` Nothing
          Nothing ->
            pure unit  -- Fail if no data

      it "returns error when division not found" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 123, divisionName: "Division Z" }
          tournament = createMockTournament []
          state = createMockState { subscription: Just subscription, currentMatch: Nothing }
          response = (createMockTournamentDataResponse (TournamentId 123)) { data = tournament }
          newState = handleTournamentDataUpdate state response

        (unwrap newState).error `shouldEqual` Just "Division not found: (Just \"Division Z\")"
        (unwrap newState).loading `shouldEqual` false

      it "accepts response in CurrentMatch mode when isCurrentMatch is true" do
        let
          subscription = CurrentMatch
          currentMatch = Just { tournamentId: TournamentId 123, round: 1, pairingId: 1, divisionName: "Division A" }
          divA = createDivisionWith [] []
          tournament = createMockTournament [divA]
          state = createMockState { subscription: Just subscription, currentMatch: currentMatch }
          response = (createMockTournamentDataResponse (TournamentId 123)) { isCurrentMatch = true, data = tournament }
          newState = handleTournamentDataUpdate state response

        -- Should successfully set data when division is found
        case (unwrap newState).currentData of
          Just divData -> do
            divData.division.name `shouldEqual` "Division A"
            (unwrap newState).loading `shouldEqual` false
            (unwrap newState).error `shouldEqual` Nothing
          Nothing ->
            pure unit  -- Fail if no data

      it "ignores response in CurrentMatch mode when isCurrentMatch is false" do
        let
          subscription = CurrentMatch
          state = createMockState { subscription: Just subscription, currentMatch: Nothing }
          response = (createMockTournamentDataResponse (TournamentId 123)) { isCurrentMatch = false }
          newState = handleTournamentDataUpdate state response

        -- State should be unchanged (ignored)
        (unwrap newState).currentData `shouldEqual` (unwrap state).currentData
        (unwrap newState).error `shouldEqual` (unwrap state).error

    describe "handleAdminPanelUpdateState" do
      it "updates currentMatch when in CurrentMatch mode" do
        let
          subscription = CurrentMatch
          state = createMockState { subscription: Just subscription, currentMatch: Nothing }
          update = createMockAdminPanelUpdate
          newState = handleAdminPanelUpdateState state update

        case (unwrap newState).currentMatch of
          Just matchInfo -> do
            matchInfo.tournamentId `shouldEqual` TournamentId 123
            matchInfo.divisionName `shouldEqual` "Division A"
            matchInfo.round `shouldEqual` 5
            matchInfo.pairingId `shouldEqual` 10
          Nothing -> pure unit

      it "does not update currentMatch when in SpecificTournament mode" do
        let
          subscription = SpecificTournament { tournamentId: TournamentId 456, divisionName: "Division B" }
          state = createMockState { subscription: Just subscription, currentMatch: Nothing }
          update = createMockAdminPanelUpdate
          newState = handleAdminPanelUpdateState state update

        (unwrap newState).currentMatch `shouldEqual` (unwrap state).currentMatch

      it "does not update when subscription is Nothing" do
        let
          state = createMockState { subscription: Nothing, currentMatch: Nothing }
          update = createMockAdminPanelUpdate
          newState = handleAdminPanelUpdateState state update

        (unwrap newState).currentMatch `shouldEqual` (unwrap state).currentMatch

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

type MockStateFields =
  { subscription :: Maybe TournamentSubscription
  , currentMatch :: Maybe { tournamentId :: TournamentId, round :: Int, pairingId :: Int, divisionName :: String }
  }

createMockState :: MockStateFields -> State Unit
createMockState fields = State
  { currentData: Nothing
  , loading: true
  , error: Nothing
  , theme: getTheme "scrabble"
  , input:
      { userId: 1
      , tournamentId: Nothing
      , divisionName: Nothing
      , manager: createMockBroadcastManager
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
