-- | Home page component - landing page with navigation cards
module Component.HomePage where

import Prelude

import CSS.Class (CSSClass(..))
import CSS.ThemeColor (ThemeColor(..))
import Config.Themes (getTheme)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Route (Route(..))
import Types.Theme (Theme)
import Utils.CSS (classNames, cls, thm, raw, hover, groupHover)

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
    [ HP.class_ $ classNames [thm theme PageBackground, cls MinHScreen] ]
    [ HH.div
        [ HP.class_ $ classNames [cls PageContainer] ]
        [ -- Logo
          HH.div
            [ HP.class_ $ classNames [cls LogoContainer] ]
            [ HH.a
                [ HP.href "https://letsplayscrabble.com"
                , HP.target "_blank"
                , HP.rel "noopener noreferrer"
                , HP.class_ $ classNames [cls LogoLink]
                ]
                [ HH.img
                    [ HP.src "/letsplayscrabble.png"
                    , HP.alt "LetsPlayScrabble.com"
                    , HP.class_ $ classNames [cls LogoImage]
                    ]
                ]
            ]
        -- Title
        , HH.div
            [ HP.class_ $ classNames [cls PageHeader] ]
            [ HH.h2
                [ HP.class_ $ classNames [cls PageTitle, thm theme TextPrimary] ]
                [ HH.text "Tournament Manager" ]
            , HH.p
                [ HP.class_ $ classNames [cls PageSubtitle, thm theme TextSecondary] ]
                [ HH.text "A companion app for LetsPlayScrabble.com" ]
            ]
        -- Navigation cards
        , HH.div
            [ HP.class_ $ classNames [cls CardGrid] ]
            [ renderCard theme "Tournament Manager" "Manage tournaments, view standings, and track results" TournamentManager "bg-red-600"
            , renderCard theme "Admin Interface" "Choose the current live pairing" CurrentMatch "bg-blue-600"
            , renderCard theme "Tournament Overlays" "OBS overlays for live streaming tournaments" Overlays "bg-green-600"
            ]
        -- Footer
        , HH.div
            [ HP.class_ $ classNames [cls PageFooter, thm theme TextPrimary] ]
            [ HH.p_
                [ HH.text "Built for "
                , HH.a
                    [ HP.href "https://letsplayscrabble.com"
                    , HP.target "_blank"
                    , HP.rel "noopener noreferrer"
                    , HP.class_ $ classNames [cls Underline]
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
    , HP.class_ $ classNames [raw "group", cls CardContainer]
    ]
    [ HH.div
        [ HP.class_ $ classNames [cls CardOverlay, raw $ groupHover "opacity-20", raw bgColor] ]
        []
    , HH.div
        [ HP.class_ $ classNames [cls CardContent, raw $ groupHover "-translate-y-1", thm theme CardBackground, thm theme PrimaryBorder, thm theme ShadowColor] ]
        [ HH.h2
            [ HP.class_ $ classNames [cls CardTitle, thm theme TextPrimary] ]
            [ HH.text title ]
        , HH.p
            [ HP.class_ $ classNames [thm theme TextSecondary] ]
            [ HH.text description ]
        ]
    ]

handleAction :: forall m. MonadAff m => Action -> H.HalogenM State Action () Output m Unit
handleAction = case _ of
  NavigateTo route -> H.raise $ Navigate route
