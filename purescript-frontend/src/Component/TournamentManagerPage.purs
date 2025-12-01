-- | Tournament Manager page component
module Component.TournamentManagerPage where

import Prelude

import CSS.Class (CSSClass(..))
import CSS.ThemeColor (ThemeColor(..))

import API.Tournament as TournamentAPI
import Config.Themes (getTheme)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..), TournamentSummary)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Utils.CSS (classNames, raw, thm)

type State =
  { tournaments :: Array TournamentSummary
  , loading :: Boolean
  , error :: Maybe String
  , theme :: Theme
  }

data Action
  = Initialize
  | LoadTournaments
  | TournamentClick Int
  | AddTournamentClick

data Output
  = NavigateToTournament Int
  | NavigateToAddTournament

component :: forall query m. MonadAff m => H.Component query Unit Output m
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
  { tournaments: []
  , loading: true
  , error: Nothing
  , theme: getTheme "scrabble"
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  let theme = state.theme
  in
    HH.div
      [ HP.class_ $ classNames [raw "min-h-screen ", thm theme PageBackground] ]
      [ HH.div
          [ HP.class_ (HH.ClassName $ show PageContainer) ]
          [ -- Buttons
            HH.div
              [ HP.class_ (HH.ClassName "mb-6 flex gap-4") ]
              [ HH.button
                  [ HP.class_ $ classNames [raw "px-6 py-2", thm theme CardBackground, thm theme TextPrimary, raw "rounded-md", thm theme HoverBackground, raw "transition-colors", thm theme ShadowColor, raw "shadow-md border-2", thm theme PrimaryBorder]
                  ]
                  [ HH.text "View All Tournaments" ]
              , HH.button
                  [ HP.class_ $ classNames [raw "px-6 py-2", thm theme CardBackground, thm theme TextPrimary, raw "rounded-md", thm theme HoverBackground, raw "transition-colors", thm theme ShadowColor, raw "shadow-md border-2", thm theme PrimaryBorder]
                  , HE.onClick \_ -> AddTournamentClick
                  ]
                  [ HH.text "Add New Tournament" ]
              ]
          , -- Tournament List
            HH.div
              [ HP.class_ $ classNames [thm theme CardBackground, raw "rounded-lg shadow-md p-6"] ]
              [ HH.h2
                  [ HP.class_ $ classNames [raw "page-title mb-6 ", thm theme TextPrimary] ]
                  [ HH.text "Tournaments" ]
              , if state.loading
                  then
                    HH.div
                      [ HP.class_ $ classNames [thm theme TextSecondary] ]
                      [ HH.text "Loading tournaments..." ]
                  else case state.error of
                    Just err ->
                      HH.div
                        [ HP.class_ (HH.ClassName "text-red-600") ]
                        [ HH.text err ]
                    Nothing ->
                      if state.tournaments == []
                        then
                          HH.div
                            [ HP.class_ $ classNames [thm theme TextSecondary] ]
                            [ HH.text "No tournaments found." ]
                        else
                          HH.div_
                            (map (renderTournament theme) state.tournaments)
              ]
          ]
      ]

renderTournament :: forall w. Theme -> TournamentSummary -> HH.HTML w Action
renderTournament theme tournament =
  HH.div
    [ HP.class_ $ classNames [raw "p-4 mb-4", thm theme CardBackground, raw "border", thm theme SecondaryBorder, raw "rounded", thm theme HoverBackground, raw "cursor-pointer transition-colors shadow-md", thm theme ShadowColor]
    , HE.onClick \_ -> TournamentClick (unwrapTournamentId tournament.id)
    ]
    [ HH.h3
        [ HP.class_ $ classNames [raw "font-semibold text-lg ", thm theme TextPrimary] ]
        [ HH.text tournament.name ]
    , HH.p
        [ HP.class_ $ classNames [thm theme TextSecondary] ]
        [ HH.text $ tournament.city <> ", " <> show tournament.year <> " - " <> tournament.lexicon ]
    ]
  where
  unwrapTournamentId (TournamentId id) = id

handleAction :: forall m. MonadAff m => Action -> H.HalogenM State Action () Output m Unit
handleAction = case _ of
  Initialize -> do
    handleAction LoadTournaments

  LoadTournaments -> do
    H.modify_ _ { loading = true, error = Nothing }
    result <- H.liftAff TournamentAPI.listTournaments
    case result of
      Left err ->
        H.modify_ _ { loading = false, error = Just err }
      Right tournaments ->
        H.modify_ _ { loading = false, tournaments = tournaments }

  TournamentClick id -> do
    H.raise $ NavigateToTournament id

  AddTournamentClick -> do
    H.raise NavigateToAddTournament
