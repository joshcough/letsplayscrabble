-- | CrossTables Player Profile Overlay
-- | Displays detailed player stats from CrossTables data
module Component.Overlay.CrossTablesPlayerProfile where

import Prelude

import API.CurrentMatch as CurrentMatchAPI
import Config.Themes (getTheme)
import Data.Array (find, head, last)
import Data.Either (Either(..))
import Utils.PlayerImage (getPlayerImageUrl)
import Data.Int (toNumber, round) as Int
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Data.Number (pow)
import Data.String (Pattern(..), split, joinWith, take, drop) as String
import Data.String (Pattern(..))
import Domain.Types (TournamentId(..), PlayerId(..), Division, Player, Tournament, CrossTablesPlayer, TournamentResult, CurrentMatch)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Effect.Class.Console (log)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)

type Input =
  { userId :: Int
  , tournamentId :: Maybe Int
  , divisionName :: Maybe String
  , playerId :: Int
  }

type State =
  { userId :: Int
  , tournamentId :: Maybe TournamentId
  , divisionName :: Maybe String
  , playerId :: Int
  , theme :: Theme
  , tournament :: Maybe Tournament
  , division :: Maybe Division
  , player :: Maybe Player
  , currentMatch :: Maybe CurrentMatch
  , loading :: Boolean
  , error :: Maybe String
  }

data Action
  = Initialize
  | LoadCurrentMatch
  | LoadTournamentData

component :: forall query output m. MonadAff m => H.Component query Input output m
component = H.mkComponent
  { initialState
  , render
  , eval: H.mkEval H.defaultEval
      { handleAction = handleAction
      , initialize = Just Initialize
      }
  }

