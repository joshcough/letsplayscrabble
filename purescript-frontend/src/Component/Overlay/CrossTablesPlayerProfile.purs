-- | CrossTables Player Profile Overlay
-- | Displays detailed player stats from CrossTables data
module Component.Overlay.CrossTablesPlayerProfile where

import Prelude

import Component.Overlay.BaseOverlay as BaseOverlay
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import Data.Array (find)
import Data.Int (toNumber, round) as Int
import Data.Maybe (Maybe(..), maybe, isNothing)
import Data.Newtype (unwrap)
import Domain.Types (Player, TournamentSummary, CrossTablesPlayer, TournamentResult)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import CSS.Class as C
import CSS.ThemeColor as TC
import Types.Theme (Theme)
import Utils.CSS (css, cls, thm, raw)
import Utils.Format (formatPlayerName, formatLocation, getCurrentRating, getRanking, calculateWinPercentage, getRecentTournament, formatNumber, formatDate)
import Utils.PlayerImage (getPlayerImageUrl)
import Domain.Types (Game, PairingId(..))

type State = BaseOverlay.State Int

type Action = BaseOverlay.Action

--------------------------------------------------------------------------------
-- Data preparation functions
--------------------------------------------------------------------------------

-- | Resolve the actual player ID based on current match mode
-- | If in current match mode and playerIdParam is 1 or 2, extract from current game
-- | Otherwise use playerIdParam directly as the actual player ID
resolvePlayerId :: forall r. Int -> Maybe { round :: Int, pairingId :: Int | r } -> Array Game -> Maybe Int
resolvePlayerId playerIdParam maybeCurrentMatch games =
  case maybeCurrentMatch of
    Just currentMatch | playerIdParam == 1 || playerIdParam == 2 -> do
      -- Find current game from the match
      game <- find (\g -> maybe false (\(PairingId pid) -> pid == currentMatch.pairingId) g.pairingId && g.roundNumber == currentMatch.round) games
      -- Get actual player ID based on playerIdParam (1 or 2)
      pure $ unwrap $ if playerIdParam == 1 then game.player1Id else game.player2Id
    _ ->
      -- Specific player mode - use playerIdParam directly as actual player ID
      Just playerIdParam

-- | Profile data extracted from player and xtData
type ProfileData =
  { location :: Maybe String
  , rating :: Maybe Int
  , ranking :: Maybe Int
  , winPercentage :: Maybe Number
  , tournamentCount :: Maybe Int
  , averageScore :: Maybe Int
  , opponentAvgScore :: Maybe Int
  , recentTournament :: Maybe TournamentResult
  , wins :: Maybe Int
  , losses :: Maybe Int
  , ties :: Maybe Int
  }

-- | Prepare all profile data from player record
prepareProfileData :: Player -> ProfileData
prepareProfileData player =
  { location: formatLocation player.xtData
  , rating: getCurrentRating { initialRating: player.initialRating, ratingsHistory: player.ratingsHistory }
  , ranking: getRanking player.xtData
  , winPercentage: calculateWinPercentage player.xtData
  , tournamentCount: maybe Nothing (_.tournamentCount) player.xtData
  , averageScore: maybe Nothing (_.averageScore) player.xtData
  , opponentAvgScore: maybe Nothing (_.opponentAverageScore) player.xtData
  , recentTournament: getRecentTournament player.xtData
  , wins: player.xtData >>= _.w
  , losses: player.xtData >>= _.l
  , ties: player.xtData >>= _.t
  }

-- | Player image data
type PlayerImageData =
  { imageUrl :: String
  , altText :: String
  }

-- | Prepare player image data
preparePlayerImageData :: Player -> TournamentSummary -> PlayerImageData
preparePlayerImageData player tournament =
  let
    xtPhotoUrl = player.xtData >>= _.photourl
    imageUrl = getPlayerImageUrl tournament.dataUrl player.photo xtPhotoUrl
  in
    { imageUrl
    , altText: player.name
    }

--------------------------------------------------------------------------------
-- Component
--------------------------------------------------------------------------------

component :: forall query output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component query (BaseOverlay.Input Int) output m
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
      maybeActualPlayerId = resolvePlayerId playerIdParam state.currentMatch tournamentData.division.games
      maybePlayer = maybeActualPlayerId >>= \actualId ->
        find (\p -> unwrap p.id == actualId) tournamentData.division.players
    in
      case maybePlayer of
        Nothing -> BaseOverlay.renderError $ "Player " <> show playerIdParam <> " not found in division"
        Just player -> renderPlayerProfile state.theme player tournamentData.tournament

renderPlayerProfile :: forall w i. Theme -> Player -> TournamentSummary -> HH.HTML w i
renderPlayerProfile theme player tournament =
  let
    profileData = prepareProfileData player
  in
    HH.div
      [ css [thm theme TC.PageBackground, cls C.MinHScreen, cls C.Flex, cls C.ItemsCenter, cls C.JustifyCenter, cls C.P_6] ]
      [ HH.div
          [ css [thm theme TC.CardBackground, cls C.Rounded_3xl, cls C.P_8, cls C.Border_2, thm theme TC.PrimaryBorder, cls C.Shadow_2xl, thm theme TC.ShadowColor, raw "min-w-[32rem]"] ]
          [ HH.div
              [ css [cls C.Flex, cls C.Gap_8] ]
              [ -- Photo Section
                HH.div
                  [ css [cls C.FlexShrink_0] ]
                  [ renderPlayerImage player tournament
                  , case profileData.location of
                      Just loc ->
                        HH.div
                          [ css [cls C.Text_Xl, cls C.FontBold, thm theme TC.TextAccent, cls C.Mt_4, cls C.TextCenter] ]
                          [ HH.text loc ]
                      Nothing -> HH.text ""
                  ]
              , -- Stats Section
                HH.div
                  [ css [cls C.FlexGrow] ]
                  [ HH.h2
                      [ css [cls C.Text_5xl, cls C.FontBlack, cls C.Mb_3, thm theme TC.TextPrimary] ]
                      [ HH.text (formatPlayerName player.name) ]
                  , HH.div
                      [ css [cls C.Grid, cls C.GridCols_2, cls C.Gap_6] ]
                      (renderStatsGrid theme profileData)

                  , case profileData.recentTournament of
                      Just rt -> renderRecentTournament theme rt
                      Nothing -> HH.text ""
                  ]
              ]
          ]
      ]

