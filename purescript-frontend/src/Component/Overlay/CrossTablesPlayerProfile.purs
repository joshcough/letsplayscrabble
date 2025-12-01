-- | CrossTables Player Profile Overlay
-- | Displays detailed player stats from CrossTables data
module Component.Overlay.CrossTablesPlayerProfile where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Control.Alt ((<|>))
import Data.Array (find, head, last)
import Data.Int (toNumber, round) as Int
import Data.Maybe (Maybe(..), fromMaybe, maybe, isNothing)
import Data.Newtype (unwrap)
import Data.Number (pow)
import Data.String (Pattern(..), split, joinWith, take, drop) as String
import Data.String (Pattern(..))
import Domain.Types (PlayerId(..), Player, CrossTablesPlayer, TournamentResult, TournamentSummary)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Utils.PlayerImage (getPlayerImageUrl)

type State = BaseOverlay.State Int

type Action = BaseOverlay.Action

component :: forall query output m. MonadAff m => H.Component query (BaseOverlay.Input Int) output m
component = H.mkComponent
  { initialState: BaseOverlay.initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = BaseOverlay.handleAction
      , initialize = Just BaseOverlay.Initialize
      , finalize = Just BaseOverlay.Finalize
      }
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  BaseOverlay.renderWithData state \tournamentData ->
    let
      playerIdParam = state.extra

      -- Determine actual player ID based on mode:
      -- If currentMatch exists and playerIdParam is 1 or 2, extract from current game
      -- Otherwise use playerIdParam directly as the actual player ID
      maybePlayer = case state.currentMatch of
        Just currentMatch | playerIdParam == 1 || playerIdParam == 2 -> do
          -- Find current game from the match
          game <- find (\g -> maybe false (\pid -> unwrap pid == currentMatch.pairingId) g.pairingId && g.roundNumber == currentMatch.round) tournamentData.division.games
          -- Get actual player ID based on playerIdParam (1 or 2)
          let actualPlayerId = if playerIdParam == 1
                then unwrap game.player1Id
                else unwrap game.player2Id
          -- Find player by actual ID
          find (\p -> unwrap p.id == actualPlayerId) tournamentData.division.players
        _ ->
          -- Specific player mode - use playerIdParam directly as actual player ID
          find (\p -> unwrap p.id == playerIdParam) tournamentData.division.players
    in
      case maybePlayer of
        Nothing -> BaseOverlay.renderError $ "Player " <> show playerIdParam <> " not found in division"
        Just player -> renderPlayerProfile state.theme player tournamentData.tournament

renderPlayerProfile :: forall w i. Theme -> Player -> TournamentSummary -> HH.HTML w i
renderPlayerProfile theme player tournament =
  let
    location = formatLocation player.xtData
    rating = getCurrentRating player
    ranking = getRanking player.xtData
    winPercentage = calculateWinPercentage player.xtData
    tournamentCount = maybe Nothing (_.tournamentCount) player.xtData
    averageScore = maybe Nothing (_.averageScore) player.xtData
    opponentAvgScore = maybe Nothing (_.opponentAverageScore) player.xtData
    recentTournament = getRecentTournament player.xtData
  in
    HH.div
      [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
      [ HH.div
          [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " rounded-3xl p-8 border-2 " <> theme.colors.primaryBorder <> " shadow-2xl " <> theme.colors.shadowColor <> " min-w-[32rem]") ]
          [ HH.div
              [ HP.class_ (HH.ClassName "flex gap-8") ]
              [ -- Photo Section
                HH.div
                  [ HP.class_ (HH.ClassName "flex-shrink-0") ]
                  [ renderPlayerImage player tournament
                  , case location of
                      Just loc ->
                        HH.div
                          [ HP.class_ (HH.ClassName $ "text-xl font-bold " <> theme.colors.textAccent <> " mt-4 text-center") ]
                          [ HH.text loc ]
                      Nothing -> HH.text ""
                  ]
              , -- Stats Section
                HH.div
                  [ HP.class_ (HH.ClassName "flex-grow") ]
                  [ HH.h2
                      [ HP.class_ (HH.ClassName $ "text-5xl font-black mb-3 " <> theme.colors.textPrimary) ]
                      [ HH.text (formatPlayerName player.name) ]
                  , HH.div
                      [ HP.class_ (HH.ClassName "grid grid-cols-2 gap-6") ]
                      (renderStatsGrid theme rating ranking tournamentCount player.xtData averageScore opponentAvgScore winPercentage)

                  , case recentTournament of
                      Just rt -> renderRecentTournament theme rt
                      Nothing -> HH.text ""
                  ]
              ]
          ]
      ]

