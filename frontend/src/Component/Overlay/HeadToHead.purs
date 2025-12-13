-- | Head-to-Head Overlay
-- | Shows career head-to-head statistics between two players
module Component.Overlay.HeadToHead where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import Data.Array (take)
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Newtype (unwrap)
import Domain.Types (Player, TournamentSummary, Division)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import CSS.Class as C
import CSS.ThemeColor as TC
import Stats.HeadToHeadStats (H2HGameExt, H2HStats, PlayerRecord, getHeadToHeadGames, calculateH2HStats, sortGames, getPlaceOrSeedLabel, resolveAndFindPlayers)
import Stats.HeadToHeadGameLogic (calculateGameResult, getTournamentLocation)
import Types.Theme (Theme)
import Utils.CSS (css, cls, thm, raw)
import Utils.Date (toLocaleDateString)
import Utils.Format (formatPlayerName, formatLocation, getOrdinalSuffix, abbreviateTournamentName)
import Utils.PlayerImage (getPlayerImageUrl)

type HeadToHeadExtra = { playerId1 :: Int, playerId2 :: Int }

type State = BaseOverlay.State HeadToHeadExtra

type Action = BaseOverlay.Action

component :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input HeadToHeadExtra) output m
component = BaseOverlay.mkComponent render

-- | Data needed to render the head-to-head view
type H2HViewData =
  { theme :: Theme
  , player1 :: Player
  , player2 :: Player
  , tournament :: TournamentSummary
  , stats :: H2HStats
  , recentGames :: Array H2HGameExt
  }

-- | Prepare all data needed for rendering head-to-head view
prepareH2HViewData :: Theme -> Player -> Player -> TournamentSummary -> Division -> H2HViewData
prepareH2HViewData theme p1 p2 tournament division =
  let
    h2hGames = getHeadToHeadGames p1 p2 division tournament
    stats = calculateH2HStats p1 p2 h2hGames division
    recentGames = take 5 (sortGames h2hGames)
  in
    { theme
    , player1: p1
    , player2: p2
    , tournament
    , stats
    , recentGames
    }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  BaseOverlay.renderWithData state \tournamentData ->
    let
      { playerId1: playerId1Param, playerId2: playerId2Param } = state.extra
      maybePlayers = resolveAndFindPlayers playerId1Param playerId2Param state.currentMatch tournamentData.division
    in
      case maybePlayers of
        Nothing -> BaseOverlay.renderError "Players not found in division"
        Just { player1, player2 } ->
          let viewData = prepareH2HViewData state.theme player1 player2 tournamentData.tournament tournamentData.division
          in renderHeadToHead viewData

renderHeadToHead :: forall w i. H2HViewData -> HH.HTML w i
renderHeadToHead { theme, player1, player2, tournament, stats, recentGames } =
  HH.div
    [ css [thm theme TC.PageBackground, cls C.MinHScreen, cls C.Flex, cls C.ItemsCenter, cls C.JustifyCenter, cls C.P_4] ]
    [ HH.div
        [ css [cls C.MaxW_7xl, cls C.W_Full] ]
        [ -- Main Layout Grid
          HH.div
            [ css [cls C.Grid, raw "grid-cols-[2fr_1fr_2fr]", cls C.Gap_2, cls C.MaxW_6xl, cls C.Mx_Auto] ]
            [ -- Player 1 Card
              renderPlayerCard theme player1 tournament stats.player1Record stats.player1Position true
            , -- Center Section
              renderCenterSection theme stats
            , -- Player 2 Card
              renderPlayerCard theme player2 tournament stats.player2Record stats.player2Position false
            ]
        , -- Latest Games Table
          renderGamesTable theme player1 player2 recentGames
        ]
    ]

-- | Data needed to render a player card
type PlayerCardData =
  { imageUrl :: String
  , name :: String
  , location :: Maybe String
  , record :: PlayerRecord
  , position :: Int
  , placeSeedLabel :: String
  }

-- | Prepare data for rendering a player card
preparePlayerCardData :: Player -> TournamentSummary -> PlayerRecord -> Int -> PlayerCardData
preparePlayerCardData player tournament record position =
  let
    xtPhotoUrl = player.xtData >>= _.photourl
    imageUrl = getPlayerImageUrl tournament.dataUrl player.photo xtPhotoUrl
    location = formatLocation player.xtData
    placeSeedLabel = getPlaceOrSeedLabel record
  in
    { imageUrl
    , name: player.name
    , location
    , record
    , position
    , placeSeedLabel
    }

