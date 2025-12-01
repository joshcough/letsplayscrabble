-- | Add Tournament Page Component
-- | Form for creating new tournaments
module Component.AddTournament where

import Prelude

import CSS.Class (CSSClass(..))
import CSS.ThemeColor (ThemeColor(..))

import API.Tournament as TournamentApi
import Component.ThemeSelector as ThemeSelector
import Config.Themes (scrabbleTheme)
import Data.Either (Either(..))
import Data.Int as Int
import Data.Maybe (Maybe(..), fromMaybe)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Effect.Console as Console
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Utils.CSS (cls, css, thm)
import Utils.Auth (isAuthenticated)
import Web.Event.Event (Event, preventDefault)

-- | Form data matching CreateTournamentParams
type FormData =
  { name :: String
  , city :: String
  , year :: Int
  , lexicon :: String
  , longFormName :: String
  , dataUrl :: String
  , theme :: String
  }

type State =
  { formData :: FormData
  , loading :: Boolean
  , error :: Maybe String
  , success :: Maybe String
  , theme :: Theme
  }

data Action
  = Initialize
  | UpdateName String
  | UpdateCity String
  | UpdateYear String
  | UpdateLexicon String
  | UpdateLongFormName String
  | UpdateDataUrl String
  | SelectTheme String
  | Submit Event

type Input = Unit

component :: forall query output m. MonadAff m => H.Component query Input output m
component = H.mkComponent
  { initialState: const initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = handleAction
      , initialize = Just Initialize
      }
  }

initialState :: State
initialState =
  { formData:
      { name: ""
      , city: ""
      , year: 2025
      , lexicon: ""
      , longFormName: ""
      , dataUrl: ""
      , theme: "scrabble"
      }
  , loading: false
  , error: Nothing
  , success: Nothing
  , theme: scrabbleTheme
  }

handleAction :: forall output m. MonadAff m => Action -> H.HalogenM State Action () output m Unit
handleAction = case _ of
  Initialize -> do
    authenticated <- liftEffect isAuthenticated
    when (not authenticated) do
      H.modify_ _ { error = Just "Please log in to add tournaments" }

  UpdateName value ->
    H.modify_ \st -> st { formData = st.formData { name = value } }

  UpdateCity value ->
    H.modify_ \st -> st { formData = st.formData { city = value } }

  UpdateYear value ->
    let year = fromMaybe 2025 (Int.fromString value)
    in H.modify_ \st -> st { formData = st.formData { year = year } }

  UpdateLexicon value ->
    H.modify_ \st -> st { formData = st.formData { lexicon = value } }

  UpdateLongFormName value ->
    H.modify_ \st -> st { formData = st.formData { longFormName = value } }

  UpdateDataUrl value ->
    H.modify_ \st -> st { formData = st.formData { dataUrl = value } }

  SelectTheme themeName -> do
    H.modify_ \st -> st { formData = st.formData { theme = themeName } }

  Submit event -> do
    liftEffect $ preventDefault event
    state <- H.get

    H.modify_ _ { loading = true, error = Nothing, success = Nothing }

    -- Convert ThemeName to String for API
    let apiParams =
          { name: state.formData.name
          , city: state.formData.city
          , year: state.formData.year
          , lexicon: state.formData.lexicon
          , longFormName: state.formData.longFormName
          , dataUrl: state.formData.dataUrl
          , theme: state.formData.theme
          }

    result <- H.liftAff $ TournamentApi.createTournament apiParams

    case result of
      Left err -> do
        liftEffect $ Console.log $ "[AddTournament] Create failed: " <> err
        H.modify_ _ { loading = false, error = Just err }

      Right _ -> do
        liftEffect $ Console.log $ "[AddTournament] Tournament created successfully"
        H.modify_ _
          { loading = false
          , success = Just "Tournament created successfully!"
          , formData = initialState.formData
          }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  let theme = state.theme
  in
    HH.div
      [ css [thm theme CardBackground, cls P_6, cls RoundedLg, cls ShadowMd] ]
              [ -- Header
                HH.div
                  [ HP.class_ (HH.ClassName "flex justify-between items-center mb-6") ]
                  [ HH.h2
                      [ css [cls PageTitle, thm theme TextPrimary] ]
                      [ HH.text "Add New Tournament" ]
                  ]

              -- Feedback messages
              , renderFeedback state theme

              -- Form
              , HH.form
                  [ HE.onSubmit Submit
                  , HP.class_ (HH.ClassName $ show SpaceY_6)
                  ]
                  [ -- Tournament Name
                    renderInputField "Name" "name" state.formData.name UpdateName theme state.loading
                  , renderInputField "City" "city" state.formData.city UpdateCity theme state.loading
                  , renderNumberField "Year" "year" state.formData.year UpdateYear theme state.loading
                  , renderInputField "Lexicon" "lexicon" state.formData.lexicon UpdateLexicon theme state.loading
                  , renderInputField "Display Name" "longFormName" state.formData.longFormName UpdateLongFormName theme state.loading
                  , renderInputField "Data URL" "dataUrl" state.formData.dataUrl UpdateDataUrl theme state.loading

                  -- Theme Selector
                  , ThemeSelector.renderThemeSelector state.formData.theme theme SelectTheme

                  -- Submit Button
                  , HH.button
                      [ HP.type_ HP.ButtonSubmit
                      , HP.disabled state.loading
                      , css [cls W_Full, thm theme CardBackground, thm theme TextPrimary, cls Py_2, cls Px_4, cls Rounded, thm theme HoverBackground, cls TransitionColors, thm theme ShadowColor, cls ShadowMd, cls Border_2, thm theme PrimaryBorder, cls Mt_6, cls DisabledOpacity_50, cls DisabledCursorNotAllowed]
                      ]
                      [ HH.text $ if state.loading then "Adding Tournament..." else "Add Tournament" ]
                  ]
              ]

