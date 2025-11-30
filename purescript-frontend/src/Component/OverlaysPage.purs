-- | Overlays listing page - shows all available overlays with links
module Component.OverlaysPage where

import Prelude

import Config.Themes (getTheme)
import Data.Maybe (Maybe(..))
import Data.String as String
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Effect.Class.Console (log)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Route (Route(..), routeCodec)
import Routing.Duplex (print)
import Types.Theme (Theme)
import Web.HTML (window)
import Web.HTML.Location as Location
import Web.HTML.Window (location)

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
      [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen") ]
      [ HH.div
          [ HP.class_ (HH.ClassName "container mx-auto p-8") ]
          [ -- Title
            HH.h1
              [ HP.class_ (HH.ClassName $ "text-4xl font-bold mb-8 text-center " <>
                  if theme.name == "original"
                    then theme.colors.titleGradient
                    else "text-transparent bg-clip-text " <> theme.colors.titleGradient)
              ]
              [ HH.text "Tournament Overlays & Worker" ]
          , HH.p
              [ HP.class_ (HH.ClassName $ "text-xl mb-8 text-center " <> theme.colors.textSecondary) ]
              [ HH.text "Tournament overlays with theming support" ]

          , -- Leaderboards category
            -- Note: Using userId=2 as placeholder - overlays will use current match from worker
            renderCategory theme "Leaderboards"
              [ { title: "Standings"
                , variants: [{ label: "Table", route: Standings { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Nothing } }
                           , { label: "With Pics", route: Standings { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Just true } }]
                }
              , { title: "High Scores"
                , variants: [{ label: "Table", route: HighScores { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Nothing } }
                           , { label: "With Pics", route: HighScores { userId: 2, tournamentId: Nothing, divisionName: Nothing, pics: Just true } }]
                }
              ]

          , -- Worker section
            renderWorkerSection theme

          , -- Instructions
            renderInstructions theme
          ]
      ]

type OverlayVariant = { label :: String, route :: Route }
type Overlay = { title :: String, variants :: Array OverlayVariant }

renderCategory :: forall w. Theme -> String -> Array Overlay -> HH.HTML w Action
renderCategory theme categoryName overlays =
  HH.div
    [ HP.class_ (HH.ClassName "mb-8") ]
    [ HH.h2
        [ HP.class_ (HH.ClassName $ "text-2xl font-bold mb-4 " <> theme.colors.textAccent) ]
        [ HH.text categoryName ]
    , HH.div
        [ HP.class_ (HH.ClassName "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4") ]
        (map (renderOverlay theme) overlays)
    ]

renderOverlay :: forall w. Theme -> Overlay -> HH.HTML w Action
renderOverlay theme overlay =
  HH.div
    [ HP.class_ (HH.ClassName $ "p-4 rounded-xl shadow-lg border backdrop-blur-xl " <>
        theme.colors.cardBackground <> " " <> theme.colors.primaryBorder) ]
    [ HH.h3
        [ HP.class_ (HH.ClassName $ "text-lg font-semibold mb-2 " <> theme.colors.textAccent) ]
        [ HH.text overlay.title ]
    , HH.div
        [ HP.class_ (HH.ClassName "flex gap-2") ]
        (map (renderVariantButton theme) overlay.variants)
    ]

renderVariantButton :: forall w. Theme -> OverlayVariant -> HH.HTML w Action
renderVariantButton theme variant =
  HH.button
    [ HE.onClick \_ -> NavigateToRoute variant.route
    , HP.class_ (HH.ClassName $ "flex-1 text-center py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer " <>
        theme.colors.cardBackground <> " " <> theme.colors.primaryBorder <> " border " <> theme.colors.hoverBackground)
    ]
    [ HH.text variant.label ]

renderWorkerSection :: forall w. Theme -> HH.HTML w Action
renderWorkerSection theme =
  HH.div
    [ HP.class_ (HH.ClassName "mb-8") ]
    [ HH.h2
        [ HP.class_ (HH.ClassName $ "text-2xl font-bold mb-4 " <> theme.colors.textAccent) ]
        [ HH.text "Other" ]
    , HH.div
        [ HP.class_ (HH.ClassName "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4") ]
        [ HH.div
            [ HP.class_ (HH.ClassName "p-4 rounded-xl shadow-lg border backdrop-blur-xl bg-gradient-to-br from-orange-900/50 to-red-900/50 border-orange-400/50") ]
            [ HH.h3
                [ HP.class_ (HH.ClassName "text-lg font-semibold mb-2 text-orange-300") ]
                [ HH.text "Worker Page"
                , HH.span
                    [ HP.class_ (HH.ClassName "ml-2 text-xs bg-orange-500/30 text-orange-800 px-2 py-1 rounded-full border border-orange-400/30") ]
                    [ HH.text "Required" ]
                ]
            , HH.p
                [ HP.class_ (HH.ClassName "text-sm mb-3 text-orange-200") ]
                [ HH.text "Required for real-time updates" ]
            , HH.button
                [ HE.onClick \_ -> NavigateToRoute Worker
                , HP.class_ (HH.ClassName "block text-center py-2 px-3 rounded-lg text-sm font-medium transition-all bg-orange-700/30 border border-orange-400/50 text-orange-200 hover:bg-orange-700/50 cursor-pointer w-full")
                ]
                [ HH.text "Open" ]
            ]
        ]
    ]

renderInstructions :: forall w. Theme -> HH.HTML w Action
renderInstructions theme =
  HH.div_
    [ HH.div
        [ HP.class_ (HH.ClassName $ "mt-8 p-6 border rounded-2xl backdrop-blur-xl " <>
            theme.colors.cardBackground <> " " <> theme.colors.primaryBorder) ]
        [ HH.h3
            [ HP.class_ (HH.ClassName $ "font-semibold mb-3 text-lg " <> theme.colors.textAccent) ]
            [ HH.text "⚠️ Important - Worker Browser Source Required:" ]
        , HH.ul
            [ HP.class_ (HH.ClassName $ "text-sm space-y-2 " <> theme.colors.textPrimary) ]
            [ HH.li_ [ HH.text "• Must add the Worker Page as a Browser Source in OBS for real-time updates to work" ]
            , HH.li_ [ HH.text "• The worker handles: WebSocket connections, tournament polling, and data broadcasting" ]
            , HH.li_ [ HH.text "• All overlay Browser Sources depend on the worker - without it, data won't update automatically" ]
            , HH.li_ [ HH.text "• One worker per user - only add one worker Browser Source to avoid conflicts" ]
            , HH.li_ [ HH.text "• Keep worker Browser Source enabled even if not visible in your scene" ]
            ]
        ]
    , HH.div
        [ HP.class_ (HH.ClassName $ "mt-6 p-6 border rounded-2xl backdrop-blur-xl " <>
            theme.colors.cardBackground <> " " <> theme.colors.primaryBorder) ]
        [ HH.h3
            [ HP.class_ (HH.ClassName $ "font-semibold mb-3 text-lg " <> theme.colors.textAccent) ]
            [ HH.text "How it works:" ]
        , HH.ul
            [ HP.class_ (HH.ClassName $ "text-sm space-y-2 " <> theme.colors.textPrimary) ]
            [ HH.li_ [ HH.text "• Default: Uses currently selected match in admin interface" ]
            , HH.li_ [ HH.text "• Overlays automatically update when you change the current match" ]
            , HH.li_ [ HH.text "• Worker must stay enabled for live data updates across all overlays" ]
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

    -- Set the hash using location.hash to trigger hashchange event
    win <- liftEffect window
    loc <- liftEffect $ location win
    liftEffect $ Location.setHash hashPath loc
    liftEffect $ log $ "[OverlaysPage] Hash set complete"
