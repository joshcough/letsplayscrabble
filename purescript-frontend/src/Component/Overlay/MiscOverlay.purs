-- | Misc Overlay - provides various small overlays for OBS
module Component.Overlay.MiscOverlay where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import Data.Array (filter, find, length, null, sortBy, take)
import Data.Int (round)
import Data.Maybe (Maybe(..), fromMaybe, isJust, maybe)
import Data.String (joinWith) as String
import Domain.Types (PairingId(..), Game, PlayerId)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.PlayerStats (RankedPlayerStats, SortType(..), calculateRankedStats)
import Stats.MiscOverlayStats as MiscStats
import Utils.CSS (css, cls, raw)
import CSS.Class (CSSClass(..))
import Utils.Format (formatNumberWithSign, formatRankOrdinal)
import Utils.HTML (blackTextDiv, textDivRaw)

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
  | Player1UnderCam
  | Player2UnderCam
  | Player1UnderCamNoSeed
  | Player2UnderCamNoSeed
  | Player1UnderCamSmall
  | Player2UnderCamSmall
  | Player1UnderCamWithRating
  | Player2UnderCamWithRating
  | Player1Bo7
  | Player2Bo7
  | Player1GameHistory
  | Player2GameHistory
  | Player1GameHistorySmall
  | Player2GameHistorySmall
  | TournamentData
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
  "player1-under-cam" -> Player1UnderCam
  "player2-under-cam" -> Player2UnderCam
  "player1-under-cam-no-seed" -> Player1UnderCamNoSeed
  "player2-under-cam-no-seed" -> Player2UnderCamNoSeed
  "player1-under-cam-small" -> Player1UnderCamSmall
  "player2-under-cam-small" -> Player2UnderCamSmall
  "player1-under-cam-with-rating" -> Player1UnderCamWithRating
  "player2-under-cam-with-rating" -> Player2UnderCamWithRating
  "player1-bo7" -> Player1Bo7
  "player2-bo7" -> Player2Bo7
  "player1-game-history" -> Player1GameHistory
  "player2-game-history" -> Player2GameHistory
  "player1-game-history-small" -> Player1GameHistorySmall
  "player2-game-history-small" -> Player2GameHistorySmall
  "tournament-data" -> TournamentData
  _ -> UnknownSource


type State = BaseOverlay.State SourceType

type Action = BaseOverlay.Action

component :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input SourceType) output m
component = BaseOverlay.mkComponent (\state -> renderMiscOverlay state state.extra)

renderMiscOverlay :: forall m. BaseOverlay.State SourceType -> SourceType -> H.ComponentHTML Action () m
renderMiscOverlay state source =
  let s = state
  in if s.loading then
    BaseOverlay.renderLoading
  else case s.error of
    Just err -> BaseOverlay.renderError err
    Nothing -> case s.currentData of
      Just _ ->
        -- TournamentData doesn't need player data, just tournament + current match
        if source == TournamentData
          then renderTournamentData state
          else renderPlayerData state source
      Nothing -> BaseOverlay.renderError "No tournament data"

