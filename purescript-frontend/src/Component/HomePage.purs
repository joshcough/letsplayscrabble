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
import Utils.CSS (cls, css, groupHover, raw, thm)

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
    [ css [thm theme PageBackground, cls MinHScreen] ]
    [ HH.div
        [ css [cls PageContainer] ]
        [ -- Logo
          HH.div
            [ css [cls LogoContainer] ]
            [ HH.a
                [ HP.href "https://letsplayscrabble.com"
                , HP.target "_blank"
                , HP.rel "noopener noreferrer"
                , css [cls LogoLink]
                ]
                [ HH.img
                    [ HP.src "/letsplayscrabble.png"
                    , HP.alt "LetsPlayScrabble.com"
                    , css [cls LogoImage]
                    ]
                ]
            ]
        -- Title
        , HH.div
            [ css [cls PageHeader] ]
            [ HH.h2
                [ css [cls PageTitle, thm theme TextPrimary] ]
                [ HH.text "Tournament Manager" ]
            , HH.p
                [ css [cls PageSubtitle, thm theme TextSecondary] ]
                [ HH.text "A companion app for LetsPlayScrabble.com" ]
            ]
        -- Navigation cards
        , HH.div
            [ css [cls CardGrid] ]
            [ renderCard theme "Tournament Manager" "Manage tournaments, view standings, and track results" TournamentManager "bg-red-600"
            , renderCard theme "Admin Interface" "Choose the current live pairing" CurrentMatch "bg-blue-600"
            , renderCard theme "Tournament Overlays" "OBS overlays for live streaming tournaments" Overlays "bg-green-600"
            ]
        -- Footer
        , HH.div
            [ css [cls PageFooter, thm theme TextPrimary] ]
            [ HH.p_
                [ HH.text "Built for "
                , HH.a
                    [ HP.href "https://letsplayscrabble.com"
                    , HP.target "_blank"
                    , HP.rel "noopener noreferrer"
                    , css [cls Underline]
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
    , css [cls Group, cls CardContainer]
    ]
    [ HH.div
        [ css [cls CardOverlay, groupHover "opacity-20", raw bgColor] ]
        []
    , HH.div
        [ css [cls CardContent, groupHover "-translate-y-1", thm theme CardBackground, thm theme PrimaryBorder, thm theme ShadowColor] ]
        [ HH.h2
            [ css [cls CardTitle, thm theme TextPrimary] ]
            [ HH.text title ]
        , HH.p
            [ css [thm theme TextSecondary] ]
            [ HH.text description ]
        ]
    ]

handleAction :: forall m. MonadAff m => Action -> H.HalogenM State Action () Output m Unit
handleAction = case _ of
  NavigateTo route -> H.raise $ Navigate route
