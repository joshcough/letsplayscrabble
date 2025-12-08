module Test.Component.Overlay.CrossTablesPlayerProfileSpec where

import Prelude

import Component.Overlay.CrossTablesPlayerProfile (resolvePlayerId, findPlayerByParam, prepareProfileData, preparePlayerImageData)
import Data.Maybe (Maybe(..))
import Domain.Types (PlayerId(..), PairingId(..), XTId(..))
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Utils.TestHelpers (createPlayer, createCompletedGame, createTournamentSummary, createCrossTablesPlayer, createPlayerWithXtData)

spec :: Spec Unit
spec =
  describe "CrossTablesPlayerProfile" do
    describe "resolvePlayerId" do
      it "extracts player1 ID from current match when playerIdParam is 1" do
        let
          games = [ createCompletedGame { gameId: 1, round: 1, player1: PlayerId 101, player2: PlayerId 102, score1: 400, score2: 350 } ]
          currentMatch = Just { round: 1, pairingId: 1 }
          result = resolvePlayerId 1 currentMatch games

        result `shouldEqual` Just 101

      it "extracts player2 ID from current match when playerIdParam is 2" do
        let
          games = [ createCompletedGame { gameId: 1, round: 1, player1: PlayerId 101, player2: PlayerId 102, score1: 400, score2: 350 } ]
          currentMatch = Just { round: 1, pairingId: 1 }
          result = resolvePlayerId 2 currentMatch games

        result `shouldEqual` Just 102

      it "returns playerIdParam directly when no current match" do
        let
          games = [ createCompletedGame { gameId: 1, round: 1, player1: PlayerId 101, player2: PlayerId 102, score1: 400, score2: 350 } ]
          result = resolvePlayerId 123 Nothing games

        result `shouldEqual` Just 123

      it "returns playerIdParam directly when playerIdParam is not 1 or 2" do
        let
          games = [ createCompletedGame { gameId: 1, round: 1, player1: PlayerId 101, player2: PlayerId 102, score1: 400, score2: 350 } ]
          currentMatch = Just { round: 1, pairingId: 1 }
          result = resolvePlayerId 123 currentMatch games

        result `shouldEqual` Just 123

      it "falls back to playerIdParam when game not found in current match" do
        let
          games = [ createCompletedGame { gameId: 1, round: 1, player1: PlayerId 101, player2: PlayerId 102, score1: 400, score2: 350 } ]
          currentMatch = Just { round: 99, pairingId: 99 }
          result = resolvePlayerId 1 currentMatch games

        result `shouldEqual` Just 1

      it "handles multiple games and finds correct match" do
        let
          games =
            [ createCompletedGame { gameId: 1, round: 1, player1: PlayerId 101, player2: PlayerId 102, score1: 400, score2: 350 }
            , createCompletedGame { gameId: 2, round: 2, player1: PlayerId 103, player2: PlayerId 104, score1: 420, score2: 380 }
            , createCompletedGame { gameId: 3, round: 1, player1: PlayerId 105, player2: PlayerId 106, score1: 390, score2: 360 }
            ]
          currentMatch = Just { round: 2, pairingId: 2 }
          result1 = resolvePlayerId 1 currentMatch games
          result2 = resolvePlayerId 2 currentMatch games

        result1 `shouldEqual` Just 103
        result2 `shouldEqual` Just 104

    describe "findPlayerByParam" do
      it "finds player in current match mode" do
        let
          players =
            [ createPlayer (PlayerId 101) "Alice Smith" 1500
            , createPlayer (PlayerId 102) "Bob Jones" 1450
            ]
          games = [ createCompletedGame { gameId: 1, round: 1, player1: PlayerId 101, player2: PlayerId 102, score1: 400, score2: 350 } ]
          currentMatch = Just { round: 1, pairingId: 1 }
          result = findPlayerByParam 1 currentMatch games players

        case result of
          Just player -> player.name `shouldEqual` "Alice Smith"
          Nothing -> shouldEqual "Found player" "Nothing"

      it "finds player in specific player mode" do
        let
          players =
            [ createPlayer (PlayerId 101) "Alice Smith" 1500
            , createPlayer (PlayerId 102) "Bob Jones" 1450
            ]
          games = []
          result = findPlayerByParam 102 Nothing games players

        case result of
          Just player -> player.name `shouldEqual` "Bob Jones"
          Nothing -> shouldEqual "Found player" "Nothing"

      it "returns Nothing when player not found" do
        let
          players =
            [ createPlayer (PlayerId 101) "Alice Smith" 1500
            , createPlayer (PlayerId 102) "Bob Jones" 1450
            ]
          games = []
          result = findPlayerByParam 999 Nothing games players

        result `shouldEqual` Nothing

    describe "prepareProfileData" do
      it "extracts data from player with complete xtData" do
        let
          xtData =
            { playerid: 12345
            , name: "Test Player"
            , twlrating: Nothing
            , cswrating: Nothing
            , twlranking: Just 42
            , cswranking: Nothing
            , w: Just 15
            , l: Just 10
            , t: Just 2
            , b: Nothing
            , photourl: Nothing
            , city: Just "New York"
            , state: Just "NY"
            , country: Just "USA"
            , tournamentCount: Just 30
            , averageScore: Just 420
            , opponentAverageScore: Just 400
            , results: Nothing
            }
          player =
            { id: PlayerId 1
            , name: "Test Player"
            , seed: 1
            , initialRating: 1500
            , ratingsHistory: [1520, 1540]
            , xtid: Just (XTId 12345)
            , xtData: Just xtData
            , photo: Nothing
            }
          result = prepareProfileData player

        result.rating `shouldEqual` Just 1540
        result.ranking `shouldEqual` Just 42
        result.tournamentCount `shouldEqual` Just 30
        result.averageScore `shouldEqual` Just 420
        result.opponentAvgScore `shouldEqual` Just 400
        result.wins `shouldEqual` Just 15
        result.losses `shouldEqual` Just 10
        result.ties `shouldEqual` Just 2

      it "handles player without xtData" do
        let
          player = createPlayer (PlayerId 1) "Test Player" 1500
          result = prepareProfileData player

        result.rating `shouldEqual` Just 1500
        result.ranking `shouldEqual` Nothing
        result.tournamentCount `shouldEqual` Nothing
        result.averageScore `shouldEqual` Nothing
        result.opponentAvgScore `shouldEqual` Nothing
        result.wins `shouldEqual` Nothing
        result.losses `shouldEqual` Nothing
        result.ties `shouldEqual` Nothing

      it "handles player with partial xtData" do
        let
          xtData = createCrossTablesPlayer
            { playerId: 12345
            , name: "Test Player"
            , twlranking: Just 100
            , wins: Nothing
            , losses: Nothing
            , ties: Nothing
            , tournamentCount: Just 5
            }
          player = createPlayerWithXtData
            { playerId: PlayerId 1
            , name: "Test Player"
            , initialRating: 1500
            , xtData: xtData
            }
          result = prepareProfileData player

        result.rating `shouldEqual` Just 1500
        result.ranking `shouldEqual` Just 100
        result.tournamentCount `shouldEqual` Just 5
        result.wins `shouldEqual` Nothing

    describe "preparePlayerImageData" do
      it "uses xt photourl when available" do
        let
          xtData =
            { playerid: 12345
            , name: "Test Player"
            , twlrating: Nothing
            , cswrating: Nothing
            , twlranking: Nothing
            , cswranking: Nothing
            , w: Nothing
            , l: Nothing
            , t: Nothing
            , b: Nothing
            , photourl: Just "https://cross-tables.com/photo.jpg"
            , city: Nothing
            , state: Nothing
            , country: Nothing
            , tournamentCount: Nothing
            , averageScore: Nothing
            , opponentAverageScore: Nothing
            , results: Nothing
            }
          player = createPlayerWithXtData
            { playerId: PlayerId 1
            , name: "Test Player"
            , initialRating: 1500
            , xtData: xtData
            }
          tournament = createTournamentSummary
          result = preparePlayerImageData player tournament

        result.imageUrl `shouldEqual` "https://cross-tables.com/photo.jpg"
        result.altText `shouldEqual` "Test Player"

      it "sets correct alt text" do
        let
          player = createPlayer (PlayerId 1) "Alice Smith" 1500
          tournament = createTournamentSummary
          result = preparePlayerImageData player tournament

        result.altText `shouldEqual` "Alice Smith"
