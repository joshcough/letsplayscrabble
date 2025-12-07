module Test.Utils.TestHelpers where

import Prelude

import BroadcastChannel.Manager as BroadcastManager
import Data.Array (range)
import Data.Maybe (Maybe(..))
import Domain.Types (Division, DivisionId(..), DivisionScopedData, Game, GameId(..), PairingId(..), Player, PlayerId(..), TournamentId(..), TournamentSummary)
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
createPlayerWithRatings :: PlayerId -> String -> Int -> Array Int -> Player
createPlayerWithRatings playerId name initialRating ratingsHistory =
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
createGame :: Int -> Int -> PlayerId -> PlayerId -> Maybe Int -> Maybe Int -> Game
createGame gameIdNum roundNumber player1Id player2Id player1Score player2Score =
  { id: GameId gameIdNum
  , roundNumber: roundNumber
  , player1Id: player1Id
  , player2Id: player2Id
  , player1Score: player1Score
  , player2Score: player2Score
  , isBye: false
  , pairingId: Just (PairingId gameIdNum)
  }

-- | Create a completed game with scores
createCompletedGame :: Int -> Int -> PlayerId -> PlayerId -> Int -> Int -> Game
createCompletedGame gameIdNum roundNumber player1Id player2Id player1Score player2Score =
  createGame gameIdNum roundNumber player1Id player2Id (Just player1Score) (Just player2Score)

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
          [ createCompletedGame 1 1 (PlayerId 1) (PlayerId 2) 400 350
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

-- | Create a mock BroadcastManager for testing
-- | NOTE: Uses unsafePerformEffect - only for testing!
createMockBroadcastManager :: BroadcastManager.BroadcastManager
createMockBroadcastManager = unsafePerformEffect BroadcastManager.create
