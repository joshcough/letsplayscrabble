-- | Head-to-Head Statistics Calculations
-- | Pure functions for calculating head-to-head statistics between two players
module Stats.HeadToHeadStats where

import Prelude

import Data.Array (filter, sortBy, foldl, length, findIndex, find)
import Data.Array as Array
import Data.Int as Int
import Data.Int (toNumber)
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Data.Newtype (unwrap)
import Domain.Types (PlayerId(..), Player, HeadToHeadGame, Game, GameId(..), XTId(..), TournamentSummary, Division)
import Utils.Date (todayISO)

-- | Player's current record in a tournament
type PlayerRecord =
  { wins :: Int
  , losses :: Int
  , spread :: Int
  }

-- | Head-to-head statistics between two players
type H2HStats =
  { player1Wins :: Int
  , player2Wins :: Int
  , player1AvgScore :: Int
  , player2AvgScore :: Int
  , player1Record :: PlayerRecord
  , player2Record :: PlayerRecord
  , player1Position :: Int
  , player2Position :: Int
  }

-- | Extended H2H game with metadata
type H2HGameExt =
  { game :: HeadToHeadGame
  , tournamentName :: Maybe String
  , isCurrentTournament :: Boolean
  }

--------------------------------------------------------------------------------
-- Main Calculation Functions
--------------------------------------------------------------------------------

-- | Get all head-to-head games between two players (historical + current tournament)
getHeadToHeadGames :: Player -> Player -> Division -> TournamentSummary -> Array H2HGameExt
getHeadToHeadGames p1 p2 division tournament =
  let
    p1XtId = fromMaybe 0 (unwrap <$> p1.xtid)
    p2XtId = fromMaybe 0 (unwrap <$> p2.xtid)

    -- Historical games from cross-tables
    historicalGames = filter (\game ->
      (game.player1.playerid == p1XtId && game.player2.playerid == p2XtId) ||
      (game.player1.playerid == p2XtId && game.player2.playerid == p1XtId)
    ) division.headToHeadGames

    -- Current tournament games
    currentTournamentGames = filter (\game ->
      ((game.player1Id == p1.id && game.player2Id == p2.id) ||
       (game.player1Id == p2.id && game.player2Id == p1.id)) &&
      game.player1Score /= Nothing && game.player2Score /= Nothing
    ) division.games

    -- Convert current tournament games to HeadToHeadGame format
    convertedCurrentGames = map (convertGameToH2H p1 p2 tournament) currentTournamentGames

    -- Combine
    historicalH2H = map (\g -> { game: g, tournamentName: g.tourneyname, isCurrentTournament: false }) historicalGames
    currentH2H = map (\g -> { game: g, tournamentName: Just tournament.name, isCurrentTournament: true }) convertedCurrentGames
  in
    historicalH2H <> currentH2H

-- | Convert current tournament game to HeadToHeadGame format
convertGameToH2H :: Player -> Player -> TournamentSummary -> Game -> HeadToHeadGame
convertGameToH2H p1 p2 tournament game =
  let
    p1XtId = fromMaybe 0 (unwrap <$> p1.xtid)
    p2XtId = fromMaybe 0 (unwrap <$> p2.xtid)
    p1IsGamePlayer1 = game.player1Id == p1.id
    GameId gameId = game.id
  in
    { gameid: gameId
    , date: todayISO  -- Use today's date for current tournament games
    , tourneyname: Just tournament.name
    , player1:
        { playerid: p1XtId
        , name: p1.name
        , score: fromMaybe 0 (if p1IsGamePlayer1 then game.player1Score else game.player2Score)
        , oldrating: 0
        , newrating: 0
        , position: Nothing
        }
    , player2:
        { playerid: p2XtId
        , name: p2.name
        , score: fromMaybe 0 (if p1IsGamePlayer1 then game.player2Score else game.player1Score)
        , oldrating: 0
        , newrating: 0
        , position: Nothing
        }
    , annotated: Nothing
    }

