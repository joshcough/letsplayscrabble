-- | Head-to-Head Overlay
-- | Shows career head-to-head statistics between two players
module Component.HeadToHead where

import Prelude

import API.CurrentMatch as CurrentMatchAPI
import Config.Themes (getTheme)
import Data.Array (filter, find, foldl, sortBy, length, take, (..))
import Data.Array as Array
import Data.Either (Either(..))
import Data.Int as Int
import Data.Int (toNumber)
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Data.String (Pattern(..), split, replace, Replacement(..)) as String
import Data.String (Pattern(..), Replacement(..))
import Domain.Types (TournamentId(..), PlayerId(..), Division, Player, Tournament, HeadToHeadGame, CurrentMatch, Game, GameId(..), XTId(..))
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Effect.Class.Console (log)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Utils.PlayerImage (getPlayerImageUrl)
import Utils.Date (todayISO, toLocaleDateString)

type Input =
  { userId :: Int
  , tournamentId :: Maybe Int
  , divisionName :: Maybe String
  , playerId1 :: Maybe Int
  , playerId2 :: Maybe Int
  }

type State =
  { userId :: Int
  , tournamentId :: Maybe TournamentId
  , divisionName :: Maybe String
  , playerId1 :: Maybe Int
  , playerId2 :: Maybe Int
  , theme :: Theme
  , tournament :: Maybe Tournament
  , division :: Maybe Division
  , player1 :: Maybe Player
  , player2 :: Maybe Player
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
  , playerId1: input.playerId1
  , playerId2: input.playerId2
  , theme: getTheme "scrabble"
  , tournament: Nothing
  , division: Nothing
  , player1: Nothing
  , player2: Nothing
  , currentMatch: Nothing
  , loading: true
  , error: Nothing
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state
  | state.loading = renderLoading state.theme
  | otherwise = case state.error of
      Just err -> renderError state.theme err
      Nothing -> case state.player1, state.player2, state.tournament, state.division of
        Just p1, Just p2, Just tournament, Just division ->
          renderHeadToHead state.theme p1 p2 tournament division
        _, _, _, _ -> renderError state.theme "Players or tournament data not found"

renderLoading :: forall w i. Theme -> HH.HTML w i
renderLoading theme =
  HH.div
    [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
    [ HH.div
        [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-2xl") ]
        [ HH.text "Loading head-to-head..." ]
    ]

renderError :: forall w i. Theme -> String -> HH.HTML w i
renderError theme errorMsg =
  HH.div
    [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
    [ HH.div
        [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-2xl") ]
        [ HH.text errorMsg ]
    ]

renderHeadToHead :: forall w i. Theme -> Player -> Player -> Tournament -> Division -> HH.HTML w i
renderHeadToHead theme p1 p2 tournament division =
  let
    -- Get head-to-head games
    h2hGames = getHeadToHeadGames p1 p2 division tournament

    -- Calculate stats
    stats = calculateH2HStats p1 p2 h2hGames division

    -- Get recent games
    recentGames = take 5 (sortGames h2hGames)
  in
    HH.div
      [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-4") ]
      [ HH.div
          [ HP.class_ (HH.ClassName "max-w-7xl w-full") ]
          [ -- Main Layout Grid
            HH.div
              [ HP.class_ (HH.ClassName "grid grid-cols-[2fr_1fr_2fr] gap-2 max-w-6xl mx-auto") ]
              [ -- Player 1 Card
                renderPlayerCard theme p1 tournament stats.player1Record stats.player1Position true
              , -- Center Section
                renderCenterSection theme stats
              , -- Player 2 Card
                renderPlayerCard theme p2 tournament stats.player2Record stats.player2Position false
              ]
          , -- Latest Games Table
            renderGamesTable theme p1 p2 recentGames
          ]
      ]

-- Render player card
renderPlayerCard :: forall w i. Theme -> Player -> Tournament -> PlayerRecord -> Int -> Boolean -> HH.HTML w i
renderPlayerCard theme player tournament record position isLeft =
  let
    xtPhotoUrl = player.xtData >>= _.photourl
    imageUrl = getPlayerImageUrl tournament.dataUrl player.photo xtPhotoUrl
    location = formatLocation player.xtData
    placeSeedLabel = getPlaceOrSeedLabel record
  in
    HH.div
      [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " " <> theme.colors.primaryBorder <> " border-2 rounded-2xl p-4 shadow-2xl " <> theme.colors.shadowColor) ]
      [ HH.div
          [ HP.class_ (HH.ClassName "flex flex-col") ]
          [ HH.div
              [ HP.class_ (HH.ClassName $ "flex items-center gap-6 mb-4" <> if isLeft then "" else " flex-row-reverse") ]
              [ -- Photo
                HH.img
                  [ HP.src imageUrl
                  , HP.alt player.name
                  , HP.class_ (HH.ClassName "w-28 h-32 rounded-xl object-cover border-2 border-blue-400/50 shadow-lg")
                  ]
              , -- Name and Location
                HH.div
                  [ HP.class_ (HH.ClassName $ if isLeft then "" else "text-right flex-1") ]
                  [ HH.h2
                      [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-3xl font-bold") ]
                      [ HH.text (formatPlayerName player.name) ]
                  , case location of
                      Just loc ->
                        HH.p
                          [ HP.class_ (HH.ClassName $ theme.colors.textSecondary <> " text-sm") ]
                          [ HH.text loc ]
                      Nothing -> HH.text ""
                  ]
              ]
          , -- Current Record
            HH.div
              [ HP.class_ (HH.ClassName $ if isLeft then "" else "text-right") ]
              [ HH.p
                  [ HP.class_ (HH.ClassName $ theme.colors.textSecondary <> " text-base font-semibold uppercase tracking-wide mb-1") ]
                  [ HH.text "Current Record" ]
              , HH.p
                  [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-2xl font-bold") ]
                  [ HH.text $ show record.wins <> "-" <> show record.losses <> " "
                      <> (if record.spread >= 0 then "+" else "") <> show record.spread
                      <> ", " <> show position <> getOrdinalSuffix position <> " " <> placeSeedLabel
                  ]
              ]
          ]
      ]

-- Render center VS section
renderCenterSection :: forall w i. Theme -> H2HStats -> HH.HTML w i
renderCenterSection theme stats =
  HH.div
    [ HP.class_ (HH.ClassName "flex flex-col items-center justify-center") ]
    [ -- Title
      HH.div
        [ HP.class_ (HH.ClassName "text-center mb-6") ]
        [ HH.h1
            [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-3xl font-black opacity-90 tracking-wide text-center leading-tight") ]
            [ HH.div_ [ HH.text "Career" ]
            , HH.div_ [ HH.text "Head-to-Head" ]
            ]
        ]
    , -- Score Display
      HH.div
        [ HP.class_ (HH.ClassName "text-center") ]
        [ HH.div
            [ HP.class_ (HH.ClassName "flex items-center justify-center gap-3 mb-3") ]
            [ HH.span
                [ HP.class_ (HH.ClassName $ "text-5xl font-black drop-shadow-lg " <> theme.colors.textAccent) ]
                [ HH.text (show stats.player1Wins) ]
            , HH.div
                [ HP.class_ (HH.ClassName "rounded-full w-16 h-16 flex items-center justify-center shadow-xl ring-2 bg-gradient-to-r from-blue-600 to-purple-600 ring-blue-400/50") ]
                [ HH.span
                    [ HP.class_ (HH.ClassName "text-white font-black text-lg") ]
                    [ HH.text "VS" ]
                ]
            , HH.span
                [ HP.class_ (HH.ClassName $ "text-5xl font-black drop-shadow-lg " <> theme.colors.textAccent) ]
                [ HH.text (show stats.player2Wins) ]
            ]
        , HH.div
            [ HP.class_ (HH.ClassName "text-center") ]
            [ HH.p
                [ HP.class_ (HH.ClassName $ theme.colors.textSecondary <> " text-base font-semibold uppercase tracking-wide") ]
                [ HH.text "Average Score" ]
            , HH.p
                [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-2xl font-bold") ]
                [ HH.text $ show stats.player1AvgScore <> "-" <> show stats.player2AvgScore ]
            ]
        ]
    ]

-- Render games table
renderGamesTable :: forall w i. Theme -> Player -> Player -> Array H2HGameExt -> HH.HTML w i
renderGamesTable theme p1 p2 games =
  HH.div
    [ HP.class_ (HH.ClassName "mt-8 max-w-6xl mx-auto") ]
    [ HH.div
        [ HP.class_ (HH.ClassName "flex justify-center") ]
        [ HH.div
            [ HP.class_ (HH.ClassName "w-full")
            , HP.attr (HH.AttrName "style") "max-width: 56rem"
            ]
            [ HH.h3
                [ HP.class_ (HH.ClassName $ theme.colors.textSecondary <> " text-base font-semibold uppercase tracking-wide mb-3 text-center") ]
                [ HH.text "Latest Games" ]
            , HH.div
                [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " rounded-xl p-4 border " <> theme.colors.primaryBorder <> " shadow-2xl " <> theme.colors.shadowColor) ]
                [ HH.table
                    [ HP.class_ (HH.ClassName $ "w-full table-fixed " <> theme.colors.textPrimary) ]
                    [ HH.colgroup_
                        [ HH.col [ HP.class_ (HH.ClassName "w-[25%]") ]
                        , HH.col [ HP.class_ (HH.ClassName "w-[10%]") ]
                        , HH.col [ HP.class_ (HH.ClassName "w-[30%]") ]
                        , HH.col [ HP.class_ (HH.ClassName "w-[10%]") ]
                        , HH.col [ HP.class_ (HH.ClassName "w-[25%]") ]
                        ]
                    , HH.tbody_
                        (map (renderGameRow theme p1 p2) games)
                    ]
                ]
            ]
        ]
    ]

-- Render individual game row
renderGameRow :: forall w i. Theme -> Player -> Player -> H2HGameExt -> HH.HTML w i
renderGameRow theme p1 _ game =
  let
    p1XtId = fromMaybe 0 (map (\(XTId id) -> id) p1.xtid)
    p1Score = if game.game.player1.playerid == p1XtId
              then game.game.player1.score
              else game.game.player2.score
    p2Score = if game.game.player1.playerid == p1XtId
              then game.game.player2.score
              else game.game.player1.score

    isTie = p1Score == p2Score
    p1Won = not isTie && p1Score > p2Score
    p1Lost = not isTie && p1Score < p2Score

    scores = show p1Score <> "-" <> show p2Score
    winner = if isTie then "T" else if p1Won then "W" else "L"
    loser = if isTie then "T" else if p1Won then "L" else "W"

    winnerColor = if isTie then "text-black" else if p1Won then "text-red-600" else "text-blue-600"
    loserColor = if isTie then "text-black" else if p1Lost then "text-red-600" else "text-blue-600"

    locationRaw = case game.tournamentName of
      Just tn -> tn
      Nothing -> fromMaybe "Tournament" game.game.tourneyname
    location = abbreviateTournamentName locationRaw
  in
    HH.tr
      [ HP.class_ (HH.ClassName $ "border-b " <> theme.colors.secondaryBorder <> " last:border-0 " <> theme.colors.hoverBackground <> " transition-colors") ]
      [ HH.td
          [ HP.class_ (HH.ClassName $ "py-2 px-4 " <> theme.colors.textSecondary <> " text-lg font-bold text-left") ]
          [ HH.text (formatGameDate game.game.date) ]
      , HH.td
          [ HP.class_ (HH.ClassName $ "py-2 px-2 text-center font-bold " <> winnerColor <> " text-lg") ]
          [ HH.text winner ]
      , HH.td
          [ HP.class_ (HH.ClassName $ "py-2 px-2 text-center " <> theme.colors.textPrimary <> " font-mono font-bold text-xl") ]
          [ HH.text scores ]
      , HH.td
          [ HP.class_ (HH.ClassName $ "py-2 px-2 text-center font-bold " <> loserColor <> " text-lg") ]
          [ HH.text loser ]
      , HH.td
          [ HP.class_ (HH.ClassName $ "py-2 px-4 " <> theme.colors.textSecondary <> " text-lg font-bold text-right")
          , HP.title location
          ]
          [ HH.div
              [ HP.class_ (HH.ClassName "overflow-hidden text-ellipsis whitespace-nowrap") ]
              [ HH.text (abbreviateTournamentName location) ]
          ]
      ]

-- Types for calculations
type PlayerRecord = { wins :: Int, losses :: Int, spread :: Int }
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

type H2HGameExt =
  { game :: HeadToHeadGame
  , tournamentName :: Maybe String
  , isCurrentTournament :: Boolean
  }

-- Helper functions

formatPlayerName :: String -> String
formatPlayerName name =
  let parts = String.split (Pattern ", ") name
  in case parts of
      [last, first] -> first <> " " <> last
      _ -> name

formatLocation :: forall r. Maybe { city :: Maybe String, state :: Maybe String, country :: Maybe String | r } -> Maybe String
formatLocation Nothing = Nothing
formatLocation (Just xtData) =
  case xtData.city of
    Nothing -> Nothing
    Just city -> Just $ case xtData.state of
      Just state -> city <> ", " <> state
      Nothing -> city

getPlaceOrSeedLabel :: PlayerRecord -> String
getPlaceOrSeedLabel record =
  if record.wins == 0 && record.losses == 0 then "Seed" else "Place"

getOrdinalSuffix :: Int -> String
getOrdinalSuffix num =
  let j = num `mod` 10
      k = num `mod` 100
  in if j == 1 && k /= 11 then "st"
     else if j == 2 && k /= 12 then "nd"
     else if j == 3 && k /= 13 then "rd"
     else "th"

-- Format date from ISO string to locale date string (e.g., "9/13/2025")
formatDate :: String -> String
formatDate isoDate =
  -- Parse ISO date string like "2025-09-13T04:00:00.000Z" or just "2025-09-13"
  -- Extract just the date part and format as M/D/YYYY
  let datePart = case String.split (Pattern "T") isoDate of
                   [part, _] -> part  -- Has time component
                   [part] -> part      -- Just date
                   _ -> isoDate        -- Fallback
  in case String.split (Pattern "-") datePart of
       [year, month, day] ->
         let monthInt = fromMaybe 1 (Int.fromString month)
             dayInt = fromMaybe 1 (Int.fromString day)
         in show monthInt <> "/" <> show dayInt <> "/" <> year
       _ -> isoDate

-- Abbreviate tournament names to save space
abbreviateTournamentName :: String -> String
abbreviateTournamentName name =
  name
    # String.replace (Pattern "International") (Replacement "Int'l")
    # String.replace (Pattern "Tournament") (Replacement "Tourney")
    # String.replace (Pattern "National") (Replacement "Nat'l")
    # String.replace (Pattern "Invitational") (Replacement "Invit'l")

formatGameDate :: String -> String
formatGameDate = toLocaleDateString

-- Get head-to-head games
getHeadToHeadGames :: Player -> Player -> Division -> Tournament -> Array H2HGameExt
getHeadToHeadGames p1 p2 division tournament =
  let
    p1XtId = fromMaybe 0 (map (\(XTId id) -> id) p1.xtid)
    p2XtId = fromMaybe 0 (map (\(XTId id) -> id) p2.xtid)

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

-- Convert current tournament game to HeadToHeadGame
convertGameToH2H :: Player -> Player -> Tournament -> Game -> HeadToHeadGame
convertGameToH2H p1 p2 tournament game =
  let
    p1XtId = fromMaybe 0 (map (\(XTId id) -> id) p1.xtid)
    p2XtId = fromMaybe 0 (map (\(XTId id) -> id) p2.xtid)
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

-- Calculate head-to-head statistics
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
    player1Position = fromMaybe 1 (Array.findIndex (\p -> p.id == p1.id) sortedPlayers) + 1
    player2Position = fromMaybe 1 (Array.findIndex (\p -> p.id == p2.id) sortedPlayers) + 1
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

-- Calculate player's record in division
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

-- Compare players by record for sorting
comparePlayersByRecord :: Player -> Player -> Ordering
comparePlayersByRecord a b =
  let
    -- This is a simplified comparison - in reality we'd need access to division
    -- For now, just compare by ID
    PlayerId aId = a.id
    PlayerId bId = b.id
  in compare aId bId

-- Sort games (most recent first, current tournament games first)
sortGames :: Array H2HGameExt -> Array H2HGameExt
sortGames = sortBy \a b ->
  case a.isCurrentTournament, b.isCurrentTournament of
    true, false -> LT
    false, true -> GT
    _, _ -> compare b.game.date a.game.date

handleAction :: forall output m. MonadAff m => Action -> H.HalogenM State Action () output m Unit
handleAction = case _ of
  Initialize -> do
    liftEffect $ log "[HeadToHead] Initialize"
    state <- H.get
    case state.tournamentId of
      Nothing -> handleAction LoadCurrentMatch
      Just _ -> handleAction LoadTournamentData

  LoadCurrentMatch -> do
    state <- H.get
    liftEffect $ log "[HeadToHead] Loading current match"

    result <- H.liftAff $ CurrentMatchAPI.getCurrentMatch state.userId
    case result of
      Left err -> do
        liftEffect $ log $ "[HeadToHead] Error loading current match: " <> err
        H.modify_ _ { loading = false, error = Just "No current match set" }

      Right Nothing -> do
        liftEffect $ log "[HeadToHead] No current match"
        H.modify_ _ { loading = false, error = Just "No current match set" }

      Right (Just currentMatch) -> do
        liftEffect $ log $ "[HeadToHead] Current match loaded"
        H.modify_ _
          { currentMatch = Just currentMatch
          , tournamentId = Just currentMatch.tournamentId
          , divisionName = Just currentMatch.divisionName
          }
        handleAction LoadTournamentData

  LoadTournamentData -> do
    state <- H.get
    liftEffect $ log $ "[HeadToHead] Loading tournament data"

    case state.tournamentId of
      Nothing -> do
        liftEffect $ log "[HeadToHead] No tournament ID"
        H.modify_ _ { loading = false, error = Just "No tournament ID" }

      Just (TournamentId tid) -> do
        result <- H.liftAff $ CurrentMatchAPI.getTournament state.userId tid
        case result of
          Left err -> do
            liftEffect $ log $ "[HeadToHead] Error loading tournament: " <> err
            H.modify_ _ { loading = false, error = Just err }

          Right tournament -> do
            liftEffect $ log $ "[HeadToHead] Tournament loaded, finding division and players"

            -- Find the division
            let maybeDivision = case state.divisionName of
                  Just divName -> find (\d -> d.name == divName) tournament.divisions
                  Nothing -> Array.head tournament.divisions

            case maybeDivision of
              Nothing -> do
                liftEffect $ log "[HeadToHead] Division not found"
                H.modify_ _ { loading = false, error = Just "Division not found" }

              Just division -> do
                -- Find the players
                let
                  findPlayers = case state.playerId1, state.playerId2 of
                    Just id1, Just id2 ->
                      -- Explicit player IDs mode
                      { p1: find (\p -> let PlayerId pid = p.id in pid == id1) division.players
                      , p2: find (\p -> let PlayerId pid = p.id in pid == id2) division.players
                      }
                    _, _ ->
                      -- Current match mode
                      case state.currentMatch of
                        Just currentMatch ->
                          case find (\g -> g.pairingId == Just currentMatch.pairingId && g.roundNumber == currentMatch.round) division.games of
                            Just game ->
                              { p1: find (\p -> p.id == game.player1Id) division.players
                              , p2: find (\p -> p.id == game.player2Id) division.players
                              }
                            Nothing -> { p1: Nothing, p2: Nothing }
                        Nothing -> { p1: Nothing, p2: Nothing }

                case findPlayers.p1, findPlayers.p2 of
                  Just player1, Just player2 -> do
                    liftEffect $ log "[HeadToHead] Both players found, rendering"
                    H.modify_ _
                      { tournament = Just tournament
                      , division = Just division
                      , player1 = Just player1
                      , player2 = Just player2
                      , theme = getTheme tournament.theme
                      , loading = false
                      }

                  _, _ -> do
                    liftEffect $ log "[HeadToHead] One or both players not found"
                    H.modify_ _ { loading = false, error = Just "Players not found" }
