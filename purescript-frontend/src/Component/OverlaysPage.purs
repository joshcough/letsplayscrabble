-- | Overlays listing page - shows all available overlays with links
module Component.OverlaysPage where

import Prelude

import CSS.Class as C
import CSS.Class (CSSClass(..))
import CSS.ThemeColor (ThemeColor(..))

import Config.Themes (getTheme)
import Data.Maybe (Maybe(..), fromMaybe)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Utils.Logger (log)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Route (Route(..), routeCodec)
import Routing.Duplex (print)
import Routing.Hash (setHash)
import Types.Theme (Theme)
import Utils.CSS (cls, css, hover, raw, thm)

type State =
  { theme :: Theme
  }

data Action
  = Initialize
  | NavigateToRoute Route

component :: forall query input m. MonadAff m => H.Component query input Route m
component = H.mkComponent
  { initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = handleAction
      , initialize = Just Initialize
      }
  }

initialState :: forall input. input -> State
initialState _ =
  { theme: getTheme "scrabble"
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  let theme = state.theme
  in
    HH.div
      [ css [thm theme PageBackground, cls MinHScreen] ]
      [ HH.div
          [ css [cls PageContainer] ]
          [ -- Title
            HH.h1
              [ css [cls Text_4xl, cls FontBold, cls Mb_8, cls TextCenter, raw theme.titleExtraClasses, thm theme TitleGradient]
              ]
              [ HH.text "Tournament Overlays & Worker" ]
          , HH.p
              [ css [cls Text_Xl, cls Mb_8, cls TextCenter, thm theme TextSecondary] ]
              [ HH.text "Tournament overlays with theming support" ]

          , -- Leaderboards category
            -- Note: Using userId=2 as placeholder - overlays will use current match from worker
            renderCategory theme "Leaderboards"
              [ { title: "Standings"
                , variants: [{ label: "Table", route: Standings { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Nothing } }
                           , { label: "With Pics", route: Standings { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Just true } }]
                }
              , { title: "Rating Gain"
                , variants: [{ label: "Table", route: RatingGain { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Nothing } }
                           , { label: "With Pics", route: RatingGain { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Just true } }]
                }
              , { title: "Scoring Leaders"
                , variants: [{ label: "Table", route: ScoringLeaders { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Nothing } }
                           , { label: "With Pics", route: ScoringLeaders { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Just true } }]
                }
              , { title: "High Scores"
                , variants: [{ label: "Table", route: HighScores { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Nothing } }
                           , { label: "With Pics", route: HighScores { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Just true } }]
                }
              ]

          , -- Player Stats & Comparisons category
            renderPlayerStatsCategory theme

          , -- Worker section
            renderWorkerSection theme

          , -- Instructions
            renderInstructions theme
          ]
      ]

type OverlayVariant = { label :: String, route :: Route }
type Overlay = { title :: String, variants :: Array OverlayVariant }
type SimpleOverlay =
  { title :: String
  , route :: Route
  , description :: Maybe String
  , requiresParams :: Boolean
  }

renderCategory :: forall w. Theme -> String -> Array Overlay -> HH.HTML w Action
renderCategory theme categoryName overlays =
  HH.div
    [ css [cls Mb_8] ]
    [ HH.h2
        [ css [cls PageTitle, cls Mb_4, thm theme TextAccent] ]
        [ HH.text categoryName ]
    , HH.div
        [ css [cls OverlayGrid, cls C.Gap_4] ]
        (map (renderOverlay theme) overlays)
    ]

renderOverlay :: forall w. Theme -> Overlay -> HH.HTML w Action
renderOverlay theme overlay =
  HH.div
    [ css [cls P_4, cls C.RoundedXl, cls ShadowLg, cls C.Border, cls BackdropBlurXl, thm theme CardBackground, thm theme PrimaryBorder] ]
    [ HH.h3
        [ css [cls C.Text_Lg, cls C.FontSemibold, cls C.Mb_2, thm theme TextAccent] ]
        [ HH.text overlay.title ]
    , HH.div
        [ css [cls C.Flex, cls C.Gap_2] ]
        (map (renderVariantButton theme) overlay.variants)
    ]

renderVariantButton :: forall w. Theme -> OverlayVariant -> HH.HTML w Action
renderVariantButton theme variant =
  HH.button
    [ HE.onClick \_ -> NavigateToRoute variant.route
    , css [cls Flex_1, cls TextCenter, cls C.Py_2, cls C.Px_3, cls C.RoundedLg, cls C.Text_Sm, cls FontMedium, cls TransitionAll, cls CursorPointer, thm theme CardBackground, thm theme PrimaryBorder, cls C.Border, thm theme HoverBackground]
    ]
    [ HH.text variant.label ]

renderPlayerStatsCategory :: forall w. Theme -> HH.HTML w Action
renderPlayerStatsCategory theme =
  HH.div
    [ css [cls Mb_8] ]
    [ HH.h2
        [ css [cls PageTitle, cls Mb_4, thm theme TextAccent] ]
        [ HH.text "Player Stats & Comparisons" ]
    , HH.div
        [ css [cls OverlayGrid, cls C.Gap_4] ]
        [ renderSimpleOverlay theme
            { title: "Cross-Tables Profile"
            , route: CrossTablesPlayerProfile { userId: 2, tournamentId: Nothing, divisionName: Nothing, playerId: 1 }
            , description: Just "Player ratings & stats"
            , requiresParams: true
            }
        , renderSimpleOverlay theme
            { title: "Head-to-Head"
            , route: HeadToHead { userId: 2, tournamentId: Nothing, divisionName: Nothing, playerId1: Nothing, playerId2: Nothing }
            , description: Just "Career matchup stats"
            , requiresParams: false
            }
        , renderSimpleOverlay theme
            { title: "Tournament Stats"
            , route: TournamentStats { userId: 2, tournamentId: Nothing, divisionName: Nothing }
            , description: Just "Tournament-wide statistics"
            , requiresParams: false
            }
        , renderSimpleOverlay theme
            { title: "Misc Overlays"
            , route: MiscOverlayTesting
            , description: Just "Small text overlays for OBS"
            , requiresParams: false
            }
        ]
    ]

renderSimpleOverlay :: forall w. Theme -> SimpleOverlay -> HH.HTML w Action
renderSimpleOverlay theme overlay =
  HH.div
    [ css [cls P_4, cls C.RoundedXl, cls ShadowLg, cls C.Border, cls BackdropBlurXl, thm theme CardBackground, thm theme PrimaryBorder] ]
    [ HH.h3
        [ css [cls C.Text_Lg, cls C.FontSemibold, cls C.Mb_2, thm theme TextAccent] ]
        [ HH.text overlay.title
        , if overlay.requiresParams
            then HH.span
                  [ css [cls Ml_2, cls C.Text_Xs, raw "bg-blue-500/30", cls C.Px_2, cls C.Py_1, cls C.RoundedFull, cls C.Border, raw "border-blue-400/30", thm theme TextPrimary] ]
                  [ HH.text "Params" ]
            else HH.text ""
        ]
    , fromMaybe (HH.text "") (overlay.description <#> \desc ->
        HH.p
          [ css [cls C.Text_Sm, cls C.Mb_3, thm theme TextPrimary] ]
          [ HH.text desc ]
      )
    , HH.button
        [ HE.onClick \_ -> NavigateToRoute overlay.route
        , css [cls C.Block, cls TextCenter, cls C.Py_2, cls C.Px_3, cls C.RoundedLg, cls C.Text_Sm, cls FontMedium, cls TransitionAll, cls CursorPointer, cls W_Full, thm theme CardBackground, thm theme PrimaryBorder, cls C.Border, thm theme HoverBackground]
        ]
        [ HH.text "Open" ]
    ]

renderWorkerSection :: forall w. Theme -> HH.HTML w Action
renderWorkerSection theme =
  HH.div
    [ css [cls Mb_8] ]
    [ HH.h2
        [ css [cls PageTitle, cls Mb_4, thm theme TextAccent] ]
        [ HH.text "Other" ]
    , HH.div
        [ css [cls OverlayGrid, cls C.Gap_4] ]
        [ HH.div
            [ css [cls P_4, cls RoundedXl, cls ShadowLg, cls Border, cls BackdropBlurXl, raw "bg-gradient-to-br from-orange-900/50 to-red-900/50 border-orange-400/50"] ]
            [ HH.h3
                [ css [cls C.Text_Lg, cls C.FontSemibold, cls C.Mb_2, cls C.TextOrange300] ]
                [ HH.text "Worker Page"
                , HH.span
                    [ css [cls Ml_2, cls Text_Xs, raw "bg-orange-500/30", cls TextOrange800, cls Px_2, cls Py_1, cls RoundedFull, cls Border, raw "border-orange-400/30"] ]
                    [ HH.text "Required" ]
                ]
            , HH.p
                [ css [cls C.Text_Sm, cls C.Mb_3, cls C.TextOrange200] ]
                [ HH.text "Required for real-time updates" ]
            , HH.button
                [ HE.onClick \_ -> NavigateToRoute Worker
                , css [cls Block, cls TextCenter, cls Py_2, cls Px_3, cls RoundedLg, cls Text_Sm, cls FontMedium, cls TransitionAll, raw "bg-orange-700/30", cls Border, raw "border-orange-400/50", cls TextOrange200, hover "bg-orange-700/50", cls CursorPointer, cls W_Full]
                ]
                [ HH.text "Open" ]
            ]
        ]
    ]

renderInstructions :: forall w. Theme -> HH.HTML w Action
renderInstructions theme =
  HH.div_
    [ HH.div
        [ css [cls Mt_8, cls P_6, cls C.Border, cls C.Rounded_2xl, cls BackdropBlurXl, thm theme CardBackground, thm theme PrimaryBorder] ]
        [ HH.h3
            [ css [cls C.FontSemibold, cls C.Mb_3, cls C.Text_Lg, thm theme TextAccent] ]
            [ HH.text "⚠️ Important - Worker Browser Source Required:" ]
        , HH.ul
            [ css [cls C.Text_Sm, cls SpaceY_2, thm theme TextPrimary] ]
            [ HH.li_ [ HH.text "• Must add the Worker Page as a Browser Source in OBS for real-time updates to work" ]
            , HH.li_ [ HH.text "• The worker handles: WebSocket connections, tournament polling, and data broadcasting" ]
            , HH.li_ [ HH.text "• All overlay Browser Sources depend on the worker - without it, data won't update automatically" ]
            , HH.li_ [ HH.text "• One worker per user - only add one worker Browser Source to avoid conflicts" ]
            , HH.li_ [ HH.text "• Keep worker Browser Source enabled even if not visible in your scene" ]
            ]
        ]
    , HH.div
        [ css [cls Mt_6, cls P_6, cls C.Border, cls C.Rounded_2xl, cls BackdropBlurXl, thm theme CardBackground, thm theme PrimaryBorder] ]
        [ HH.h3
            [ css [cls C.FontSemibold, cls C.Mb_3, cls C.Text_Lg, thm theme TextAccent] ]
            [ HH.text "Overlay Features:" ]
        , HH.ul
            [ css [cls C.Text_Sm, cls SpaceY_2, thm theme TextPrimary] ]
            [ HH.li_ [ HH.text "• Theme support with tournament-specific theming" ]
            , HH.li_ [ HH.text "• Real-time updates via WebSocket broadcasting" ]
            , HH.li_ [ HH.text "• Enhanced visual elements with improved color coding" ]
            , HH.li_ [ HH.text "• Rank badges and icons for top performers and statistics" ]
            , HH.li_ [ HH.text "• Responsive design optimized for streaming overlays" ]
            ]
        ]
    , HH.div
        [ css [cls Mt_6, cls P_6, cls C.Border, cls C.Rounded_2xl, cls BackdropBlurXl, thm theme CardBackground, thm theme PrimaryBorder] ]
        [ HH.h3
            [ css [cls C.FontSemibold, cls C.Mb_3, cls C.Text_Lg, thm theme TextAccent] ]
            [ HH.text "How it works:" ]
        , HH.ul
            [ css [cls C.Text_Sm, cls SpaceY_2, thm theme TextPrimary] ]
            [ HH.li_ [ HH.text "• Default: Uses currently selected match in admin interface" ]
            , HH.li_ [ HH.text "• With URL params: Most overlays support /tournamentId/divisionName for specific tournament data" ]
            , HH.li_ [ HH.text "• Example: /users/2/overlay/standings/123/A shows standings for tournament 123, division A" ]
            , HH.li_ [ HH.text "• Misc overlay: Add ?source=player1-name (or other sources) for specific data elements" ]
            , HH.li_ [ HH.text "• Cross-Tables Profile: Two modes - Current match: ?player=1 or ?player=2. Specific player: /tournamentId/divisionName/playerId" ]
            , HH.li_ [ HH.text "• Head-to-Head Comparison: Two modes - Current match players (no params needed). Specific players: /tournamentId/divisionName/playerId1/playerId2" ]
            ]
        ]
    , HH.div
        [ css [cls Mt_6, cls P_6, cls C.Border, cls C.Rounded_2xl, cls BackdropBlurXl, thm theme CardBackground, thm theme PrimaryBorder] ]
        [ HH.h3
            [ css [cls C.FontSemibold, cls C.Mb_3, cls C.Text_Lg, thm theme TextAccent] ]
            [ HH.text "For OBS Setup:" ]
        , HH.ul
            [ css [cls C.Text_Sm, cls SpaceY_2, thm theme TextPrimary] ]
            [ HH.li_ [ HH.text "• Step 1: Add Worker Page as a Browser Source (can be in any scene, even if not visible)" ]
            , HH.li_ [ HH.text "• Step 2: Add your overlay Browser Sources using the URLs below" ]
            , HH.li_ [ HH.text "• All Browser Sources are scoped to your user account (ID: 2)" ]
            , HH.li_ [ HH.text "• Worker must stay enabled for live data updates across all overlays" ]
            , HH.li_ [ HH.text "• Overlays work best with transparent backgrounds in OBS for the theme effects" ]
            ]
        ]
    ]

handleAction :: forall output m. MonadAff m => Action -> H.HalogenM State Action () output m Unit
handleAction = case _ of
  Initialize -> pure unit

  NavigateToRoute route -> do
    liftEffect $ log $ "[OverlaysPage] NavigateToRoute clicked with route: " <> show route
    -- Convert route to hash path using routing-duplex
    let hashPath = print routeCodec route
    liftEffect $ log $ "[OverlaysPage] Setting hash to: " <> hashPath

    -- Use Routing.Hash.setHash to properly update history
    liftEffect $ setHash hashPath
    liftEffect $ log $ "[OverlaysPage] Hash set complete"