-- Render player card
renderPlayerCard :: forall w i. Theme -> Player -> TournamentSummary -> PlayerRecord -> Int -> Boolean -> HH.HTML w i
renderPlayerCard theme player tournament record position isLeft =
  let
    cardData = preparePlayerCardData player tournament record position
  in
    HH.div
      [ css [thm theme TC.CardBackground, thm theme TC.PrimaryBorder, cls C.Border_2, cls C.Rounded_2xl, cls C.P_4, cls C.Shadow_2xl, thm theme TC.ShadowColor] ]
      [ HH.div
          [ css [cls C.Flex, cls C.FlexCol] ]
          [ HH.div
              [ css $ [cls C.Flex, cls C.ItemsCenter, cls C.Gap_6, cls C.Mb_4] <> (if isLeft then [] else [cls C.FlexRowReverse]) ]
              [ -- Photo
                HH.img
                  [ HP.src cardData.imageUrl
                  , HP.alt cardData.name
                  , css [cls C.W_28, cls C.H_32, cls C.RoundedXl, cls C.ObjectCover, cls C.Border_2, raw "border-blue-400/50", cls C.ShadowLg]
                  ]
              , -- Name and Location
                HH.div
                  [ css $ (if isLeft then [] else [cls C.TextRight, cls C.Flex_1]) ]
                  [ HH.h2
                      [ css [thm theme TC.TextPrimary, cls C.Text_3xl, cls C.FontBold] ]
                      [ HH.text (formatPlayerName cardData.name) ]
                  , case cardData.location of
                      Just loc ->
                        HH.p
                          [ css [thm theme TC.TextSecondary, cls C.Text_Sm] ]
                          [ HH.text loc ]
                      Nothing -> HH.text ""
                  ]
              ]
          , -- Current Record
            HH.div
              [ css $ (if isLeft then [] else [cls C.TextRight]) ]
              [ HH.p
                  [ css [thm theme TC.TextSecondary, cls C.Text_Base, cls C.FontSemibold, cls C.Uppercase, cls C.TrackingWide, cls C.Mb_1] ]
                  [ HH.text "Current Record" ]
              , HH.p
                  [ css [thm theme TC.TextPrimary, cls C.Text_2xl, cls C.FontBold] ]
                  [ HH.text $ show cardData.record.wins <> "-" <> show cardData.record.losses <> " "
                      <> (if cardData.record.spread >= 0 then "+" else "") <> show cardData.record.spread
                      <> ", " <> show cardData.position <> getOrdinalSuffix cardData.position <> " " <> cardData.placeSeedLabel
                  ]
              ]
          ]
      ]

-- Render center VS section
renderCenterSection :: forall w i. Theme -> H2HStats -> HH.HTML w i
renderCenterSection theme stats =
  HH.div
    [ css [cls C.Flex, cls C.FlexCol, cls C.ItemsCenter, cls C.JustifyCenter] ]
    [ -- Title
      HH.div
        [ css [cls C.TextCenter, cls C.Mb_6] ]
        [ HH.h1
            [ css [thm theme TC.TextPrimary, cls C.Text_3xl, cls C.FontBlack, cls C.Opacity_90, cls C.TrackingWide, cls C.TextCenter, cls C.LeadingTight] ]
            [ HH.div_ [ HH.text "Career" ]
            , HH.div_ [ HH.text "Head-to-Head" ]
            ]
        ]
    , -- Score Display
      HH.div
        [ css [cls C.TextCenter] ]
        [ HH.div
            [ css [cls C.Flex, cls C.ItemsCenter, cls C.JustifyCenter, cls C.Gap_3, cls C.Mb_3] ]
            [ HH.span
                [ css [cls C.Text_5xl, cls C.FontBlack, cls C.DropShadowLg, thm theme TC.TextAccent] ]
                [ HH.text (show stats.player1Wins) ]
            , HH.div
                [ css [cls C.RoundedFull, cls C.W_16, cls C.H_16, cls C.Flex, cls C.ItemsCenter, cls C.JustifyCenter, cls C.ShadowXl, cls C.Ring_2, raw "bg-gradient-to-r from-blue-600 to-purple-600 ring-blue-400/50"] ]
                [ HH.span
                    [ css [cls C.TextWhite, cls C.FontBlack, cls C.Text_Lg] ]
                    [ HH.text "VS" ]
                ]
            , HH.span
                [ css [cls C.Text_5xl, cls C.FontBlack, cls C.DropShadowLg, thm theme TC.TextAccent] ]
                [ HH.text (show stats.player2Wins) ]
            ]
        , HH.div
            [ css [cls C.TextCenter] ]
            [ HH.p
                [ css [thm theme TC.TextSecondary, cls C.Text_Base, cls C.FontSemibold, cls C.Uppercase, cls C.TrackingWide] ]
                [ HH.text "Average Score" ]
            , HH.p
                [ css [thm theme TC.TextPrimary, cls C.Text_2xl, cls C.FontBold] ]
                [ HH.text $ show stats.player1AvgScore <> "-" <> show stats.player2AvgScore ]
            ]
        ]
    ]

