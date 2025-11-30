-- | MiscOverlay Testing Page - displays iframes for all misc overlay sources
module Component.MiscOverlayTestingPage where

import Prelude

import Config.Themes (getTheme)
import Data.Array (length)
import Data.Foldable (sum)
import Data.Maybe (Maybe(..))
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Route (Route(..), routeCodec)
import Routing.Duplex (print)
import Types.Theme (Theme)

type State =
  { theme :: Theme
  }

data Action
  = Initialize

component :: forall query input output m. MonadAff m => H.Component query input output m
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

type OverlaySource =
  { source :: String
  , description :: String
  , height :: String  -- Tailwind height class like "h-8", "h-32", etc.
  }

type OverlayGroup =
  { title :: String
  , sources :: Array OverlaySource
  }

-- Define the overlay sources we've implemented so far
overlayGroups :: Array OverlayGroup
overlayGroups =
  [ { title: "Basic Player Info"
    , sources:
        [ { source: "player1-name", description: "Player 1 Name", height: "h-8" }
        , { source: "player2-name", description: "Player 2 Name", height: "h-8" }
        , { source: "player1-record", description: "Player 1 Record (W-L-T)", height: "h-8" }
        , { source: "player2-record", description: "Player 2 Record (W-L-T)", height: "h-8" }
        , { source: "player1-average-score", description: "Player 1 Average Score", height: "h-8" }
        , { source: "player2-average-score", description: "Player 2 Average Score", height: "h-8" }
        , { source: "player1-high-score", description: "Player 1 High Score", height: "h-8" }
        , { source: "player2-high-score", description: "Player 2 High Score", height: "h-8" }
        , { source: "player1-spread", description: "Player 1 Spread", height: "h-8" }
        , { source: "player2-spread", description: "Player 2 Spread", height: "h-8" }
        ]
    }
  , { title: "Rankings"
    , sources:
        [ { source: "player1-rank", description: "Player 1 Rank (number)", height: "h-8" }
        , { source: "player2-rank", description: "Player 2 Rank (number)", height: "h-8" }
        , { source: "player1-rank-ordinal", description: "Player 1 Rank (1st, 2nd, etc.)", height: "h-8" }
        , { source: "player2-rank-ordinal", description: "Player 2 Rank (1st, 2nd, etc.)", height: "h-8" }
        ]
    }
  , { title: "Ratings"
    , sources:
        [ { source: "player1-rating", description: "Player 1 Rating", height: "h-8" }
        , { source: "player2-rating", description: "Player 2 Rating", height: "h-8" }
        ]
    }
  , { title: "Under Camera Displays"
    , sources:
        [ { source: "player1-under-cam", description: "Player 1 Under Cam (full with seed)", height: "h-8" }
        , { source: "player2-under-cam", description: "Player 2 Under Cam (full with seed)", height: "h-8" }
        , { source: "player1-under-cam-no-seed", description: "Player 1 Under Cam (no seed)", height: "h-8" }
        , { source: "player2-under-cam-no-seed", description: "Player 2 Under Cam (no seed)", height: "h-8" }
        , { source: "player1-under-cam-small", description: "Player 1 Under Cam (small)", height: "h-8" }
        , { source: "player2-under-cam-small", description: "Player 2 Under Cam (small)", height: "h-8" }
        , { source: "player1-under-cam-with-rating", description: "Player 1 Under Cam (with rating)", height: "h-8" }
        , { source: "player2-under-cam-with-rating", description: "Player 2 Under Cam (with rating)", height: "h-8" }
        ]
    }
  , { title: "Game Data"
    , sources:
        [ { source: "player1-game-history", description: "Player 1 Game History", height: "h-48" }
        , { source: "player2-game-history", description: "Player 2 Game History", height: "h-48" }
        , { source: "player1-game-history-small", description: "Player 1 Game History Small", height: "h-32" }
        , { source: "player2-game-history-small", description: "Player 2 Game History Small", height: "h-32" }
        ]
    }
  , { title: "Best of 7 & Tournament"
    , sources:
        [ { source: "player1-bo7", description: "Player 1 Best of 7 Record", height: "h-8" }
        , { source: "player2-bo7", description: "Player 2 Best of 7 Record", height: "h-8" }
        , { source: "tournament-data", description: "Tournament Name, Lexicon, Round", height: "h-8" }
        ]
    }
  ]

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  let theme = state.theme
      userId = 2  -- TODO: get from auth context
  in
    HH.div
      [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen") ]
      [ HH.div
          [ HP.class_ (HH.ClassName "container mx-auto p-8") ]
          [ -- Title
            HH.h1
              [ HP.class_ (HH.ClassName $ "text-3xl font-bold mb-8 text-center " <> theme.colors.textPrimary) ]
              [ HH.text $ "Misc Overlay Testing Page (User ID: " <> show userId <> ")" ]

          -- Render groups
          , HH.div_ (map (renderGroup theme userId) overlayGroups)

          -- Testing notes
          , renderNotes theme userId
          ]
      ]

renderGroup :: forall w. Theme -> Int -> OverlayGroup -> HH.HTML w Action
renderGroup theme userId group =
  HH.div
    [ HP.class_ (HH.ClassName "mb-8") ]
    [ HH.h2
        [ HP.class_ (HH.ClassName $ "text-2xl font-semibold mb-4 border-b pb-2 " <> theme.colors.textAccent) ]
        [ HH.text group.title ]
    , HH.div
        [ HP.class_ (HH.ClassName "space-y-6") ]
        (map (renderSource theme userId) group.sources)
    ]

renderSource :: forall w. Theme -> Int -> OverlaySource -> HH.HTML w Action
renderSource theme userId source =
  let
    hashPart = print routeCodec (MiscOverlay { userId, tournamentId: Nothing, divisionName: Nothing, source: source.source })
    url = "http://localhost:4000/#" <> hashPart
    iframeSrc = "#/overlay/misc?userId=" <> show userId <> "&source=" <> source.source
  in
    HH.div
      [ HP.class_ (HH.ClassName $ "p-4 rounded-lg shadow border " <> theme.colors.cardBackground <> " " <> theme.colors.primaryBorder) ]
      [ HH.h4
          [ HP.class_ (HH.ClassName $ "font-semibold mb-2 " <> theme.colors.textPrimary) ]
          [ HH.text source.description ]
      , HH.a
          [ HP.href url
          , HP.target "_blank"
          , HP.class_ (HH.ClassName "text-blue-600 hover:text-blue-800 underline text-sm break-all block mb-3")
          ]
          [ HH.text url ]

      -- Rendered content in iframe
      , HH.div
          [ HP.class_ (HH.ClassName "mt-3") ]
          [ HH.div
              [ HP.class_ (HH.ClassName $ "p-2 bg-gray-50 border rounded flex items-center " <> getMinHeight source.height) ]
              [ HH.iframe
                  [ HP.src iframeSrc
                  , HP.class_ (HH.ClassName $ "w-full border-0 " <> source.height)
                  , HP.title $ "Stats overlay: " <> source.source
                  ]
              ]
          ]
      ]
  where
    getMinHeight :: String -> String
    getMinHeight h = case h of
      "h-8" -> "min-h-[30px]"
      "h-32" -> "min-h-[130px]"
      "h-48" -> "min-h-[200px]"
      _ -> "min-h-[30px]"

renderNotes :: forall w. Theme -> Int -> HH.HTML w Action
renderNotes theme userId =
  let totalSources = sum (map (\g -> length g.sources) overlayGroups)
  in
    HH.div
      [ HP.class_ (HH.ClassName $ "mt-12 p-4 rounded-lg " <> theme.colors.cardBackground) ]
      [ HH.h3
          [ HP.class_ (HH.ClassName $ "font-semibold mb-2 " <> theme.colors.textPrimary) ]
          [ HH.text "Testing Notes:" ]
      , HH.ul
          [ HP.class_ (HH.ClassName $ "text-sm space-y-1 " <> theme.colors.textSecondary) ]
          [ HH.li_ [ HH.text "• All links open in new tabs for easy testing" ]
          , HH.li_ [ HH.text "• Rendered content shows below each URL" ]
          , HH.li_ [ HH.text "• Make sure to set a current match in the admin interface first" ]
          , HH.li_ [ HH.text "• URLs will show \"Loading...\" or \"No data\" if no match is selected" ]
          , HH.li_ [ HH.text $ "• All URLs are scoped to your user account (ID: " <> show userId <> ")" ]
          , HH.li_ [ HH.text $ "• Total: " <> show totalSources <> " source-based URLs (more to be added)" ]
          ]
      ]

handleAction :: forall output m. MonadAff m => Action -> H.HalogenM State Action () output m Unit
handleAction = case _ of
  Initialize -> pure unit
