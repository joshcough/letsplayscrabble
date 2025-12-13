-- | Tournament Manager page component
module Component.TournamentManagerPage where

import Prelude

import CSS.Class as C
import CSS.Class (CSSClass(..))
import CSS.ThemeColor (ThemeColor(..))

import Backend.MonadBackend (class MonadBackend, listTournaments)
import Config.Themes (getTheme)
import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..), TournamentSummary)
import Effect.Class (class MonadEffect)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Types.Theme (Theme)
import Utils.CSS (cls, css, thm)
import Utils.Halogen (withLoading)

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

component :: forall query m. MonadBackend m => MonadEffect m => H.Component query Unit Output m
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
      [ css [cls MinHScreen, thm theme PageBackground] ]
      [ HH.div
          [ css [cls PageContainer] ]
          [ -- Buttons
            HH.div
              [ css [cls C.Mb_6, cls C.Flex, cls C.Gap_4] ]
              [ HH.button
                  [ css [cls Px_6, cls Py_2, thm theme CardBackground, thm theme TextPrimary, cls RoundedMd, thm theme HoverBackground, cls TransitionColors, thm theme ShadowColor, cls ShadowMd, cls Border_2, thm theme PrimaryBorder]
                  ]
                  [ HH.text "View All Tournaments" ]
              , HH.button
                  [ css [cls Px_6, cls Py_2, thm theme CardBackground, thm theme TextPrimary, cls RoundedMd, thm theme HoverBackground, cls TransitionColors, thm theme ShadowColor, cls ShadowMd, cls Border_2, thm theme PrimaryBorder]
                  , HE.onClick \_ -> AddTournamentClick
                  ]
                  [ HH.text "Add New Tournament" ]
              ]
          , -- Tournament List
            HH.div
              [ css [thm theme CardBackground, cls RoundedLg, cls ShadowMd, cls P_6] ]
              [ HH.h2
                  [ css [cls PageTitle, cls Mb_6, thm theme TextPrimary] ]
                  [ HH.text "Tournaments" ]
              , if state.loading
                  then
                    HH.div
                      [ css [thm theme TextSecondary] ]
                      [ HH.text "Loading tournaments..." ]
                  else case state.error of
                    Just err ->
                      HH.div
                        [ css [cls C.TextRed600] ]
                        [ HH.text err ]
                    Nothing ->
                      if state.tournaments == []
                        then
                          HH.div
                            [ css [thm theme TextSecondary] ]
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
    [ css [cls P_4, cls Mb_4, thm theme CardBackground, cls Border, thm theme SecondaryBorder, cls Rounded, thm theme HoverBackground, cls CursorPointer, cls TransitionColors, cls ShadowMd, thm theme ShadowColor]
    , HE.onClick \_ -> TournamentClick (unwrapTournamentId tournament.id)
    ]
    [ HH.h3
        [ css [cls FontSemibold, cls Text_Lg, thm theme TextPrimary] ]
        [ HH.text tournament.name ]
    , HH.p
        [ css [thm theme TextSecondary] ]
        [ HH.text $ tournament.city <> ", " <> show tournament.year <> " - " <> tournament.lexicon ]
    ]
  where
  unwrapTournamentId (TournamentId id) = id

handleAction :: forall m. MonadBackend m => MonadEffect m => Action -> H.HalogenM State Action () Output m Unit
handleAction = case _ of
  Initialize -> do
    handleAction LoadTournaments

  LoadTournaments ->
    withLoading listTournaments \tournaments ->
      H.modify_ _ { tournaments = tournaments }

  TournamentClick id -> do
    H.raise $ NavigateToTournament id

  AddTournamentClick -> do
    H.raise NavigateToAddTournament