renderFeedback :: forall w. State -> Theme -> HH.HTML w Action
renderFeedback state _theme =
  HH.div
    [ css [cls Mb_4] ]
    [ case state.error of
        Just err ->
          HH.div
            [ HP.class_ (HH.ClassName "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded") ]
            [ HH.text err ]
        Nothing -> HH.text ""
    , case state.success of
        Just msg ->
          HH.div
            [ HP.class_ (HH.ClassName "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded") ]
            [ HH.text msg ]
        Nothing -> HH.text ""
    ]

renderInputField :: forall w. String -> String -> String -> (String -> Action) -> Theme -> Boolean -> HH.HTML w Action
renderInputField label fieldId value updateAction theme disabled =
  HH.div_
    [ HH.label
        [ HP.for fieldId
        , css [cls Block, thm theme TextPrimary, cls FontMedium, cls Mb_1]
        ]
        [ HH.text label ]
    , HH.input
        [ HP.type_ HP.InputText
        , HP.id fieldId
        , HP.value value
        , HE.onValueInput updateAction
        , HP.required true
        , HP.disabled disabled
        , css [cls W_Full, cls P_2, cls Border_2, thm theme SecondaryBorder, cls Rounded, thm theme CardBackground, thm theme TextPrimary, cls FocusRing_2, cls FocusRingBlue_500, cls OutlineNone, cls TransitionColors]
        ]
    ]

renderNumberField :: forall w. String -> String -> Int -> (String -> Action) -> Theme -> Boolean -> HH.HTML w Action
renderNumberField label fieldId value updateAction theme disabled =
  HH.div_
    [ HH.label
        [ HP.for fieldId
        , css [cls Block, thm theme TextPrimary, cls FontMedium, cls Mb_1]
        ]
        [ HH.text label ]
    , HH.input
        [ HP.type_ HP.InputNumber
        , HP.id fieldId
        , HP.value (show value)
        , HE.onValueInput updateAction
        , HP.required true
        , HP.disabled disabled
        , css [cls W_Full, cls P_2, cls Border_2, thm theme SecondaryBorder, cls Rounded, thm theme CardBackground, thm theme TextPrimary, cls FocusRing_2, cls FocusRingBlue_500, cls OutlineNone, cls TransitionColors]
        ]
    ]