initialState :: Input -> State
initialState input =
  { userId: input.userId
  , tournamentId: map TournamentId input.tournamentId
  , divisionName: input.divisionName
  , playerId: input.playerId
  , theme: getTheme "scrabble"
  , tournament: Nothing
  , division: Nothing
  , player: Nothing
  , currentMatch: Nothing
  , loading: true
  , error: Nothing
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state
  | state.loading = renderLoading state.theme
  | otherwise = case state.error of
      Just err -> renderError state.theme err
      Nothing -> case state.player, state.tournament of
        Just player, Just tournament -> renderPlayerProfile state.theme player tournament
        _, _ -> renderError state.theme "Player or tournament data not found"

renderLoading :: forall w i. Theme -> HH.HTML w i
renderLoading theme =
  HH.div
    [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
    [ HH.div
        [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-2xl") ]
        [ HH.text "Loading player profile..." ]
    ]

renderError :: forall w i. Theme -> String -> HH.HTML w i
renderError theme errorMsg =
  HH.div
    [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
    [ HH.div
        [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-2xl") ]
        [ HH.text errorMsg ]
    ]

renderPlayerProfile :: forall w i. Theme -> Player -> Tournament -> HH.HTML w i
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

renderPlayerImage :: forall w i. Player -> Tournament -> HH.HTML w i
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
            shouldSpan = case ranking of
              Nothing -> true
              Just _ -> false
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
formatLocation Nothing = Nothing
formatLocation (Just xtData) =
  case xtData.city of
    Nothing -> Nothing
    Just city -> Just $ case xtData.state, xtData.country of
      Just state, _ -> city <> ", " <> state
      Nothing, Just country | country /= "USA" -> city <> ", " <> country
      _, _ -> city

getCurrentRating :: Player -> Maybe Int
getCurrentRating player =
  case player.ratingsHistory of
    [] -> Just player.initialRating
    ratings -> case last ratings of
      Just lastRating -> Just lastRating
      Nothing -> Just player.initialRating

getRanking :: Maybe CrossTablesPlayer -> Maybe Int
getRanking Nothing = Nothing
getRanking (Just xtData) =
  case xtData.twlranking of
    Just r -> Just r
    Nothing -> xtData.cswranking

calculateWinPercentage :: Maybe CrossTablesPlayer -> Maybe Number
calculateWinPercentage Nothing = Nothing
calculateWinPercentage (Just xtData) =
  case xtData.w, xtData.l, xtData.t of
    Just wins, Just losses, Just ties ->
      let totalGames = wins + losses + ties
      in if totalGames == 0
         then Just 0.0
         else
           let effectiveWins = Int.toNumber wins + (Int.toNumber ties * 0.5)
               percentage = (effectiveWins / Int.toNumber totalGames) * 100.0
           in Just (Int.toNumber (Int.round (percentage * 10.0)) / 10.0)
    _, _, _ -> Nothing

getRecentTournament :: Maybe CrossTablesPlayer -> Maybe TournamentResult
getRecentTournament Nothing = Nothing
getRecentTournament (Just xtData) =
  case xtData.results of
    Nothing -> Nothing
    Just results ->
      -- Find recent win first, otherwise take first result
      case find (\r -> r.place == 1) results of
        Just win -> Just win
        Nothing -> head results

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

handleAction :: forall output m. MonadAff m => Action -> H.HalogenM State Action () output m Unit
handleAction = case _ of
  Initialize -> do
    liftEffect $ log "[CrossTablesPlayerProfile] Initialize"
    state <- H.get
    case state.tournamentId of
      Nothing -> handleAction LoadCurrentMatch
      Just _ -> handleAction LoadTournamentData

  LoadCurrentMatch -> do
    state <- H.get
    liftEffect $ log "[CrossTablesPlayerProfile] Loading current match"

    result <- H.liftAff $ CurrentMatchAPI.getCurrentMatch state.userId
    case result of
      Left err -> do
        liftEffect $ log $ "[CrossTablesPlayerProfile] Error loading current match: " <> err
        H.modify_ _ { loading = false, error = Just "No current match set. Please use the Current Match admin page to select a match." }

      Right Nothing -> do
        liftEffect $ log "[CrossTablesPlayerProfile] No current match"
        H.modify_ _ { loading = false, error = Just "No current match set. Please use the Current Match admin page to select a match." }

      Right (Just currentMatch) -> do
        liftEffect $ log $ "[CrossTablesPlayerProfile] Current match loaded: " <> currentMatch.divisionName
        H.modify_ _
          { currentMatch = Just currentMatch
          , tournamentId = Just currentMatch.tournamentId
          , divisionName = Just currentMatch.divisionName
          }
        handleAction LoadTournamentData

  LoadTournamentData -> do
    state <- H.get
    liftEffect $ log $ "[CrossTablesPlayerProfile] Loading tournament data for player " <> show state.playerId

    case state.tournamentId of
      Nothing -> do
        liftEffect $ log "[CrossTablesPlayerProfile] No tournament ID provided"
        H.modify_ _ { loading = false, error = Just "No tournament ID provided" }

      Just (TournamentId tid) -> do
        result <- H.liftAff $ CurrentMatchAPI.getTournament state.userId tid
        case result of
          Left err -> do
            liftEffect $ log $ "[CrossTablesPlayerProfile] Error loading tournament: " <> err
            H.modify_ _ { loading = false, error = Just err }

          Right tournament -> do
            liftEffect $ log $ "[CrossTablesPlayerProfile] Tournament loaded, finding division and player"

            -- Find the division
            let maybeDivision = case state.divisionName of
                  Just divName -> find (\d -> d.name == divName) tournament.divisions
                  Nothing -> head tournament.divisions

            case maybeDivision of
              Nothing -> do
                liftEffect $ log "[CrossTablesPlayerProfile] Division not found"
                H.modify_ _ { loading = false, error = Just "Division not found" }

              Just division -> do
                -- Find the player - either by explicit ID or from current match
                let maybePlayer = case state.currentMatch of
                      Just currentMatch -> do
                        -- Find current game
                        game <- find (\g -> g.pairingId == Just currentMatch.pairingId && g.roundNumber == currentMatch.round) division.games
                        -- Get player ID based on playerId parameter (1 or 2)
                        let targetPlayerId = if state.playerId == 1
                              then let PlayerId pid = game.player1Id in pid
                              else let PlayerId pid = game.player2Id in pid
                        -- Find player by ID
                        find (\p -> let PlayerId pid = p.id in pid == targetPlayerId) division.players
                      Nothing ->
                        -- Specific player mode - find by explicit ID
                        find (\p -> let PlayerId pid = p.id in pid == state.playerId) division.players

                case maybePlayer of
                  Nothing -> do
                    liftEffect $ log $ "[CrossTablesPlayerProfile] Player " <> show state.playerId <> " not found"
                    H.modify_ _ { loading = false, error = Just ("Player " <> show state.playerId <> " not found") }

                  Just player -> do
                    liftEffect $ log "[CrossTablesPlayerProfile] Player found, rendering profile"
                    H.modify_ _
                      { tournament = Just tournament
                      , division = Just division
                      , player = Just player
                      , theme = getTheme tournament.theme
                      , loading = false
                      }
