-- | Misc Overlay - provides various small overlays for OBS
module Component.Overlay.MiscOverlay where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array (filter, find, length, null, sortBy, take)
import Data.Int (round)
import Data.Maybe (Maybe(..), fromMaybe, isJust, maybe)
import Data.String (joinWith) as String
import Domain.Types (TournamentId(..), PairingId(..), Game, PlayerId)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.PlayerStats (RankedPlayerStats, SortType(..), calculateRankedStats)

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

-- | Get "Seed" or "Place" label based on whether player has played games
getPlaceOrSeedLabel :: RankedPlayerStats -> String
getPlaceOrSeedLabel player =
  if player.wins == 0 && player.losses == 0 then "Seed" else "Place"

-- | Format under-cam record (W-L-T +/-spread)
formatUnderCamRecord :: RankedPlayerStats -> String
formatUnderCamRecord player =
  formatRecord player <> " " <> formatSpread player.spread

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
    playedGames = filter (\g -> isJust g.player1Score && isJust g.player2Score) playerGames
    -- Sort by round number descending (most recent first)
    sortedGames = sortBy (\a b -> compare b.roundNumber a.roundNumber) playedGames
  in
    take limit sortedGames

-- | Format game history as W-L-W string
formatGameHistorySimple :: PlayerId -> Array Game -> String
formatGameHistorySimple playerId games =
  let
    recentGames = getRecentGamesForPlayer playerId games 5
    results = map (gameResult playerId) recentGames
  in
    if null results
      then "No games"
      else "Last " <> show (length results) <> ": " <> String.joinWith "-" results
  where
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

type State = BaseOverlay.State SourceType

type Action = BaseOverlay.Action

component :: forall query output m. MonadAff m => H.Component query (BaseOverlay.Input SourceType) output m
component = H.mkComponent
  { initialState: BaseOverlay.initialState
  , render: \state -> renderMiscOverlay state state.extra
  , eval: H.mkEval $ H.defaultEval
      { handleAction = BaseOverlay.handleAction
      , initialize = Just BaseOverlay.Initialize
      , finalize = Just BaseOverlay.Finalize
      }
  }

renderMiscOverlay :: forall m. BaseOverlay.State SourceType -> SourceType -> H.ComponentHTML Action () m
renderMiscOverlay state source =
  if state.loading then
    BaseOverlay.renderLoading
  else case state.error of
    Just err -> BaseOverlay.renderError err
    Nothing -> case state.tournament of
      Just _ ->
        -- TournamentData doesn't need player data, just tournament + current match
        if source == TournamentData
          then renderTournamentData state
          else renderPlayerData state source
      Nothing -> BaseOverlay.renderError "No tournament data"

renderPlayerData :: forall m. BaseOverlay.State SourceType -> SourceType -> H.ComponentHTML Action () m
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
              -- Calculate player stats from raw division data
              allPlayerStats = calculateRankedStats Standings division.players division.games
              player1Stats = find (\p -> p.playerId == game.player1Id) allPlayerStats
              player2Stats = find (\p -> p.playerId == game.player2Id) allPlayerStats
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
                    Player1UnderCam ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatFullUnderCam p1 ]
                    Player2UnderCam ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatFullUnderCam p2 ]
                    Player1UnderCamNoSeed ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatUnderCamNoSeed p1 ]
                    Player2UnderCamNoSeed ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatUnderCamNoSeed p2 ]
                    Player1UnderCamSmall ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatUnderCamRecord p1 ]
                    Player2UnderCamSmall ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatUnderCamRecord p2 ]
                    Player1UnderCamWithRating ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatUnderCamWithRating p1 ]
                    Player2UnderCamWithRating ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatUnderCamWithRating p2 ]
                    Player1Bo7 ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatBestOf7 p1 ]
                    Player2Bo7 ->
                      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text $ formatBestOf7 p2 ]
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
                      HH.div [ HP.class_ (HH.ClassName "text-black p-2") ] [ HH.text "Unknown source type" ]
                _, _ ->
                  BaseOverlay.renderError "Players not found"

renderTournamentData :: forall m. BaseOverlay.State SourceType -> H.ComponentHTML Action () m
renderTournamentData state =
  case state.tournament, state.currentMatch of
    Just tournamentData, Just currentMatch ->
      let tournament = tournamentData.tournament
          text = tournament.name <> " | " <> tournament.lexicon <> " | Round " <> show currentMatch.round
      in HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text text ]
    Just _, Nothing ->
      BaseOverlay.renderError "No current match for tournament data"
    Nothing, _ ->
      BaseOverlay.renderError "No tournament data"