-- | Calculate comprehensive head-to-head statistics
calculateH2HStats :: Player -> Player -> Array H2HGameExt -> Division -> H2HStats
calculateH2HStats p1 p2 h2hGames division =
  let
    p1XtId = fromMaybe 0 (map (\(XTId id) -> id) p1.xtid)

    -- Calculate wins
    player1Wins = length $ filter (\gameExt ->
      let game = gameExt.game
          p1Score = if game.player1.playerid == p1XtId then game.player1.score else game.player2.score
          p2Score = if game.player1.playerid == p1XtId then game.player2.score else game.player1.score
      in p1Score > p2Score
    ) h2hGames

    player2Wins = length $ filter (\gameExt ->
      let game = gameExt.game
          p1Score = if game.player1.playerid == p1XtId then game.player1.score else game.player2.score
          p2Score = if game.player1.playerid == p1XtId then game.player2.score else game.player1.score
      in p2Score > p1Score
    ) h2hGames

    -- Calculate average scores
    totals = foldl (\acc gameExt ->
      let game = gameExt.game
          p1Score = if game.player1.playerid == p1XtId then game.player1.score else game.player2.score
          p2Score = if game.player1.playerid == p1XtId then game.player2.score else game.player1.score
      in { p1Total: acc.p1Total + p1Score, p2Total: acc.p2Total + p2Score, count: acc.count + 1 }
    ) { p1Total: 0, p2Total: 0, count: 0 } h2hGames

    player1AvgScore = if totals.count > 0 then toNumber totals.p1Total / toNumber totals.count else 0.0
    player2AvgScore = if totals.count > 0 then toNumber totals.p2Total / toNumber totals.count else 0.0

    -- Calculate current tournament records
    player1Record = calculateRecord p1.id division
    player2Record = calculateRecord p2.id division

    -- Calculate positions
    sortedPlayers = sortBy comparePlayersByRecord division.players
    player1Position = fromMaybe 1 (findIndex (\p -> p.id == p1.id) sortedPlayers) + 1
    player2Position = fromMaybe 1 (findIndex (\p -> p.id == p2.id) sortedPlayers) + 1
  in
    { player1Wins
    , player2Wins
    , player1AvgScore: Int.round player1AvgScore
    , player2AvgScore: Int.round player2AvgScore
    , player1Record
    , player2Record
    , player1Position
    , player2Position
    }

-- | Calculate a player's record in a division
calculateRecord :: PlayerId -> Division -> PlayerRecord
calculateRecord playerId division =
  foldl (\acc game ->
    case game.player1Score, game.player2Score of
      Just p1Score, Just p2Score | not game.isBye ->
        if game.player1Id == playerId then
          if p1Score > p2Score
            then acc { wins = acc.wins + 1, spread = acc.spread + (p1Score - p2Score) }
            else acc { losses = acc.losses + 1, spread = acc.spread + (p1Score - p2Score) }
        else if game.player2Id == playerId then
          if p2Score > p1Score
            then acc { wins = acc.wins + 1, spread = acc.spread + (p2Score - p1Score) }
            else acc { losses = acc.losses + 1, spread = acc.spread + (p2Score - p1Score) }
        else acc
      _, _ -> acc
  ) { wins: 0, losses: 0, spread: 0 } division.games

-- | Sort games (most recent first, current tournament games first)
sortGames :: Array H2HGameExt -> Array H2HGameExt
sortGames = sortBy \a b ->
  case a.isCurrentTournament, b.isCurrentTournament of
    true, false -> LT
    false, true -> GT
    _, _ -> compare b.game.date a.game.date

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- | Compare players by record for sorting (simplified - just by ID for now)
comparePlayersByRecord :: Player -> Player -> Ordering
comparePlayersByRecord a b =
  let
    PlayerId aId = a.id
    PlayerId bId = b.id
  in
    compare aId bId

-- | Get label for place/seed based on whether player has played games
getPlaceOrSeedLabel :: PlayerRecord -> String
getPlaceOrSeedLabel record =
  if record.wins == 0 && record.losses == 0 then "Seed" else "Place"

--------------------------------------------------------------------------------
-- Player Resolution Functions
--------------------------------------------------------------------------------

-- | Resolve player IDs from params or current match
-- | If params are 0, extract from current game; otherwise use params directly
-- | Uses row polymorphism to accept any record with round and pairingId
resolvePlayerIds :: forall r. Int -> Int -> Maybe { round :: Int, pairingId :: Int | r } -> Array Game -> Maybe { playerId1 :: Int, playerId2 :: Int }
resolvePlayerIds playerId1Param playerId2Param currentMatch games =
  case currentMatch of
    Just cm | playerId1Param == 0 && playerId2Param == 0 -> do
      -- Find current game from the match
      game <- find (\g -> maybe false (\pid -> unwrap pid == cm.pairingId) g.pairingId && g.roundNumber == cm.round) games
      -- Get both player IDs from the game
      pure { playerId1: unwrap game.player1Id, playerId2: unwrap game.player2Id }
    _ ->
      -- Specific players mode - use params directly as actual player IDs
      Just { playerId1: playerId1Param, playerId2: playerId2Param }

-- | Find both players by their IDs
findPlayerPair :: Int -> Int -> Array Player -> Maybe { player1 :: Player, player2 :: Player }
findPlayerPair playerId1 playerId2 players =
  let
    maybePlayer1 = find (\p -> unwrap p.id == playerId1) players
    maybePlayer2 = find (\p -> unwrap p.id == playerId2) players
  in
    case maybePlayer1, maybePlayer2 of
      Just p1, Just p2 -> Just { player1: p1, player2: p2 }
      _, _ -> Nothing

-- | Resolve and find player pair (combines both steps)
resolveAndFindPlayers :: forall r. Int -> Int -> Maybe { round :: Int, pairingId :: Int | r } -> Division -> Maybe { player1 :: Player, player2 :: Player }
resolveAndFindPlayers playerId1Param playerId2Param currentMatch division =
  case resolvePlayerIds playerId1Param playerId2Param currentMatch division.games of
    Nothing -> Nothing
    Just ids -> findPlayerPair ids.playerId1 ids.playerId2 division.players
