-- | Misc Overlay - provides various small overlays for OBS
module Component.MiscOverlay where

import Prelude

import Component.BaseOverlay as BaseOverlay
import Data.Array (find)
import Data.Int (round)
import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..), PairingId(..))
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.PlayerStats (RankedPlayerStats, SortType(..))

-- | Supported source types
data SourceType
  = Player1Name
  | Player2Name
  | Player1Record
  | Player2Record
  | Player1AverageScore
  | Player2AverageScore
  | Player1HighScore
  | Player2HighScore
  | Player1Spread
  | Player2Spread
  | Player1Rank
  | Player2Rank
  | Player1RankOrdinal
  | Player2RankOrdinal
  | Player1Rating
  | Player2Rating
  | UnknownSource

derive instance Eq SourceType

-- | Parse source string to SourceType
parseSource :: String -> SourceType
parseSource = case _ of
  "player1-name" -> Player1Name
  "player2-name" -> Player2Name
  "player1-record" -> Player1Record
  "player2-record" -> Player2Record
  "player1-average-score" -> Player1AverageScore
  "player2-average-score" -> Player2AverageScore
  "player1-high-score" -> Player1HighScore
  "player2-high-score" -> Player2HighScore
  "player1-spread" -> Player1Spread
  "player2-spread" -> Player2Spread
  "player1-rank" -> Player1Rank
  "player2-rank" -> Player2Rank
  "player1-rank-ordinal" -> Player1RankOrdinal
  "player2-rank-ordinal" -> Player2RankOrdinal
  "player1-rating" -> Player1Rating
  "player2-rating" -> Player2Rating
  _ -> UnknownSource

-- | Helper to format player record
formatRecord :: RankedPlayerStats -> String
formatRecord player =
  show player.wins <> "-" <> show player.losses <>
    if player.ties > 0 then "-" <> show player.ties else ""

-- | Helper to format spread with + sign for positive
formatSpread :: Int -> String
formatSpread spread =
  if spread > 0 then "+" <> show spread else show spread

-- | Helper to format rank ordinal (1st, 2nd, 3rd, etc.)
formatRankOrdinal :: Int -> String
formatRankOrdinal rank =
  let suffix = if rank `mod` 100 > 10 && rank `mod` 100 < 14
                 then "th"
                 else case rank `mod` 10 of
                   1 -> "st"
                   2 -> "nd"
                   3 -> "rd"
                   _ -> "th"
  in show rank <> suffix

type Input =
  { userId :: Int
  , tournamentId :: Maybe Int
  , divisionName :: Maybe String
  , source :: String
  }

type State = BaseOverlay.State

type Action = BaseOverlay.Action

component :: forall query output m. MonadAff m => H.Component query Input output m
component = H.mkComponent
  { initialState: \input ->
      BaseOverlay.initialState Standings
        { userId: input.userId
        , tournamentId: map TournamentId input.tournamentId
        , divisionName: input.divisionName
        , extraData: Just input.source
        }
  , render: \state ->
      let source = case state.extraData of
            Just s -> parseSource s
            Nothing -> UnknownSource
      in renderMiscOverlay state source
  , eval: H.mkEval $ H.defaultEval
      { handleAction = BaseOverlay.handleAction
      , initialize = Just BaseOverlay.Initialize
      , finalize = Just BaseOverlay.Finalize
      }
  }

renderMiscOverlay :: forall m. BaseOverlay.State -> SourceType -> H.ComponentHTML Action () m
renderMiscOverlay state source =
  if state.loading then
    BaseOverlay.renderLoading
  else case state.error of
    Just err -> BaseOverlay.renderError err
    Nothing -> case state.tournament of
      Just _ -> renderPlayerData state source
      Nothing -> BaseOverlay.renderError "No tournament data"

renderPlayerData :: forall m. BaseOverlay.State -> SourceType -> H.ComponentHTML Action () m
renderPlayerData state source =
  -- Find player1 and player2 from the current match
  case state.tournament, state.currentMatch of
    Nothing, _ -> BaseOverlay.renderError $ "No tournament data (subscribedToCurrentMatch=" <> show state.subscribedToCurrentMatch <> ")"
    _, Nothing -> BaseOverlay.renderError $ "No current match selected (subscribedToCurrentMatch=" <> show state.subscribedToCurrentMatch <> ", tournament=" <> show (state.tournament /= Nothing) <> ")"
    Just tournamentData, Just currentMatch ->
      let
        division = tournamentData.division
        -- Find the game for the current match (by round and pairingId)
        maybeGame = find (\g ->
          g.roundNumber == currentMatch.round &&
          case g.pairingId of
            Just (PairingId pid) -> pid == currentMatch.pairingId
            Nothing -> false
        ) division.games
      in
        case maybeGame of
          Nothing -> BaseOverlay.renderError $ "Current match game not found (round " <> show currentMatch.round <> ", pairing " <> show currentMatch.pairingId <> ")"
          Just game ->
            let
              player1Stats = find (\p -> p.playerId == game.player1Id) state.players
              player2Stats = find (\p -> p.playerId == game.player2Id) state.players
            in
              case player1Stats, player2Stats of
                Just p1, Just p2 ->
                  case source of
                    Player1Name ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text p1.name ]
                    Player2Name ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text p2.name ]
                    Player1Record ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "Record: " <> formatRecord p1 ]
                    Player2Record ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "Record: " <> formatRecord p2 ]
                    Player1AverageScore ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "Average Score: " <> show (round p1.averageScore) ]
                    Player2AverageScore ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "Average Score: " <> show (round p2.averageScore) ]
                    Player1HighScore ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "High Score: " <> show p1.highScore ]
                    Player2HighScore ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "High Score: " <> show p2.highScore ]
                    Player1Spread ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "Spread: " <> formatSpread p1.spread ]
                    Player2Spread ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "Spread: " <> formatSpread p2.spread ]
                    Player1Rank ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "Rank: " <> show p1.rank ]
                    Player2Rank ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "Rank: " <> show p2.rank ]
                    Player1RankOrdinal ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatRankOrdinal p1.rank ]
                    Player2RankOrdinal ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatRankOrdinal p2.rank ]
                    Player1Rating ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "Rating: " <> show p1.currentRating ]
                    Player2Rating ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ "Rating: " <> show p2.currentRating ]
                    UnknownSource ->
                      HH.div [ HP.class_ (HH.ClassName "text-black p-2") ] [ HH.text "Unknown source type" ]
                _, _ ->
                  BaseOverlay.renderError "Players not found"
