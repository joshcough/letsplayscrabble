module Test.Utils.TestHelpers where

import Prelude

import BroadcastChannel.Manager as BroadcastManager
import Data.Array (range)
import Data.Maybe (Maybe(..))
import Domain.Types (Division, DivisionId(..), DivisionScopedData, Game, GameId(..), PairingId(..), Player, PlayerId(..), Tournament, TournamentId(..), TournamentSummary, CrossTablesPlayer, XTId(..))
import Effect.Unsafe (unsafePerformEffect)

--------------------------------------------------------------------------------
-- Builder Functions for Test Data
--------------------------------------------------------------------------------

-- | Create a player with minimal required fields
createPlayer :: PlayerId -> String -> Int -> Player
createPlayer playerId name initialRating =
  { id: playerId
  , name: name
  , seed: case playerId of PlayerId n -> n
  , initialRating: initialRating
  , ratingsHistory: []
  , xtid: Nothing
  , xtData: Nothing
  , photo: Nothing
  }

-- | Create a player with ratings history for rating gain tests
createPlayerWithRatings ::
  { playerId :: PlayerId
  , name :: String
  , initialRating :: Int
  , ratingsHistory :: Array Int
  } -> Player
createPlayerWithRatings { playerId, name, initialRating, ratingsHistory } =
  { id: playerId
  , name: name
  , seed: case playerId of PlayerId n -> n
  , initialRating: initialRating
  , ratingsHistory: ratingsHistory
  , xtid: Nothing
  , xtData: Nothing
  , photo: Nothing
  }

-- | Create a game (scores can be Nothing for incomplete games)
createGame ::
  { gameId :: Int
  , round :: Int
  , player1 :: PlayerId
  , player2 :: PlayerId
  , score1 :: Maybe Int
  , score2 :: Maybe Int
  } -> Game
createGame { gameId, round, player1, player2, score1, score2 } =
  { id: GameId gameId
  , roundNumber: round
  , player1Id: player1
  , player2Id: player2
  , player1Score: score1
  , player2Score: score2
  , isBye: false
  , pairingId: Just (PairingId gameId)
  }

-- | Create a completed game with scores
createCompletedGame ::
  { gameId :: Int
  , round :: Int
  , player1 :: PlayerId
  , player2 :: PlayerId
  , score1 :: Int
  , score2 :: Int
  } -> Game
createCompletedGame { gameId, round, player1, player2, score1, score2 } =
  createGame { gameId, round, player1, player2, score1: Just score1, score2: Just score2 }

-- | Create a bye game
createByeGame :: Int -> Int -> PlayerId -> Game
createByeGame gameIdNum roundNumber playerId =
  { id: GameId gameIdNum
  , roundNumber: roundNumber
  , player1Id: playerId
  , player2Id: PlayerId 0  -- Dummy player for bye
  , player1Score: Just 50  -- Standard bye points
  , player2Score: Nothing
  , isBye: true
  , pairingId: Just (PairingId gameIdNum)
  }

-- | Create a division with ID, name, players, and games
createDivision :: DivisionId -> String -> Array Player -> Array Game -> Division
createDivision divId name players games =
  { id: divId
  , name: name
  , players: players
  , games: games
  , headToHeadGames: []
  }

-- | Create a tournament with ID, name, and divisions
createTournament :: Int -> String -> Array Division -> Tournament
createTournament tournamentId name divisions =
  { id: TournamentId tournamentId
  , name: name
  , city: "Test City"
  , year: 2025
  , lexicon: "TWL"
  , longFormName: name <> " 2025"
  , dataUrl: "http://example.com"
  , theme: "scrabble"
  , transparentBackground: false
  , divisions: divisions
  }

-- | Create a division with custom players and games
createDivisionWith :: Array Player -> Array Game -> Division
createDivisionWith players games =
  { id: DivisionId 1
  , name: "Division A"
  , players: players
  , games: games
  , headToHeadGames: []
  }

-- | Create a tournament summary for testing
createTournamentSummary :: TournamentSummary
createTournamentSummary =
  { id: TournamentId 1
  , name: "Test Tournament"
  , city: "Test City"
  , year: 2025
  , lexicon: "TWL"
  , longFormName: "Test Tournament 2025"
  , dataUrl: "http://example.com"
  , pollUntil: Nothing
  , theme: "scrabble"
  , transparentBackground: false
  }

-- | Create division scoped data with custom division
createDivisionScopedDataWith :: Division -> DivisionScopedData
createDivisionScopedDataWith division =
  { tournament: createTournamentSummary
  , division: division
  }

--------------------------------------------------------------------------------
-- Legacy Helper Functions (for backward compatibility)
--------------------------------------------------------------------------------

-- | Helper to create mock division scoped data for testing
createMockDivisionData :: DivisionScopedData
createMockDivisionData =
  { tournament: createTournamentSummary
  , division:
      { id: DivisionId 1
      , name: "Division A"
      , players:
          [ createPlayer (PlayerId 1) "Player One" 1500
          , createPlayer (PlayerId 2) "Player Two" 1450
          ]
      , games:
          [ createCompletedGame { gameId: 1, round: 1, player1: PlayerId 1, player2: PlayerId 2, score1: 400, score2: 350 }
          ]
      , headToHeadGames: []
      }
  }

-- | Helper to create mock data with many players for testing pagination/limits
createMockDivisionDataWithManyPlayers :: Int -> DivisionScopedData
createMockDivisionDataWithManyPlayers n =
  let
    baseData = createMockDivisionData
    additionalPlayers = map (\i ->
      { id: PlayerId (i + 3)
      , name: "Player " <> show (i + 3)
      , seed: i + 3
      , initialRating: 1400 + i * 10
      , ratingsHistory: []
      , xtid: Nothing
      , xtData: Nothing
      , photo: Nothing
      }) (range 0 (n - 3))
  in
    baseData { division = baseData.division { players = baseData.division.players <> additionalPlayers } }

-- | Create a CrossTablesPlayer record for testing
createCrossTablesPlayer ::
  { playerId :: Int
  , name :: String
  , twlranking :: Maybe Int
  , wins :: Maybe Int
  , losses :: Maybe Int
  , ties :: Maybe Int
  , tournamentCount :: Maybe Int
  } -> CrossTablesPlayer
createCrossTablesPlayer { playerId, name, twlranking, wins, losses, ties, tournamentCount } =
  { playerid: playerId
  , name: name
  , twlrating: Nothing
  , cswrating: Nothing
  , twlranking: twlranking
  , cswranking: Nothing
  , w: wins
  , l: losses
  , t: ties
  , b: Nothing
  , photourl: Nothing
  , city: Nothing
  , state: Nothing
  , country: Nothing
  , tournamentCount: tournamentCount
  , averageScore: Nothing
  , opponentAverageScore: Nothing
  , results: Nothing
  }

-- | Create a player with xtData for testing
createPlayerWithXtData ::
  { playerId :: PlayerId
  , name :: String
  , initialRating :: Int
  , xtData :: CrossTablesPlayer
  } -> Player
createPlayerWithXtData { playerId, name, initialRating, xtData } =
  { id: playerId
  , name: name
  , seed: case playerId of PlayerId n -> n
  , initialRating: initialRating
  , ratingsHistory: []
  , xtid: Just (XTId xtData.playerid)
  , xtData: Just xtData
  , photo: Nothing
  }

-- | Create a mock BroadcastManager for testing
-- | NOTE: Uses unsafePerformEffect - only for testing!
createMockBroadcastManager :: BroadcastManager.BroadcastManager
createMockBroadcastManager = (unsafePerformEffect BroadcastManager.create).broadcastManager
