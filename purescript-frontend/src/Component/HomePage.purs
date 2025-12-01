-- | Home page component - landing page with navigation cards
module Component.HomePage where

import Prelude

import Config.Themes (getTheme)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Route (Route(..))
import Types.Theme (Theme)

type State = { theme :: Theme }

data Action = NavigateTo Route

data Output = Navigate Route

component :: forall query input m. MonadAff m => H.Component query input Output m
component = H.mkComponent
  { initialState: \_ -> { theme: getTheme "scrabble" }
  , render
  , eval: H.mkEval $ H.defaultEval { handleAction = handleAction }
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  let theme = state.theme
  in HH.div
    [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen") ]
    [ HH.div
        [ HP.class_ (HH.ClassName "max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8") ]
        [ -- Logo
          HH.div
            [ HP.class_ (HH.ClassName "flex justify-center mb-12") ]
            [ HH.a
                [ HP.href "https://letsplayscrabble.com"
                , HP.target "_blank"
                , HP.rel "noopener noreferrer"
                , HP.class_ (HH.ClassName "transform hover:scale-105 transition-transform")
                ]
                [ HH.img
                    [ HP.src "/letsplayscrabble.png"
                    , HP.alt "LetsPlayScrabble.com"
                    , HP.class_ (HH.ClassName "h-24 object-contain")
                    ]
                ]
            ]
        -- Title
        , HH.div
            [ HP.class_ (HH.ClassName "text-center mb-12") ]
            [ HH.h2
                [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-2xl font-bold") ]
                [ HH.text "Tournament Manager" ]
            , HH.p
                [ HP.class_ (HH.ClassName $ theme.colors.textSecondary <> " mt-2") ]
                [ HH.text "A companion app for LetsPlayScrabble.com" ]
            ]
        -- Navigation cards
        , HH.div
            [ HP.class_ (HH.ClassName "grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto") ]
            [ renderCard theme "Tournament Manager" "Manage tournaments, view standings, and track results" TournamentManager "bg-red-600"
            , renderCard theme "Admin Interface" "Choose the current live pairing" CurrentMatch "bg-blue-600"
            , renderCard theme "Tournament Overlays" "OBS overlays for live streaming tournaments" Overlays "bg-green-600"
            ]
        -- Footer
        , HH.div
            [ HP.class_ (HH.ClassName $ "text-center mt-12 " <> theme.colors.textPrimary <> " text-sm") ]
            [ HH.p_
                [ HH.text "Built for "
                , HH.a
                    [ HP.href "https://letsplayscrabble.com"
                    , HP.target "_blank"
                    , HP.rel "noopener noreferrer"
                    , HP.class_ (HH.ClassName $ "underline hover:" <> theme.colors.textSecondary)
                    ]
                    [ HH.text "LetsPlayScrabble.com" ]
                ]
            ]
        ]
    ]

renderCard :: forall w. Theme -> String -> String -> Route -> String -> HH.HTML w Action
renderCard theme title description route bgColor =
  HH.button
    [ HE.onClick \_ -> NavigateTo route
    , HP.class_ (HH.ClassName "group relative h-[200px] flex cursor-pointer w-full text-left")
    ]
    [ HH.div
        [ HP.class_ (HH.ClassName $ "absolute inset-0 " <> bgColor <> " opacity-10 group-hover:opacity-20 transition-opacity") ]
        []
    , HH.div
        [ HP.class_ (HH.ClassName $ "relative " <> theme.colors.cardBackground <> " p-8 rounded border-2 " <> theme.colors.primaryBorder <> " " <> theme.colors.shadowColor <> " shadow-lg transform group-hover:-translate-y-1 transition-transform flex-1 flex flex-col") ]
        [ HH.h2
            [ HP.class_ (HH.ClassName $ "text-xl font-bold " <> theme.colors.textPrimary <> " mb-3") ]
            [ HH.text title ]
        , HH.p
            [ HP.class_ (HH.ClassName theme.colors.textSecondary) ]
            [ HH.text description ]
        ]
    ]

handleAction :: forall m. MonadAff m => Action -> H.HalogenM State Action () Output m Unit
handleAction = case _ of
  NavigateTo route -> H.raise $ Navigate route