-- | Render game history table
renderGameHistoryTable :: forall m. PlayerId -> Array Game -> Array RankedPlayerStats -> H.ComponentHTML Action () m
renderGameHistoryTable playerId games players =
  let
    recentGames = getRecentGamesForPlayer playerId games 5
    headerText = if length recentGames == 1
                   then "Last Game:"
                   else "Last " <> show (length recentGames) <> " Games:"
  in
    if null recentGames then
      HH.div [ HP.class_ (HH.ClassName "text-black") ] [ HH.text "No games" ]
    else
      HH.div [ HP.class_ (HH.ClassName "mt-4 flex flex-col items-start text-sm text-black") ]
        [ HH.div [ HP.class_ (HH.ClassName "w-full text-left mb-1") ] [ HH.text headerText ]
        , HH.table [ HP.class_ (HH.ClassName "w-full border-separate") ]
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
        opponentName = getOpponentName pid game pls
        result = case playerScore, opponentScore of
          Just ps, Just os ->
            if ps > os then { text: "Win", color: "text-red-600" }
            else if ps == os then { text: "Tie", color: "text-gray-600" }
            else { text: "Loss", color: "text-blue-600" }
          _, _ -> { text: "?", color: "text-gray-600" }
      in
        HH.tr_
          [ HH.td [ HP.class_ (HH.ClassName "whitespace-nowrap pr-4") ]
              [ HH.text $ "Round " <> show game.roundNumber <> ":" ]
          , HH.td [ HP.class_ (HH.ClassName "whitespace-nowrap pr-4") ]
              [ HH.text $ show (fromMaybe 0 playerScore) <> "-" <> show (fromMaybe 0 opponentScore) ]
          , HH.td [ HP.class_ (HH.ClassName $ "whitespace-nowrap font-extrabold pr-4 " <> result.color) ]
              [ HH.text result.text ]
          , HH.td_
              [ HH.text $ "vs " <> opponentName ]
          ]

-- | Render points display (avg points for/against with rankings)
renderPointsDisplay :: forall m. RankedPlayerStats -> Array RankedPlayerStats -> H.ComponentHTML Action () m
renderPointsDisplay player allPlayers =
  let
    avgScoreRank = calculateAverageScoreRank allPlayers player
    avgOppScoreRank = calculateAverageOpponentScoreRank allPlayers player
    avgScoreRankOrd = formatRankOrdinal avgScoreRank
    avgOppScoreRankOrd = formatRankOrdinal avgOppScoreRank
  in
    HH.div [ HP.class_ (HH.ClassName "mt-4 flex flex-col items-start text-black") ]
      [ HH.div [ HP.class_ (HH.ClassName "flex w-full") ]
          [ HH.div [ HP.class_ (HH.ClassName "mr-6") ]
              [ HH.div [ HP.class_ (HH.ClassName "text-base w-full text-left") ]
                  [ HH.text $ "Avg Points For: " <> show (round player.averageScore) ]
              , HH.div [ HP.class_ (HH.ClassName "text-base w-full text-left") ]
                  [ HH.text $ "Ranked: " <> avgScoreRankOrd ]
              ]
          , HH.div_
              [ HH.div [ HP.class_ (HH.ClassName "text-base w-full text-left") ]
                  [ HH.text $ "Avg Points Against: " <> show (round player.averageOpponentScore) ]
              , HH.div [ HP.class_ (HH.ClassName "text-base w-full text-left") ]
                  [ HH.text $ "Ranked: " <> avgOppScoreRankOrd ]
              ]
          ]
      ]

-- | Render combined points and game history (used by player1-points, player2-points, player1-game-history, player2-game-history)
renderPointsAndGameHistory :: forall m. RankedPlayerStats -> PlayerId -> Array Game -> Array RankedPlayerStats -> H.ComponentHTML Action () m
renderPointsAndGameHistory player playerId games allPlayers =
  HH.div [ HP.class_ (HH.ClassName "text-black") ]
    [ renderPointsDisplay player allPlayers
    , renderGameHistoryTable playerId games allPlayers
    ]
