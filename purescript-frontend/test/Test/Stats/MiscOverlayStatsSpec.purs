module Test.Stats.MiscOverlayStatsSpec where

import Prelude

import Data.Maybe (Maybe(..))
import Domain.Types (Game, PlayerId(..), GameId(..))
import Stats.MiscOverlayStats (formatRecord, getPlaceOrSeedLabel, formatUnderCamRecord, formatFullUnderCam, formatUnderCamNoSeed, formatUnderCamWithRating, formatBestOf7, getRecentGamesForPlayer, gameResult, formatGameHistorySimple, getOpponentName, calculateAverageScoreRank, calculateAverageOpponentScoreRank)
import Stats.PlayerStats (RankedPlayerStats)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Data.Array (length)

spec :: Spec Unit
spec =
  describe "Stats.MiscOverlayStats" do
    describe "formatRecord" do
      it "formats W-L record" do
        let player = mockPlayer { wins = 10, losses = 5, ties = 0 }
        formatRecord player `shouldEqual` "10-5"

      it "includes ties when present" do
        let player = mockPlayer { wins = 10, losses = 5, ties = 2 }
        formatRecord player `shouldEqual` "10-5-2"

      it "handles zero ties" do
        formatRecord mockPlayer `shouldEqual` "0-0"

    describe "getPlaceOrSeedLabel" do
      it "returns 'Seed' when no games played" do
        getPlaceOrSeedLabel mockPlayer `shouldEqual` "Seed"

      it "returns 'Place' when games played" do
        let player = mockPlayer { wins = 5, losses = 2 }
        getPlaceOrSeedLabel player `shouldEqual` "Place"

      it "returns 'Place' when only losses" do
        let player = mockPlayer { losses = 5 }
        getPlaceOrSeedLabel player `shouldEqual` "Place"

    describe "formatUnderCamRecord" do
      it "formats with positive spread" do
        let player = mockPlayer { wins = 10, losses = 5, spread = 250 }
        formatUnderCamRecord player `shouldEqual` "10-5 +250"

      it "formats with negative spread" do
        let player = mockPlayer { wins = 5, losses = 10, spread = -150 }
        formatUnderCamRecord player `shouldEqual` "5-10 -150"

    describe "formatFullUnderCam" do
      it "formats with seed label" do
        let player = mockPlayer { rank = 3, seed = 5 }
        formatFullUnderCam player `shouldEqual` "0-0 0 | 3rd Seed"

      it "formats with place label including seed" do
        let player = mockPlayer { wins = 10, losses = 5, rank = 2, seed = 7, spread = 150 }
        formatFullUnderCam player `shouldEqual` "10-5 +150 | 2nd Place (7th Seed)"

    describe "formatUnderCamNoSeed" do
      it "formats without seed info" do
        let player = mockPlayer { wins = 10, losses = 5, rank = 1, spread = 200 }
        formatUnderCamNoSeed player `shouldEqual` "10-5 +200 | 1st Place"

    describe "formatUnderCamWithRating" do
      it "includes rating" do
        let player = mockPlayer { wins = 10, losses = 5, rank = 1, spread = 200, currentRating = 1650 }
        formatUnderCamWithRating player `shouldEqual` "10-5 +200 | 1st Place | Rating 1650"

    describe "formatBestOf7" do
      it "formats best of 7 record" do
        let player = mockPlayer { wins = 4, losses = 3, spread = 50 }
        formatBestOf7 player `shouldEqual` "Best of 7 Record: 4-3 +50"

    describe "getRecentGamesForPlayer" do
      it "returns most recent games first" do
        let games = [mockGame 1 true, mockGame 2 true, mockGame 3 true]
        let recentGames = getRecentGamesForPlayer (PlayerId 1) games 2
        length recentGames `shouldEqual` 2

      it "filters out games without scores" do
        let games = [mockGame 1 true, mockGame 2 false, mockGame 3 true]
        let recentGames = getRecentGamesForPlayer (PlayerId 1) games 5
        length recentGames `shouldEqual` 2

    describe "gameResult" do
      it "returns 'W' for win" do
        let game = { id: GameId 1, isBye: false, player1Id: PlayerId 1, player2Id: PlayerId 2, player1Score: Just 450, player2Score: Just 400, roundNumber: 1, pairingId: Nothing }
        gameResult (PlayerId 1) game `shouldEqual` "W"

      it "returns 'L' for loss" do
        let game = { id: GameId 2, isBye: false, player1Id: PlayerId 1, player2Id: PlayerId 2, player1Score: Just 350, player2Score: Just 400, roundNumber: 1, pairingId: Nothing }
        gameResult (PlayerId 1) game `shouldEqual` "L"

      it "returns 'T' for tie" do
        let game = { id: GameId 3, isBye: false, player1Id: PlayerId 1, player2Id: PlayerId 2, player1Score: Just 400, player2Score: Just 400, roundNumber: 1, pairingId: Nothing }
        gameResult (PlayerId 1) game `shouldEqual` "T"

    describe "formatGameHistorySimple" do
      it "formats game history" do
        let games = [mockGameWithScore 1 450 400, mockGameWithScore 2 350 450]
        let result = formatGameHistorySimple (PlayerId 1) games
        result `shouldEqual` "Last 2: W-L"

      it "handles no games" do
        formatGameHistorySimple (PlayerId 1) [] `shouldEqual` "No games"

    describe "getOpponentName" do
      it "finds opponent name" do
        let game = mockGame 1 true
        let players = [mockPlayer { playerId = PlayerId 1, name = "Player 1" }, mockPlayer { playerId = PlayerId 2, name = "Player 2" }]
        getOpponentName (PlayerId 1) game players `shouldEqual` "Player 2"

      it "returns 'Unknown' when opponent not found" do
        let game = mockGame 1 true
        let players = [mockPlayer]
        getOpponentName (PlayerId 1) game players `shouldEqual` "Unknown"

    describe "calculateAverageScoreRank" do
      it "ranks by average score descending" do
        let players =
              [ mockPlayer { playerId = PlayerId 1, averageScore = 400.0 }
              , mockPlayer { playerId = PlayerId 2, averageScore = 450.0 }
              , mockPlayer { playerId = PlayerId 3, averageScore = 425.0 }
              ]
        calculateAverageScoreRank players (mockPlayer { playerId = PlayerId 1, averageScore = 400.0 }) `shouldEqual` 3
        calculateAverageScoreRank players (mockPlayer { playerId = PlayerId 2, averageScore = 450.0 }) `shouldEqual` 1
        calculateAverageScoreRank players (mockPlayer { playerId = PlayerId 3, averageScore = 425.0 }) `shouldEqual` 2

    describe "calculateAverageOpponentScoreRank" do
      it "ranks by average opponent score ascending (lower is better)" do
        let players =
              [ mockPlayer { playerId = PlayerId 1, averageOpponentScore = 400.0 }
              , mockPlayer { playerId = PlayerId 2, averageOpponentScore = 450.0 }
              , mockPlayer { playerId = PlayerId 3, averageOpponentScore = 425.0 }
              ]
        calculateAverageOpponentScoreRank players (mockPlayer { playerId = PlayerId 1, averageOpponentScore = 400.0 }) `shouldEqual` 1
        calculateAverageOpponentScoreRank players (mockPlayer { playerId = PlayerId 2, averageOpponentScore = 450.0 }) `shouldEqual` 3
        calculateAverageOpponentScoreRank players (mockPlayer { playerId = PlayerId 3, averageOpponentScore = 425.0 }) `shouldEqual` 2

