-- | Tournament-wide statistics calculation
module Stats.TournamentStats where

import Prelude

import Data.Array (filter, length, index)
import Data.Foldable (foldl, sum)
import Data.Int (round, toNumber)
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Newtype (unwrap)
import Domain.Types (Game, Player, Tournament, PlayerId)
import Stats.PlayerStats (RankedPlayerStats, SortType(..), calculateRankedStats)

-- | Tournament statistics record
type TournamentStats =
  { gamesPlayed :: Int
  , pointsScored :: Int
  , averageScore :: String
  , higherRatedWinPercent :: Number
  , goingFirstWinPercent :: Number
  , totalPlayers :: Int
  }

-- | Calculate tournament statistics from games and players
calculateTournamentStats :: Array Game -> Array Player -> TournamentStats
calculateTournamentStats games players =
  let
    -- Filter completed games (non-bye games with scores)
    completedGames = filter
      (\game ->
        case game.player1Score, game.player2Score of
          Just s1, Just s2 -> not game.isBye
          _, _ -> false
      )
      games

    gamesPlayed = length completedGames

    -- Calculate total points
    totalPoints = foldl
      (\acc game ->
        acc + fromMaybe 0 game.player1Score + fromMaybe 0 game.player2Score
      )
      0
      completedGames

    -- Calculate average winning and losing scores
    scores = foldl
      (\acc game ->
        case game.player1Score, game.player2Score of
          Just s1, Just s2 ->
            if s1 > s2 then
              { winning: acc.winning <> [s1], losing: acc.losing <> [s2] }
            else if s2 > s1 then
              { winning: acc.winning <> [s2], losing: acc.losing <> [s1] }
            else
              acc  -- Skip ties
          _, _ -> acc
      )
      { winning: [], losing: [] }
      completedGames

    avgWinning = if length scores.winning > 0
      then round $ toNumber (sum scores.winning) / toNumber (length scores.winning)
      else 0

    avgLosing = if length scores.losing > 0
      then round $ toNumber (sum scores.losing) / toNumber (length scores.losing)
      else 0

    averageScore = show avgWinning <> "-" <> show avgLosing

    -- Calculate going first win percentage (player1 wins)
    goingFirstWins = length $ filter
      (\game -> fromMaybe 0 game.player1Score > fromMaybe 0 game.player2Score)
      completedGames

    goingFirstWinPercent = if gamesPlayed > 0
      then (toNumber goingFirstWins / toNumber gamesPlayed) * 100.0
      else 0.0

    -- Calculate higher rated win percentage
    higherRatedWinPercent = calculateHigherRatedWinPercent completedGames players

    totalPlayers = length players

  in
    { gamesPlayed
    , pointsScored: totalPoints
    , averageScore
    , higherRatedWinPercent
    , goingFirstWinPercent
    , totalPlayers
    }

-- | Calculate percentage of games won by higher-rated player
calculateHigherRatedWinPercent :: Array Game -> Array Player -> Number
calculateHigherRatedWinPercent games players =
  if length players == 0 then 0.0
  else
    let
      -- Create a lookup function for players
      findPlayer :: PlayerId -> Maybe Player
      findPlayer playerId =
        case filter (\p -> p.id == playerId) players of
          [player] -> Just player
          _ -> Nothing

      -- Get player rating before a specific round
      getPlayerRatingBeforeRound :: Player -> Int -> Int
      getPlayerRatingBeforeRound player roundNumber =
        if roundNumber == 1 then
          player.initialRating
        else
          let ratingIndex = roundNumber - 2
          in fromMaybe player.initialRating (index player.ratingsHistory ratingIndex)

      -- Filter games where both players exist
      gamesWithRatings = filter
        (\game ->
          case findPlayer game.player1Id, findPlayer game.player2Id of
            Just _, Just _ -> true
            _, _ -> false
        )
        games

      -- Count games won by higher-rated player
      higherRatedWins = length $ filter
        (\game ->
          case findPlayer game.player1Id, findPlayer game.player2Id of
            Just p1, Just p2 ->
              let
                p1Rating = getPlayerRatingBeforeRound p1 game.roundNumber
                p2Rating = getPlayerRatingBeforeRound p2 game.roundNumber
                p1Higher = p1Rating > p2Rating
                p1Won = fromMaybe 0 game.player1Score > fromMaybe 0 game.player2Score
              in
                (p1Higher && p1Won) || (not p1Higher && not p1Won)
            _, _ -> false
        )
        gamesWithRatings

      gamesCount = length gamesWithRatings

    in
      if gamesCount > 0 then
        (toNumber higherRatedWins / toNumber gamesCount) * 100.0
      else
        0.0

-- | Calculate stats for entire tournament (all divisions)
calculateAllTournamentStats :: Tournament -> TournamentStats
calculateAllTournamentStats tournament =
  let
    allGames = foldl (\acc div -> acc <> div.games) [] tournament.divisions
    allPlayers = foldl (\acc div -> acc <> div.players) [] tournament.divisions
  in
    calculateTournamentStats allGames allPlayers

--------------------------------------------------------------------------------
-- Overlay Calculations (shared by table and picture components)
--------------------------------------------------------------------------------

-- | Calculate rating gain for all players (shared by RatingGain and RatingGainWithPics)
-- | Returns players ranked by rating gain
calculateRatingGainPlayers :: Array Player -> Array Game -> Array RankedPlayerStats
calculateRatingGainPlayers players games =
  calculateRankedStats RatingGain players games

-- | Calculate high scores for all players (shared by HighScores and HighScoresWithPics)
-- | Returns players ranked by high score
calculateHighScorePlayers :: Array Player -> Array Game -> Array RankedPlayerStats
calculateHighScorePlayers players games =
  calculateRankedStats HighScore players games

-- | Calculate scoring leaders for all players (shared by ScoringLeaders and ScoringLeadersWithPics)
-- | Returns players ranked by average score
calculateScoringLeadersPlayers :: Array Player -> Array Game -> Array RankedPlayerStats
calculateScoringLeadersPlayers players games =
  calculateRankedStats AverageScore players games

-- | Calculate standings for all players (shared by Standings and StandingsWithPics)
-- | Returns players ranked by wins/losses/spread
calculateStandingsPlayers :: Array Player -> Array Game -> Array RankedPlayerStats
calculateStandingsPlayers players games =
  calculateRankedStats Standings players games