renderPlayerImage :: forall w i. Player -> TournamentSummary -> HH.HTML w i
renderPlayerImage player tournament =
  let
    xtPhotoUrl = player.xtData >>= _.photourl
    imageUrl = getPlayerImageUrl tournament.dataUrl player.photo xtPhotoUrl
  in
    HH.img
      [ HP.src imageUrl
      , HP.alt player.name
      , HP.class_ (HH.ClassName "w-40 h-40 rounded-2xl object-cover border-2 border-blue-400/50 shadow-lg")
      ]

renderStatsGrid :: forall w i. Theme -> Maybe Int -> Maybe Int -> Maybe Int -> Maybe CrossTablesPlayer -> Maybe Int -> Maybe Int -> Maybe Number -> Array (HH.HTML w i)
renderStatsGrid theme rating ranking tournamentCount xtData averageScore opponentAvgScore winPercentage =
  let
    ratingBox = case rating of
      Just r -> [renderStatBox theme "Rating" (show r) false false]
      Nothing -> []

    rankingBox = case ranking of
      Just r -> [renderStatBox theme "Ranking" (show r) false false]
      Nothing -> []

    tournamentBox = case tournamentCount of
      Just tc -> [renderStatBox theme "Tournaments" (show tc) false false]
      Nothing -> []

    recordBoxes = case xtData of
      Just xt -> case xt.w, xt.l, xt.t of
        Just w, Just l, Just t ->
          [ renderStatBox theme "Career Record" (show w <> "-" <> show l <> "-" <> show t) true false
          , case winPercentage of
              Just wp -> renderStatBox theme "Career Win %" (formatNumber wp 1 <> "%") false false
              Nothing -> HH.text ""
          ]
        _, _, _ -> []
      Nothing -> []

    avgScoreBox = case averageScore of
      Just avg ->
        let scoreText = case opponentAvgScore of
              Just oppAvg -> show (Int.round (Int.toNumber avg)) <> "-" <> show (Int.round (Int.toNumber oppAvg))
              Nothing -> show (Int.round (Int.toNumber avg))
            -- col-span-2 if no ranking
            shouldSpan = isNothing ranking
        in [renderStatBox theme "Average Score" scoreText true shouldSpan]
      Nothing -> []
  in
    ratingBox <> rankingBox <> tournamentBox <> recordBoxes <> avgScoreBox