-- Helper functions
mkPlayer :: PlayerId -> String -> Int -> Int -> Int -> Int -> Int -> Int -> Number -> Number -> Int -> Int -> Int -> Int -> Maybe String -> Maybe String -> RankedPlayerStats
mkPlayer playerId name rank seed wins losses ties spread averageScore averageOpponentScore highScore initialRating currentRating ratingDiff photo xtPhotoUrl =
  { playerId
  , name
  , rank
  , seed
  , wins
  , losses
  , ties
  , spread
  , averageScore
  , averageOpponentScore
  , highScore
  , initialRating
  , currentRating
  , ratingDiff
  , photo
  , xtPhotoUrl
  }

-- Default player for simple tests
mockPlayer :: RankedPlayerStats
mockPlayer = mkPlayer (PlayerId 1) "Test Player" 1 1 0 0 0 0 400.0 400.0 500 1500 1500 0 Nothing Nothing

-- Player with specific overrides
mockPlayerWith :: (RankedPlayerStats -> RankedPlayerStats) -> RankedPlayerStats
mockPlayerWith f = f mockPlayer

mockGame :: Int -> Boolean -> Game
mockGame round hasScores =
  { id: GameId round
  , player1Id: PlayerId 1
  , player2Id: PlayerId 2
  , player1Score: if hasScores then Just 400 else Nothing
  , player2Score: if hasScores then Just 380 else Nothing
  , roundNumber: round
  , isBye: false
  , pairingId: Nothing
  }

mockGameWithScore :: Int -> Int -> Int -> Game
mockGameWithScore round p1Score p2Score =
  { id: GameId round
  , player1Id: PlayerId 1
  , player2Id: PlayerId 2
  , player1Score: Just p1Score
  , player2Score: Just p2Score
  , roundNumber: round
  , isBye: false
  , pairingId: Nothing
  }
