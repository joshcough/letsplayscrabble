-- | Head-to-Head Overlay
-- | Shows career head-to-head statistics between two players
module Component.Overlay.HeadToHead where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import Data.Array (take)
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Newtype (unwrap)
import Domain.Types (Player, TournamentSummary, Division, XTId(..))
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Stats.HeadToHeadStats (H2HGameExt, H2HStats, PlayerRecord, getHeadToHeadGames, calculateH2HStats, sortGames, getPlaceOrSeedLabel, resolveAndFindPlayers)
import Types.Theme (Theme)
import Utils.Date (toLocaleDateString)
import Utils.Format (formatPlayerName, formatLocation, getOrdinalSuffix, abbreviateTournamentName)
import Utils.PlayerImage (getPlayerImageUrl)

type HeadToHeadExtra = { playerId1 :: Int, playerId2 :: Int }

type State = BaseOverlay.State HeadToHeadExtra

type Action = BaseOverlay.Action

component :: forall query output m. MonadAff m => H.Component query (BaseOverlay.Input HeadToHeadExtra) output m
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
      s = unwrap state
      { playerId1: playerId1Param, playerId2: playerId2Param } = s.extra
      maybePlayers = resolveAndFindPlayers playerId1Param playerId2Param s.currentMatch tournamentData.division
    in
      case maybePlayers of
        Nothing -> BaseOverlay.renderError "Players not found in division"
        Just { player1, player2 } -> renderHeadToHead s.theme player1 player2 tournamentData.tournament tournamentData.division

renderHeadToHead :: forall w i. Theme -> Player -> Player -> TournamentSummary -> Division -> HH.HTML w i
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
renderPlayerCard :: forall w i. Theme -> Player -> TournamentSummary -> PlayerRecord -> Int -> Boolean -> HH.HTML w i
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
    p1XtId = fromMaybe 0 (unwrap <$> p1.xtid)
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

-- | Format game date wrapper
formatGameDate :: String -> String
formatGameDate = toLocaleDateString

