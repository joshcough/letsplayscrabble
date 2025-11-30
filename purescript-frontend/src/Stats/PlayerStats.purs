-- | Player statistics calculation
-- | Pure functions to calculate player stats from games
module Stats.PlayerStats where

import Prelude

import Data.Array (filter, foldl, length, sortBy, mapWithIndex, (!!))
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Number (fromString)
import Data.Number.Format (toString, fixed, toStringWith)
import Data.Int (toNumber, round)
import Domain.Types (Player, PlayerId, Game, GameId)
import Data.Function (flip, (#))

-- | Player statistics (computed from games)
type PlayerStats =
  { playerId :: PlayerId
  , name :: String
  , initialRating :: Int
  , currentRating :: Int
  , ratingDiff :: Int
  , seed :: Int
  , wins :: Int
  , losses :: Int
  , ties :: Int
  , spread :: Int
  , averageScore :: Number
  , averageOpponentScore :: Number
  , highScore :: Int
  , photo :: Maybe String
  , xtPhotoUrl :: Maybe String
  }

-- | Player statistics with rank
type RankedPlayerStats =
  { playerId :: PlayerId
  , name :: String
  , initialRating :: Int
  , currentRating :: Int
  , ratingDiff :: Int
  , seed :: Int
  , wins :: Int
  , losses :: Int
  , ties :: Int
  , spread :: Int
  , averageScore :: Number
  , averageOpponentScore :: Number
  , highScore :: Int
  , photo :: Maybe String
  , xtPhotoUrl :: Maybe String
  , rank :: Int
  }

-- | Sort type for different overlay types
data SortType
  = Standings
  | HighScore
  | AverageScore
  | RatingGain

derive instance eqSortType :: Eq SortType

-- | Calculate stats for a single player from their games
calculatePlayerStats :: Player -> Array Game -> PlayerStats
calculatePlayerStats player games =
  let
    playerGames = filter isPlayerGame games

    stats = foldl accumGame initialStats playerGames

    gamesPlayed = stats.gamesPlayed

    avgScore = if gamesPlayed > 0
      then toNumber stats.totalScore / toNumber gamesPlayed
      else 0.0

    avgOppScore = if gamesPlayed > 0
      then toNumber stats.totalOpponentScore / toNumber gamesPlayed
      else 0.0

    currentRating = case player.ratingsHistory of
      [] -> player.initialRating
      history -> fromMaybe player.initialRating (history !! (length history - 1))

    ratingDiff = currentRating - player.initialRating

    -- Extract XT photo URL from xtData if available
    xtPhotoUrl = case player.xtData of
      Just xt -> xt.photourl
      Nothing -> Nothing
  in
    { playerId: player.id
    , name: player.name
    , initialRating: player.initialRating
    , currentRating
    , ratingDiff
    , seed: player.seed
    , wins: stats.wins
    , losses: stats.losses
    , ties: stats.ties
    , spread: stats.totalSpread
    , averageScore: avgScore
    , averageOpponentScore: avgOppScore
    , highScore: stats.highScore
    , photo: player.photo
    , xtPhotoUrl
    }
  where
    isPlayerGame :: Game -> Boolean
    isPlayerGame game = game.player1Id == player.id || game.player2Id == player.id

    initialStats =
      { totalSpread: 0
      , totalScore: 0
      , totalOpponentScore: 0
      , highScore: 0
      , wins: 0
      , losses: 0
      , ties: 0
      , gamesPlayed: 0
      }

    accumGame stats game =
      if game.isBye then
        accumulateBye stats game
      else
        accumulateRegularGame stats game

    accumulateBye stats game =
      let
        byeScore = if game.player1Id == player.id
          then game.player1Score
          else game.player2Score
      in
        case byeScore of
          Nothing -> stats
          Just score ->
            { totalSpread: stats.totalSpread + score
            , totalScore: stats.totalScore
            , totalOpponentScore: stats.totalOpponentScore
            , highScore: stats.highScore
            , wins: if score > 0 then stats.wins + 1 else stats.wins
            , losses: if score <= 0 then stats.losses + 1 else stats.losses
            , ties: stats.ties
            , gamesPlayed: stats.gamesPlayed
            }

    accumulateRegularGame stats game =
      case game.player1Score, game.player2Score of
        Just p1Score, Just p2Score ->
          let
            { playerScore, opponentScore } =
              if game.player1Id == player.id
                then { playerScore: p1Score, opponentScore: p2Score }
                else { playerScore: p2Score, opponentScore: p1Score }

            spread = playerScore - opponentScore

            newWins = if playerScore > opponentScore then stats.wins + 1 else stats.wins
            newLosses = if playerScore < opponentScore then stats.losses + 1 else stats.losses
            newTies = if playerScore == opponentScore then stats.ties + 1 else stats.ties
          in
            { totalSpread: stats.totalSpread + spread
            , totalScore: stats.totalScore + playerScore
            , totalOpponentScore: stats.totalOpponentScore + opponentScore
            , highScore: max stats.highScore playerScore
            , wins: newWins
            , losses: newLosses
            , ties: newTies
            , gamesPlayed: stats.gamesPlayed + 1
            }
        _, _ -> stats

-- | Calculate stats for all players
calculateAllPlayerStats :: Array Player -> Array Game -> Array PlayerStats
calculateAllPlayerStats players games =
  map (\p -> calculatePlayerStats p games) players

-- | Sort players by standings (wins desc, losses asc, spread desc)
sortByStandings :: Array PlayerStats -> Array PlayerStats
sortByStandings players =
  sortBy compareStandings players
  where
    compareStandings a b =
      case compare b.wins a.wins of
        EQ -> case compare a.losses b.losses of
          EQ -> compare b.spread a.spread
          other -> other
        other -> other

-- | Sort players by high score
sortByHighScore :: Array PlayerStats -> Array PlayerStats
sortByHighScore players =
  sortBy (\a b -> compare b.highScore a.highScore) players

-- | Sort players by average score
sortByAverageScore :: Array PlayerStats -> Array PlayerStats
sortByAverageScore players =
  sortBy (\a b -> compare b.averageScore a.averageScore) players

-- | Sort players by rating gain
sortByRatingGain :: Array PlayerStats -> Array PlayerStats
sortByRatingGain players =
  sortBy (\a b -> compare b.ratingDiff a.ratingDiff) players

-- | Sort players by the given sort type
sortPlayers :: SortType -> Array PlayerStats -> Array PlayerStats
sortPlayers Standings = sortByStandings
sortPlayers HighScore = sortByHighScore
sortPlayers AverageScore = sortByAverageScore
sortPlayers RatingGain = sortByRatingGain

-- | Add ranks to sorted players
addRanks :: Array PlayerStats -> Array RankedPlayerStats
addRanks players =
  mapWithIndex (\idx player ->
    { playerId: player.playerId
    , name: player.name
    , initialRating: player.initialRating
    , currentRating: player.currentRating
    , ratingDiff: player.ratingDiff
    , seed: player.seed
    , wins: player.wins
    , losses: player.losses
    , ties: player.ties
    , spread: player.spread
    , averageScore: player.averageScore
    , averageOpponentScore: player.averageOpponentScore
    , highScore: player.highScore
    , photo: player.photo
    , xtPhotoUrl: player.xtPhotoUrl
    , rank: idx + 1
    }
  ) players

-- | Calculate ranked player stats with given sort type
calculateRankedStats :: SortType -> Array Player -> Array Game -> Array RankedPlayerStats
calculateRankedStats sortType players games =
  calculateAllPlayerStats players games
    # sortPlayers sortType
    # addRanks