renderPlayerImage :: forall w i. Player -> TournamentSummary -> HH.HTML w i
renderPlayerImage player tournament =
  let
    imageData = preparePlayerImageData player tournament
  in
    HH.img
      [ HP.src imageData.imageUrl
      , HP.alt imageData.altText
      , css [cls C.W_40, cls C.H_40, cls C.Rounded_2xl, cls C.ObjectCover, cls C.Border_2, raw "border-blue-400/50", cls C.ShadowLg]
      ]

renderStatsGrid :: forall w i. Theme -> ProfileData -> Array (HH.HTML w i)
renderStatsGrid theme profileData =
  let
    ratingBox = case profileData.rating of
      Just r -> [renderStatBox theme "Rating" (show r) false false]
      Nothing -> []

    rankingBox = case profileData.ranking of
      Just r -> [renderStatBox theme "Ranking" (show r) false false]
      Nothing -> []

    tournamentBox = case profileData.tournamentCount of
      Just tc -> [renderStatBox theme "Tournaments" (show tc) false false]
      Nothing -> []

    recordBoxes = case profileData.wins, profileData.losses, profileData.ties of
      Just w, Just l, Just t ->
        [ renderStatBox theme "Career Record" (show w <> "-" <> show l <> "-" <> show t) true false
        , case profileData.winPercentage of
            Just wp -> renderStatBox theme "Career Win %" (formatNumber wp 1 <> "%") false false
            Nothing -> HH.text ""
        ]
      _, _, _ -> []

    avgScoreBox = case profileData.averageScore of
      Just avg ->
        let scoreText = case profileData.opponentAvgScore of
              Just oppAvg -> show (Int.round (Int.toNumber avg)) <> "-" <> show (Int.round (Int.toNumber oppAvg))
              Nothing -> show (Int.round (Int.toNumber avg))
            -- col-span-2 if no ranking
            shouldSpan = isNothing profileData.ranking
        in [renderStatBox theme "Average Score" scoreText true shouldSpan]
      Nothing -> []
  in
    ratingBox <> rankingBox <> tournamentBox <> recordBoxes <> avgScoreBox

renderStatBox :: forall w i. Theme -> String -> String -> Boolean -> Boolean -> HH.HTML w i
renderStatBox theme label value useMono colSpan2 =
  HH.div
    [ css $ [thm theme TC.CardBackground, cls C.RoundedXl, cls C.P_3, cls C.Border, thm theme TC.SecondaryBorder] <> (if colSpan2 then [cls C.ColSpan_2] else []) ]
    [ HH.div
        [ css [thm theme TC.TextAccent, cls C.Text_Base, cls C.FontBold, cls C.Uppercase, cls C.TrackingWider, cls C.Mb_1] ]
        [ HH.text label ]
    , HH.div
        [ css $ [thm theme TC.TextPrimary, cls C.Text_3xl, cls C.FontBlack] <> (if useMono then [cls C.FontMono] else []) ]
        [ HH.text value ]
    ]

renderRecentTournament :: forall w i. Theme -> TournamentResult -> HH.HTML w i
renderRecentTournament theme result =
  let isWin = result.place == 1
  in
    HH.div
      [ css [cls C.Mt_5, cls C.P_4, thm theme TC.CardBackground, cls C.RoundedXl, cls C.Border, thm theme TC.PrimaryBorder] ]
      [ HH.div
          [ css [thm theme TC.TextAccent, cls C.Text_Xl, cls C.FontBold, cls C.Mb_2] ]
          [ HH.text if isWin then "🏆 Recent Tournament Win" else "Recent Tournament" ]
      , HH.div
          [ css [thm theme TC.TextPrimary, cls C.Text_2xl, cls C.FontBold, cls C.Mb_3] ]
          [ HH.text result.name ]
      , HH.table_
          [ HH.tbody_
              [ HH.tr_
                  [ HH.td
                      [ css [thm theme TC.TextAccent, cls C.Text_Xl, cls C.FontSemibold, cls C.Opacity_70, cls C.Pr_3, cls C.AlignTop, cls C.WhitespaceNowrap] ]
                      [ HH.text "Date:" ]
                  , HH.td
                      [ css [thm theme TC.TextAccent, cls C.Text_Xl, cls C.FontBold] ]
                      [ HH.text (formatDate result.date) ]
                  ]
              , HH.tr_
                  [ HH.td
                      [ css [thm theme TC.TextAccent, cls C.Text_Xl, cls C.FontSemibold, cls C.Opacity_70, cls C.Pr_3, cls C.AlignTop, cls C.WhitespaceNowrap] ]
                      [ HH.text "Record:" ]
                  , HH.td
                      [ css [thm theme TC.TextPrimary, cls C.FontMono, cls C.Text_Xl, cls C.FontBold] ]
                      [ HH.text (show result.wins <> "-" <> show result.losses) ]
                  ]
              ]
          ]
      ]