renderPlayerData :: forall m. BaseOverlay.State SourceType -> SourceType -> H.ComponentHTML Action () m
renderPlayerData state source =
  let s = state
  in -- Find player1 and player2 from the current match
  case s.currentData, s.currentMatch of
    Nothing, _ -> BaseOverlay.renderError $ "No tournament data (subscription=" <> show s.subscription <> ")"
    _, Nothing -> BaseOverlay.renderError $ "No current match selected (subscription=" <> show s.subscription <> ", tournament=" <> show (s.currentData /= Nothing) <> ")"
    Just tournamentData, Just currentMatch ->
      let
        division = tournamentData.division
        -- Find the game for the current match (by round and pairingId)
        maybeGame = division.games # find \g ->
          g.roundNumber == currentMatch.round &&
          maybe false (\(PairingId pid) -> pid == currentMatch.pairingId) g.pairingId
      in
        case maybeGame of
          Nothing -> BaseOverlay.renderError $ "Current match game not found (round " <> show currentMatch.round <> ", pairing " <> show currentMatch.pairingId <> ")"
          Just game ->
            let
              -- Calculate player stats from raw division data
              allPlayerStats = calculateRankedStats Standings division.players division.games
              player1Stats = find (\p -> p.playerId == game.player1Id) allPlayerStats
              player2Stats = find (\p -> p.playerId == game.player2Id) allPlayerStats
            in
              case player1Stats, player2Stats of
                Just p1, Just p2 ->
                  case source of
                    Player1Name ->
                      blackTextDiv p1.name
                    Player2Name ->
                      blackTextDiv p2.name
                    Player1Record ->
                      blackTextDiv $ "Record: " <> MiscStats.formatRecord p1
                    Player2Record ->
                      blackTextDiv $ "Record: " <> MiscStats.formatRecord p2
                    Player1AverageScore ->
                      blackTextDiv $ "Average Score: " <> show (round p1.averageScore)
                    Player2AverageScore ->
                      blackTextDiv $ "Average Score: " <> show (round p2.averageScore)
                    Player1HighScore ->
                      blackTextDiv $ "High Score: " <> show p1.highScore
                    Player2HighScore ->
                      blackTextDiv $ "High Score: " <> show p2.highScore
                    Player1Spread ->
                      blackTextDiv $ "Spread: " <> formatNumberWithSign p1.spread
                    Player2Spread ->
                      blackTextDiv $ "Spread: " <> formatNumberWithSign p2.spread
                    Player1Rank ->
                      blackTextDiv $ "Rank: " <> show p1.rank
                    Player2Rank ->
                      blackTextDiv $ "Rank: " <> show p2.rank
                    Player1RankOrdinal ->
                      blackTextDiv $ formatRankOrdinal p1.rank
                    Player2RankOrdinal ->
                      blackTextDiv $ formatRankOrdinal p2.rank
                    Player1Rating ->
                      blackTextDiv $ "Rating: " <> show p1.currentRating
                    Player2Rating ->
                      blackTextDiv $ "Rating: " <> show p2.currentRating
                    Player1UnderCam ->
                      blackTextDiv $ MiscStats.formatFullUnderCam p1
                    Player2UnderCam ->
                      blackTextDiv $ MiscStats.formatFullUnderCam p2
                    Player1UnderCamNoSeed ->
                      blackTextDiv $ MiscStats.formatUnderCamNoSeed p1
                    Player2UnderCamNoSeed ->
                      blackTextDiv $ MiscStats.formatUnderCamNoSeed p2
                    Player1UnderCamSmall ->
                      blackTextDiv $ MiscStats.formatUnderCamRecord p1
                    Player2UnderCamSmall ->
                      blackTextDiv $ MiscStats.formatUnderCamRecord p2
                    Player1UnderCamWithRating ->
                      blackTextDiv $ MiscStats.formatUnderCamWithRating p1
                    Player2UnderCamWithRating ->
                      blackTextDiv $ MiscStats.formatUnderCamWithRating p2
                    Player1Bo7 ->
                      blackTextDiv $ MiscStats.formatBestOf7 p1
                    Player2Bo7 ->
                      blackTextDiv $ MiscStats.formatBestOf7 p2
                    Player1GameHistorySmall ->
                      renderGameHistoryTable game.player1Id division.games allPlayerStats
                    Player2GameHistorySmall ->
                      renderGameHistoryTable game.player2Id division.games allPlayerStats
                    Player1GameHistory ->
                      renderPointsAndGameHistory p1 game.player1Id division.games allPlayerStats
                    Player2GameHistory ->
                      renderPointsAndGameHistory p2 game.player2Id division.games allPlayerStats
                    TournamentData ->
                      -- This shouldn't be reached since TournamentData is handled separately
                      BaseOverlay.renderError "Tournament data should not be rendered here"
                    UnknownSource ->
                      textDivRaw "text-black p-2" "Unknown source type"
                _, _ ->
                  BaseOverlay.renderError "Players not found"

renderTournamentData :: forall m. BaseOverlay.State SourceType -> H.ComponentHTML Action () m
renderTournamentData state =
  let s = state
  in case s.currentData, s.currentMatch of
    Just tournamentData, Just currentMatch ->
      let tournament = tournamentData.tournament
          text = tournament.name <> " | " <> tournament.lexicon <> " | Round " <> show currentMatch.round
      in blackTextDiv text
    Just _, Nothing ->
      BaseOverlay.renderError "No current match for tournament data"
    Nothing, _ ->
      BaseOverlay.renderError "No tournament data"

