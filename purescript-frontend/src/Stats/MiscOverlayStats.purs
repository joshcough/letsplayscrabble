-- | Pure statistics functions for MiscOverlay
-- | All functions are pure and testable
module Stats.MiscOverlayStats where

import Prelude

import Data.Array (filter, find, length, null, reverse, sortBy, take)
import Data.Maybe (Maybe(..), maybe)
import Data.String (joinWith) as String
import Domain.Types (Game, PlayerId)
import Stats.PlayerStats (RankedPlayerStats, SortType(..))
import Utils.Format (formatNumberWithSign, formatRankOrdinal)

-- | Format player record as W-L-T
formatRecord :: RankedPlayerStats -> String
formatRecord player =
  show player.wins <> "-" <> show player.losses <>
    if player.ties > 0 then "-" <> show player.ties else ""

-- | Get "Seed" or "Place" label based on whether player has played games
getPlaceOrSeedLabel :: RankedPlayerStats -> String
getPlaceOrSeedLabel player =
  if player.wins == 0 && player.losses == 0 then "Seed" else "Place"

-- | Format under-cam record (W-L-T +/-spread)
formatUnderCamRecord :: RankedPlayerStats -> String
formatUnderCamRecord player =
  formatRecord player <> " " <> formatNumberWithSign player.spread

-- | Format full under-cam (with place and seed)
formatFullUnderCam :: RankedPlayerStats -> String
formatFullUnderCam player =
  let label = getPlaceOrSeedLabel player
      rankOrd = formatRankOrdinal player.rank
      seedOrd = formatRankOrdinal player.seed
      recordPart = formatUnderCamRecord player
  in if label == "Seed"
       then recordPart <> " | " <> rankOrd <> " Seed"
       else recordPart <> " | " <> rankOrd <> " Place (" <> seedOrd <> " Seed)"

-- | Format under-cam without seed
formatUnderCamNoSeed :: RankedPlayerStats -> String
formatUnderCamNoSeed player =
  let label = getPlaceOrSeedLabel player
      rankOrd = formatRankOrdinal player.rank
  in formatUnderCamRecord player <> " | " <> rankOrd <> " " <> label

-- | Format under-cam with rating
formatUnderCamWithRating :: RankedPlayerStats -> String
formatUnderCamWithRating player =
  let label = getPlaceOrSeedLabel player
      rankOrd = formatRankOrdinal player.rank
  in formatUnderCamRecord player <> " | " <> rankOrd <> " " <> label <> " | Rating " <> show player.currentRating

-- | Format best of 7 record
formatBestOf7 :: RankedPlayerStats -> String
formatBestOf7 player =
  "Best of 7 Record: " <> formatUnderCamRecord player

-- | Get recent games for a player (most recent first)
getRecentGamesForPlayer :: PlayerId -> Array Game -> Int -> Array Game
getRecentGamesForPlayer playerId games limit =
  let
    -- Get all games for this player
    playerGames = filter (\g -> g.player1Id == playerId || g.player2Id == playerId) games
    -- Filter to only played games (both scores present)
    playedGames = filter (\g -> maybe false (const true) g.player1Score && maybe false (const true) g.player2Score) playerGames
    -- Sort by round number descending (most recent first)
    sortedGames = sortBy (\a b -> compare b.roundNumber a.roundNumber) playedGames
  in
    take limit sortedGames

-- | Determine game result for a player (W/L/T)
gameResult :: PlayerId -> Game -> String
gameResult pid game =
  let
    isPlayer1 = game.player1Id == pid
    playerScore = if isPlayer1 then game.player1Score else game.player2Score
    opponentScore = if isPlayer1 then game.player2Score else game.player1Score
  in
    case playerScore, opponentScore of
      Just ps, Just os ->
        if ps > os then "W"
        else if ps == os then "T"
        else "L"
      _, _ -> "?"

-- | Format game history as W-L-W string
formatGameHistorySimple :: PlayerId -> Array Game -> String
formatGameHistorySimple playerId games =
  let
    recentGames = getRecentGamesForPlayer playerId games 5
    results = map (gameResult playerId) recentGames
    -- Reverse to show in chronological order (oldest first)
    chronologicalResults = reverse results
  in
    if null results
      then "No games"
      else "Last " <> show (length results) <> ": " <> String.joinWith "-" chronologicalResults

-- | Get opponent name for a game
getOpponentName :: PlayerId -> Game -> Array RankedPlayerStats -> String
getOpponentName playerId game players =
  let
    opponentId = if game.player1Id == playerId then game.player2Id else game.player1Id
    maybeOpponent = find (\p -> p.playerId == opponentId) players
  in
    maybe "Unknown" _.name maybeOpponent

-- | Calculate rank for average score
calculateAverageScoreRank :: Array RankedPlayerStats -> RankedPlayerStats -> Int
calculateAverageScoreRank allPlayers player =
  let
    sorted = sortBy (\a b -> compare b.averageScore a.averageScore) allPlayers
    maybeIndex = find (\p -> p.playerId == player.playerId) sorted
  in
    maybe 1 (\_ ->
      let idx = length (filter (\p -> p.averageScore > player.averageScore) sorted)
      in idx + 1
    ) maybeIndex

-- | Calculate rank for average opponent score (lower is better, so reverse sort)
calculateAverageOpponentScoreRank :: Array RankedPlayerStats -> RankedPlayerStats -> Int
calculateAverageOpponentScoreRank allPlayers player =
  let
    sorted = sortBy (\a b -> compare a.averageOpponentScore b.averageOpponentScore) allPlayers
    maybeIndex = find (\p -> p.playerId == player.playerId) sorted
  in
    maybe 1 (\_ ->
      let idx = length (filter (\p -> p.averageOpponentScore < player.averageOpponentScore) sorted)
      in idx + 1
    ) maybeIndex