renderStatBox :: forall w i. Theme -> String -> String -> Boolean -> Boolean -> HH.HTML w i
renderStatBox theme label value useMono colSpan2 =
  HH.div
    [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " rounded-xl p-3 border " <> theme.colors.secondaryBorder <> (if colSpan2 then " col-span-2" else "")) ]
    [ HH.div
        [ HP.class_ (HH.ClassName $ theme.colors.textAccent <> " text-base font-bold uppercase tracking-wider mb-1") ]
        [ HH.text label ]
    , HH.div
        [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-3xl font-black" <> (if useMono then " font-mono" else "")) ]
        [ HH.text value ]
    ]

renderRecentTournament :: forall w i. Theme -> TournamentResult -> HH.HTML w i
renderRecentTournament theme result =
  let isWin = result.place == 1
  in
    HH.div
      [ HP.class_ (HH.ClassName $ "mt-5 p-4 " <> theme.colors.cardBackground <> " rounded-xl border " <> theme.colors.primaryBorder) ]
      [ HH.div
          [ HP.class_ (HH.ClassName $ theme.colors.textAccent <> " text-xl font-bold mb-2") ]
          [ HH.text if isWin then "🏆 Recent Tournament Win" else "Recent Tournament" ]
      , HH.div
          [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-2xl font-bold mb-3") ]
          [ HH.text result.name ]
      , HH.table_
          [ HH.tbody_
              [ HH.tr_
                  [ HH.td
                      [ HP.class_ (HH.ClassName $ theme.colors.textAccent <> " text-xl font-semibold opacity-70 pr-3 align-top whitespace-nowrap") ]
                      [ HH.text "Date:" ]
                  , HH.td
                      [ HP.class_ (HH.ClassName $ theme.colors.textAccent <> " text-xl font-bold") ]
                      [ HH.text (formatDate result.date) ]
                  ]
              , HH.tr_
                  [ HH.td
                      [ HP.class_ (HH.ClassName $ theme.colors.textAccent <> " text-xl font-semibold opacity-70 pr-3 align-top whitespace-nowrap") ]
                      [ HH.text "Record:" ]
                  , HH.td
                      [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " font-mono text-xl font-bold") ]
                      [ HH.text (show result.wins <> "-" <> show result.losses) ]
                  ]
              ]
          ]
      ]

-- Helper Functions

formatLocation :: Maybe CrossTablesPlayer -> Maybe String
formatLocation xtData = do
  data' <- xtData
  city <- data'.city
  pure $ case data'.state, data'.country of
    Just state, _ -> city <> ", " <> state
    Nothing, Just country | country /= "USA" -> city <> ", " <> country
    _, _ -> city

getCurrentRating :: Player -> Maybe Int
getCurrentRating player =
  case player.ratingsHistory of
    [] -> Just player.initialRating
    ratings -> last ratings <|> Just player.initialRating

getRanking :: Maybe CrossTablesPlayer -> Maybe Int
getRanking xtData = do
  data' <- xtData
  data'.twlranking <|> data'.cswranking

calculateWinPercentage :: Maybe CrossTablesPlayer -> Maybe Number
calculateWinPercentage xtData = do
  data' <- xtData
  wins <- data'.w
  losses <- data'.l
  ties <- data'.t
  let totalGames = wins + losses + ties
  if totalGames == 0
    then pure 0.0
    else do
      let effectiveWins = Int.toNumber wins + (Int.toNumber ties * 0.5)
          percentage = (effectiveWins / Int.toNumber totalGames) * 100.0
      pure $ Int.toNumber (Int.round (percentage * 10.0)) / 10.0

getRecentTournament :: Maybe CrossTablesPlayer -> Maybe TournamentResult
getRecentTournament xtData = do
  results <- xtData >>= _.results
  -- Find recent win first, otherwise take first result
  find (\r -> r.place == 1) results <|> head results

formatPlayerName :: String -> String
formatPlayerName name =
  let parts = String.split (Pattern ", ") name
  in case parts of
      [last, first] -> first <> " " <> last
      _ -> name

getInitials :: String -> String
getInitials name =
  let formatted = formatPlayerName name
      words = String.split (Pattern " ") formatted
      initials = map (\w -> fromMaybe "" (head (String.split (Pattern "") w))) words
  in String.joinWith "" initials

formatNumber :: Number -> Int -> String
formatNumber num decimals =
  let factor = pow 10.0 (Int.toNumber decimals)
      rounded = Int.toNumber (Int.round (num * factor)) / factor
  in show rounded

formatDate :: String -> String
formatDate dateString =
  case String.split (Pattern "-") dateString of
    [year, month, day] ->
      let
        monthName = case month of
          "01" -> "Jan"
          "02" -> "Feb"
          "03" -> "Mar"
          "04" -> "Apr"
          "05" -> "May"
          "06" -> "Jun"
          "07" -> "Jul"
          "08" -> "Aug"
          "09" -> "Sep"
          "10" -> "Oct"
          "11" -> "Nov"
          "12" -> "Dec"
          _ -> month
        -- Remove leading zero from day
        dayNum = case day of
          d | String.take 1 d == "0" -> String.drop 1 d
          d -> d
      in monthName <> " " <> dayNum <> ", " <> year
    _ -> dateString