-- Render games table
renderGamesTable :: forall w i. Theme -> Player -> Player -> Array H2HGameExt -> HH.HTML w i
renderGamesTable theme p1 p2 games =
  HH.div
    [ css [cls C.Mt_8, cls C.MaxW_6xl, cls C.Mx_Auto] ]
    [ HH.div
        [ css [cls C.Flex, cls C.JustifyCenter] ]
        [ HH.div
            [ css [cls C.W_Full]
            , HP.attr (HH.AttrName "style") "max-width: 56rem"
            ]
            [ HH.h3
                [ css [thm theme TC.TextSecondary, cls C.Text_Base, cls C.FontSemibold, cls C.Uppercase, cls C.TrackingWide, cls C.Mb_3, cls C.TextCenter] ]
                [ HH.text "Latest Games" ]
            , HH.div
                [ css [thm theme TC.CardBackground, cls C.RoundedXl, cls C.P_4, cls C.Border, thm theme TC.PrimaryBorder, cls C.Shadow_2xl, thm theme TC.ShadowColor] ]
                [ HH.table
                    [ css [cls C.W_Full, cls C.TableFixed, thm theme TC.TextPrimary] ]
                    [ HH.colgroup_
                        [ HH.col [ css [raw "w-[25%]"] ]
                        , HH.col [ css [raw "w-[10%]"] ]
                        , HH.col [ css [raw "w-[30%]"] ]
                        , HH.col [ css [raw "w-[10%]"] ]
                        , HH.col [ css [raw "w-[25%]"] ]
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
    result = calculateGameResult p1XtId game
    locationRaw = getTournamentLocation game
    location = abbreviateTournamentName locationRaw
  in
    HH.tr
      [ css [cls C.BorderB, thm theme TC.SecondaryBorder, raw "last:border-0", thm theme TC.HoverBackground, cls C.TransitionColors] ]
      [ HH.td
          [ css [cls C.Py_2, cls C.Px_4, thm theme TC.TextSecondary, cls C.Text_Lg, cls C.FontBold, cls C.TextLeft] ]
          [ HH.text (toLocaleDateString game.game.date) ]
      , HH.td
          [ css [cls C.Py_2, cls C.Px_2, cls C.TextCenter, cls C.FontBold, raw result.p1Color, cls C.Text_Lg] ]
          [ HH.text result.p1Result ]
      , HH.td
          [ css [cls C.Py_2, cls C.Px_2, cls C.TextCenter, thm theme TC.TextPrimary, cls C.FontMono, cls C.FontBold, cls C.Text_Xl] ]
          [ HH.text result.scores ]
      , HH.td
          [ css [cls C.Py_2, cls C.Px_2, cls C.TextCenter, cls C.FontBold, raw result.p2Color, cls C.Text_Lg] ]
          [ HH.text result.p2Result ]
      , HH.td
          [ css [cls C.Py_2, cls C.Px_4, thm theme TC.TextSecondary, cls C.Text_Lg, cls C.FontBold, cls C.TextRight]
          , HP.title location
          ]
          [ HH.div
              [ css [cls C.OverflowHidden, cls C.TextEllipsis, cls C.WhitespaceNowrap] ]
              [ HH.text (abbreviateTournamentName location) ]
          ]
      ]