-- | Render game history table
renderGameHistoryTable :: forall m. PlayerId -> Array Game -> Array RankedPlayerStats -> H.ComponentHTML Action () m
renderGameHistoryTable playerId games players =
  let
    recentGames = MiscStats.getRecentGamesForPlayer playerId games 5
    headerText = if length recentGames == 1
                   then "Last Game:"
                   else "Last " <> show (length recentGames) <> " Games:"
  in
    if null recentGames then
      blackTextDiv "No games"
    else
      HH.div [ css [cls Mt_4, cls Flex, cls FlexCol, cls ItemsStart, cls Text_Sm, cls TextBlack] ]
        [ HH.div [ css [cls W_Full, cls TextLeft, cls Mb_1] ] [ HH.text headerText ]
        , HH.table [ css [cls W_Full, cls BorderSeparate] ]
            [ HH.tbody_
                (map (renderGameRow playerId players) recentGames)
            ]
        ]
  where
    renderGameRow :: PlayerId -> Array RankedPlayerStats -> Game -> HH.HTML _ Action
    renderGameRow pid pls game =
      let
        isPlayer1 = game.player1Id == pid
        playerScore = if isPlayer1 then game.player1Score else game.player2Score
        opponentScore = if isPlayer1 then game.player2Score else game.player1Score
        opponentName = MiscStats.getOpponentName pid game pls
        result = case playerScore, opponentScore of
          Just ps, Just os ->
            if ps > os then { text: "Win", color: "text-red-600" }
            else if ps == os then { text: "Tie", color: "text-gray-600" }
            else { text: "Loss", color: "text-blue-600" }
          _, _ -> { text: "?", color: "text-gray-600" }
      in
        HH.tr_
          [ HH.td [ css [cls WhitespaceNowrap, cls Pr_4] ]
              [ HH.text $ "Round " <> show game.roundNumber <> ":" ]
          , HH.td [ css [cls WhitespaceNowrap, cls Pr_4] ]
              [ HH.text $ show (fromMaybe 0 playerScore) <> "-" <> show (fromMaybe 0 opponentScore) ]
          , HH.td [ css [cls WhitespaceNowrap, cls FontExtrabold, cls Pr_4, raw result.color] ]
              [ HH.text result.text ]
          , HH.td_
              [ HH.text $ "vs " <> opponentName ]
          ]

-- | Render points display (avg points for/against with rankings)
renderPointsDisplay :: forall m. RankedPlayerStats -> Array RankedPlayerStats -> H.ComponentHTML Action () m
renderPointsDisplay player allPlayers =
  let
    avgScoreRank = MiscStats.calculateAverageScoreRank allPlayers player
    avgOppScoreRank = MiscStats.calculateAverageOpponentScoreRank allPlayers player
    avgScoreRankOrd = formatRankOrdinal avgScoreRank
    avgOppScoreRankOrd = formatRankOrdinal avgOppScoreRank
  in
    HH.div [ css [cls Mt_4, cls Flex, cls FlexCol, cls ItemsStart, cls TextBlack] ]
      [ HH.div [ css [cls Flex, cls W_Full] ]
          [ HH.div [ css [cls Mr_6] ]
              [ HH.div [ css [cls Text_Base, cls W_Full, cls TextLeft] ]
                  [ HH.text $ "Avg Points For: " <> show (round player.averageScore) ]
              , HH.div [ css [cls Text_Base, cls W_Full, cls TextLeft] ]
                  [ HH.text $ "Ranked: " <> avgScoreRankOrd ]
              ]
          , HH.div_
              [ HH.div [ css [cls Text_Base, cls W_Full, cls TextLeft] ]
                  [ HH.text $ "Avg Points Against: " <> show (round player.averageOpponentScore) ]
              , HH.div [ css [cls Text_Base, cls W_Full, cls TextLeft] ]
                  [ HH.text $ "Ranked: " <> avgOppScoreRankOrd ]
              ]
          ]
      ]

-- | Render combined points and game history (used by player1-points, player2-points, player1-game-history, player2-game-history)
renderPointsAndGameHistory :: forall m. RankedPlayerStats -> PlayerId -> Array Game -> Array RankedPlayerStats -> H.ComponentHTML Action () m
renderPointsAndGameHistory player playerId games allPlayers =
  HH.div [ css [cls TextBlack] ]
    [ renderPointsDisplay player allPlayers
    , renderGameHistoryTable playerId games allPlayers
    ]
