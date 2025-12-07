module Test.Utils.TestHelpers where

import Prelude

import Data.Array (range)
import Data.Maybe (Maybe(..))
import Domain.Types (DivisionId(..), DivisionScopedData, GameId(..), PlayerId(..), TournamentId(..))

-- | Helper to create mock division scoped data for testing
createMockDivisionData :: DivisionScopedData
createMockDivisionData =
  { tournament:
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
  , division:
      { id: DivisionId 1
      , name: "Division A"
      , players:
          [ { id: PlayerId 1
            , name: "Player One"
            , seed: 1
            , initialRating: 1500
            , ratingsHistory: []
            , xtid: Nothing
            , xtData: Nothing
            , photo: Nothing
            }
          , { id: PlayerId 2
            , name: "Player Two"
            , seed: 2
            , initialRating: 1450
            , ratingsHistory: []
            , xtid: Nothing
            , xtData: Nothing
            , photo: Nothing
            }
          ]
      , games:
          [ { id: GameId 1
            , roundNumber: 1
            , player1Id: PlayerId 1
            , player2Id: PlayerId 2
            , player1Score: Just 400
            , player2Score: Just 350
            , isBye: false
            , pairingId: Nothing
            }
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
