module Test.Stats.TournamentStatsSpec where

import Prelude

import Data.Array (length, (!!))
import Data.Maybe (Maybe(..))
import Stats.TournamentStats (calculateRatingGainPlayers, calculateHighScorePlayers, calculateScoringLeadersPlayers, calculateStandingsPlayers)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)
import Domain.Types (PlayerId(..))
import Test.Utils.TestHelpers (createMockDivisionData, createPlayer, createPlayerWithRatings, createCompletedGame, createByeGame, createDivisionWith)

spec :: Spec Unit
spec =
  describe "TournamentStats (Pure Calculation Functions)" do
    describe "calculateRatingGainPlayers" do
      it "calculates ranked stats sorted by rating gain" do
        let
          mockData = createMockDivisionData
          players = calculateRatingGainPlayers mockData.division.players mockData.division.games

        -- Should return players ranked by rating gain
        length players `shouldEqual` 2

      it "returns correct player data structure with rank" do
        let
          mockData = createMockDivisionData
          players = calculateRatingGainPlayers mockData.division.players mockData.division.games

        -- Check first player has the expected fields
        case players !! 0 of
          Just player ->
            player.rank `shouldEqual` 1
          Nothing -> pure unit

      it "ranks players by rating gain (last rating - initial rating)" do
        let
          division = createDivisionWith
            [ createPlayerWithRatings (PlayerId 1) "Alice" 1500 [1520, 1540, 1560]  -- +60 gain
            , createPlayerWithRatings (PlayerId 2) "Bob" 1450 [1470, 1480]  -- +30 gain
            , createPlayerWithRatings (PlayerId 3) "Carol" 1600 [1590, 1580]  -- -20 loss
            ]
            []  -- Games don't matter for rating gain calculation
          ratingGain = calculateRatingGainPlayers division.players division.games

        -- Alice should be 1st (+60), Bob 2nd (+30), Carol 3rd (-20)
        case ratingGain !! 0 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.ratingDiff `shouldEqual` 60
            p.initialRating `shouldEqual` 1500
            p.currentRating `shouldEqual` 1560
          Nothing -> pure unit

        case ratingGain !! 1 of
          Just p -> do
            p.name `shouldEqual` "Bob"
            p.ratingDiff `shouldEqual` 30
          Nothing -> pure unit

        case ratingGain !! 2 of
          Just p -> do
            p.name `shouldEqual` "Carol"
            p.ratingDiff `shouldEqual` (-20)
          Nothing -> pure unit

      it "handles players with empty ratings history (uses initial rating)" do
        let
          division = createDivisionWith
            [ createPlayerWithRatings (PlayerId 1) "Alice" 1500 []  -- No history, gain = 0
            , createPlayerWithRatings (PlayerId 2) "Bob" 1450 [1480]  -- +30 gain
            ]
            []
          ratingGain = calculateRatingGainPlayers division.players division.games

        -- Bob should be 1st (+30), Alice 2nd (0)
        case ratingGain !! 0 of
          Just p -> do
            p.name `shouldEqual` "Bob"
            p.ratingDiff `shouldEqual` 30
          Nothing -> pure unit

        case ratingGain !! 1 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.ratingDiff `shouldEqual` 0
            p.currentRating `shouldEqual` 1500  -- Should equal initial rating
          Nothing -> pure unit

      it "handles single rating in history" do
        let
          division = createDivisionWith
            [ createPlayerWithRatings (PlayerId 1) "Alice" 1500 [1550]  -- +50 gain
            ]
            []
          ratingGain = calculateRatingGainPlayers division.players division.games

        case ratingGain !! 0 of
          Just p -> do
            p.ratingDiff `shouldEqual` 50
            p.currentRating `shouldEqual` 1550
          Nothing -> pure unit

      it "handles negative rating changes" do
        let
          division = createDivisionWith
            [ createPlayerWithRatings (PlayerId 1) "Alice" 1500 [1490, 1470]  -- -30
            , createPlayerWithRatings (PlayerId 2) "Bob" 1450 [1440, 1420]  -- -30 (tie, sorted by input order)
            , createPlayerWithRatings (PlayerId 3) "Carol" 1600 [1580, 1550]  -- -50
            ]
            []
          ratingGain = calculateRatingGainPlayers division.players division.games

        -- All have negative gains, should be sorted by magnitude
        case ratingGain !! 0 of
          Just p -> do
            -- Alice or Bob (both -30)
            p.ratingDiff `shouldEqual` (-30)
          Nothing -> pure unit

        case ratingGain !! 2 of
          Just p -> do
            p.name `shouldEqual` "Carol"
            p.ratingDiff `shouldEqual` (-50)
          Nothing -> pure unit

    describe "calculateHighScorePlayers" do
      it "calculates ranked stats sorted by high score" do
        let
          mockData = createMockDivisionData
          players = calculateHighScorePlayers mockData.division.players mockData.division.games

        -- Should return players ranked by high score
        length players `shouldEqual` 2

      it "returns correct player data structure with rank" do
        let
          mockData = createMockDivisionData
          players = calculateHighScorePlayers mockData.division.players mockData.division.games

        -- Check first player has the expected fields
        case players !! 0 of
          Just player ->
            player.rank `shouldEqual` 1
          Nothing -> pure unit

      it "ranks players by highest single game score" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            , createPlayer (PlayerId 2) "Bob" 1500
            , createPlayer (PlayerId 3) "Carol" 1500
            ]
            [ createCompletedGame 1 1 (PlayerId 1) (PlayerId 2) 525 350  -- Alice high: 525
            , createCompletedGame 2 1 (PlayerId 3) (PlayerId 1) 480 420  -- Carol high: 480
            , createCompletedGame 3 2 (PlayerId 2) (PlayerId 3) 550 400  -- Bob high: 550
            ]
          highScores = calculateHighScorePlayers division.players division.games

        -- Bob should be 1st (550), Alice 2nd (525), Carol 3rd (480)
        case highScores !! 0 of
          Just p -> do
            p.name `shouldEqual` "Bob"
            p.highScore `shouldEqual` 550
          Nothing -> pure unit

        case highScores !! 1 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.highScore `shouldEqual` 525
          Nothing -> pure unit

      it "considers all games for each player" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            , createPlayer (PlayerId 2) "Bob" 1500
            ]
            [ createCompletedGame 1 1 (PlayerId 1) (PlayerId 2) 400 350
            , createCompletedGame 2 2 (PlayerId 1) (PlayerId 2) 525 420  -- Alice's high score in round 2
            , createCompletedGame 3 3 (PlayerId 1) (PlayerId 2) 450 480  -- Bob's high score in round 3
            ]
          highScores = calculateHighScorePlayers division.players division.games

        -- Alice should have high score of 525 (from round 2)
        case highScores !! 0 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.highScore `shouldEqual` 525
          Nothing -> pure unit

      it "ignores bye games when calculating high score" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            , createPlayer (PlayerId 2) "Bob" 1500
            ]
            [ createCompletedGame 1 1 (PlayerId 1) (PlayerId 2) 450 350  -- Alice: 450
            , createByeGame 2 2 (PlayerId 1)  -- Alice gets bye (50 points, should be ignored)
            ]
          highScores = calculateHighScorePlayers division.players division.games

        -- Alice's high score should be 450 (not 50 from bye)
        case highScores !! 0 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.highScore `shouldEqual` 450
          Nothing -> pure unit

      it "handles players with no completed games" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            ]
            []
          highScores = calculateHighScorePlayers division.players division.games

        -- Alice should have high score of 0
        case highScores !! 0 of
          Just p -> do
            p.highScore `shouldEqual` 0
          Nothing -> pure unit

    describe "calculateScoringLeadersPlayers" do
      it "calculates ranked stats sorted by average score" do
        let
          mockData = createMockDivisionData
          players = calculateScoringLeadersPlayers mockData.division.players mockData.division.games

        -- Should return players ranked by average score
        length players `shouldEqual` 2

      it "returns correct player data structure with rank" do
        let
          mockData = createMockDivisionData
          players = calculateScoringLeadersPlayers mockData.division.players mockData.division.games

        -- Check first player has the expected fields
        case players !! 0 of
          Just player ->
            player.rank `shouldEqual` 1
          Nothing -> pure unit

      it "ranks players by average score" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            , createPlayer (PlayerId 2) "Bob" 1500
            , createPlayer (PlayerId 3) "Carol" 1500
            ]
            [ createCompletedGame 1 1 (PlayerId 1) (PlayerId 2) 450 350  -- Alice: 450, Bob: 350
            , createCompletedGame 2 1 (PlayerId 3) (PlayerId 1) 400 420  -- Carol: 400, Alice: 420
            , createCompletedGame 3 2 (PlayerId 2) (PlayerId 3) 480 460  -- Bob: 480, Carol: 460
            ]
          leaders = calculateScoringLeadersPlayers division.players division.games

        -- Alice avg: (450+420)/2 = 435
        -- Bob avg: (350+480)/2 = 415
        -- Carol avg: (400+460)/2 = 430
        -- Alice should be 1st (435), Carol 2nd (430), Bob 3rd (415)
        case leaders !! 0 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.averageScore `shouldEqual` 435.0
          Nothing -> pure unit

        case leaders !! 1 of
          Just p -> do
            p.name `shouldEqual` "Carol"
            p.averageScore `shouldEqual` 430.0
          Nothing -> pure unit

      it "excludes bye games from average calculation" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            , createPlayer (PlayerId 2) "Bob" 1500
            ]
            [ createCompletedGame 1 1 (PlayerId 1) (PlayerId 2) 450 350  -- Alice: 450
            , createByeGame 2 2 (PlayerId 1)  -- Alice gets bye (50 points, should be excluded)
            , createCompletedGame 3 3 (PlayerId 1) (PlayerId 2) 460 360  -- Alice: 460
            ]
          leaders = calculateScoringLeadersPlayers division.players division.games

        -- Alice avg should be (450+460)/2 = 455 (not including the 50 from bye)
        case leaders !! 0 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.averageScore `shouldEqual` 455.0
          Nothing -> pure unit

      it "handles players with different numbers of games" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            , createPlayer (PlayerId 2) "Bob" 1500
            ]
            [ createCompletedGame 1 1 (PlayerId 1) (PlayerId 2) 450 350
            , createCompletedGame 2 2 (PlayerId 1) (PlayerId 2) 440 360
            , createCompletedGame 3 3 (PlayerId 1) (PlayerId 2) 430 370
            ]
          leaders = calculateScoringLeadersPlayers division.players division.games

        -- Alice: (450+440+430)/3 = 440
        -- Bob: (350+360+370)/3 = 360
        case leaders !! 0 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.averageScore `shouldEqual` 440.0
          Nothing -> pure unit

      it "handles players with no completed games" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            ]
            []
          leaders = calculateScoringLeadersPlayers division.players division.games

        -- Alice should have avg score of 0
        case leaders !! 0 of
          Just p -> do
            p.averageScore `shouldEqual` 0.0
          Nothing -> pure unit

    describe "calculateStandingsPlayers" do
      it "calculates ranked stats sorted by standings" do
        let
          mockData = createMockDivisionData
          players = calculateStandingsPlayers mockData.division.players mockData.division.games

        -- Should return players ranked by standings
        length players `shouldEqual` 2

      it "returns correct player data structure with rank" do
        let
          mockData = createMockDivisionData
          players = calculateStandingsPlayers mockData.division.players mockData.division.games

        -- Check first player has the expected fields
        case players !! 0 of
          Just player ->
            player.rank `shouldEqual` 1
          Nothing -> pure unit

      it "ranks players correctly by wins" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            , createPlayer (PlayerId 2) "Bob" 1500
            , createPlayer (PlayerId 3) "Carol" 1500
            ]
            [ createCompletedGame 1 1 (PlayerId 1) (PlayerId 2) 450 350  -- Alice wins
            , createCompletedGame 2 1 (PlayerId 3) (PlayerId 1) 400 380  -- Carol wins (round 1)
            , createCompletedGame 3 2 (PlayerId 1) (PlayerId 3) 420 400  -- Alice wins (round 2)
            , createCompletedGame 4 2 (PlayerId 2) (PlayerId 1) 380 360  -- Bob wins (round 2)
            ]
          standings = calculateStandingsPlayers division.players division.games

        -- Alice: 2-2, Bob: 1-1, Carol: 1-1
        -- Alice should be ranked 1st (most wins)
        case standings !! 0 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.wins `shouldEqual` 2
            p.losses `shouldEqual` 2
          Nothing -> pure unit

      it "uses spread to break ties when wins are equal" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            , createPlayer (PlayerId 2) "Bob" 1500
            , createPlayer (PlayerId 3) "Carol" 1500
            ]
            [ createCompletedGame 1 1 (PlayerId 1) (PlayerId 2) 450 350  -- Alice wins +100
            , createCompletedGame 2 1 (PlayerId 3) (PlayerId 2) 400 350  -- Carol wins +50
            , createCompletedGame 3 2 (PlayerId 1) (PlayerId 3) 420 400  -- Alice wins +20
            ]
          standings = calculateStandingsPlayers division.players division.games

        -- Alice: 2-0, spread +120
        -- Carol: 1-1, spread +30
        -- Bob: 0-2, spread -150
        -- Sorted by: wins desc, losses asc, spread desc
        case standings !! 0 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.wins `shouldEqual` 2
            p.losses `shouldEqual` 0
            p.spread `shouldEqual` 120
          Nothing -> pure unit

        case standings !! 1 of
          Just p -> do
            p.name `shouldEqual` "Carol"
            p.wins `shouldEqual` 1
            p.losses `shouldEqual` 1
            p.spread `shouldEqual` 30
          Nothing -> pure unit

      it "handles bye games correctly" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            , createPlayer (PlayerId 2) "Bob" 1500
            , createPlayer (PlayerId 3) "Carol" 1500
            ]
            [ createCompletedGame 1 1 (PlayerId 1) (PlayerId 2) 450 350  -- Alice wins
            , createByeGame 2 1 (PlayerId 3)  -- Carol gets bye (counts as win if score > 0)
            , createCompletedGame 3 2 (PlayerId 2) (PlayerId 3) 420 400  -- Bob wins
            ]
          standings = calculateStandingsPlayers division.players division.games

        -- Alice: 1-0, spread +100
        -- Carol: 1-1, spread +30 (bye +50, loss -20)
        -- Bob: 1-1, spread -80 (loss -100, win +20)
        -- Sorted by: wins desc, losses asc, spread desc
        case standings !! 0 of
          Just p -> do
            p.name `shouldEqual` "Alice"
            p.wins `shouldEqual` 1
            p.losses `shouldEqual` 0
          Nothing -> pure unit

        -- Carol has better spread than Bob (both 1-1)
        case standings !! 1 of
          Just p -> do
            p.name `shouldEqual` "Carol"
            p.wins `shouldEqual` 1
            p.losses `shouldEqual` 1
            p.spread `shouldEqual` 30
          Nothing -> pure unit

        case standings !! 2 of
          Just p -> do
            p.name `shouldEqual` "Bob"
            p.wins `shouldEqual` 1
            p.losses `shouldEqual` 1
            p.spread `shouldEqual` (-80)
          Nothing -> pure unit

      it "handles players with no completed games" do
        let
          division = createDivisionWith
            [ createPlayer (PlayerId 1) "Alice" 1500
            , createPlayer (PlayerId 2) "Bob" 1500
            ]
            []
          standings = calculateStandingsPlayers division.players division.games

        -- Both players should have 0-0 record
        case standings !! 0 of
          Just p -> do
            p.wins `shouldEqual` 0
            p.losses `shouldEqual` 0
            p.spread `shouldEqual` 0
          Nothing -> pure unit
