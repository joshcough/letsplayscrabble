-- | Login page component
module Component.LoginPage where

import Prelude

import CSS.Class as C
import CSS.Class (CSSClass(..))
import CSS.ThemeColor (ThemeColor(..))

import API.Auth as AuthAPI
import Config.Themes (getTheme)
import Data.Either (Either(..), either)
import Data.Maybe (Maybe(..))
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Utils.CSS (cls, css, raw, thm)
import Web.Event.Event (Event, preventDefault)

type State =
  { username :: String
  , password :: String
  , error :: Maybe String
  , loading :: Boolean
  , theme :: Theme
  }

data Action
  = Initialize
  | UpdateUsername String
  | UpdatePassword String
  | HandleSubmit Event
  | LoginSuccess { token :: String, userId :: Int, username :: String }
  | LoginFailure String

type Output =
  { token :: String
  , userId :: Int
  , username :: String
  }

component :: forall query input m. MonadAff m => H.Component query input Output m
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
  { username: ""
  , password: ""
  , error: Nothing
  , loading: false
  , theme: getTheme "scrabble"
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  let theme = state.theme
  in
    HH.div
      [ css [thm theme PageBackground, cls CenterContainer, cls P_6] ]
      [ HH.div
          [ css [cls MaxW_Md, cls C.W_Full] ]
          [ -- Title
            HH.div
              [ css [cls C.TextCenter, cls C.Mb_8] ]
              [ HH.h1
                  [ css [cls Text_5xl, cls FontBlack, cls Mb_2, raw theme.titleExtraClasses, thm theme TitleGradient]
                  ]
                  [ HH.text "Let's Play Scrabble" ]
              , HH.p
                  [ css [cls Text_Lg, thm theme TextSecondary] ]
                  [ HH.text "Sign in to manage your tournaments" ]
              ]
          , -- Login form
            HH.form
              [ css [thm theme CardBackground, cls Rounded_2xl, cls P_8, cls Border_2, thm theme PrimaryBorder, cls Shadow_2xl, thm theme ShadowColor]
              , HE.onSubmit HandleSubmit
              ]
              [ -- Error message
                case state.error of
                  Just err ->
                    HH.div
                      [ css [cls Mb_6, cls P_4, raw "bg-red-900/50", cls Border, raw "border-red-400/50", cls RoundedLg, cls TextRed200, cls Text_Sm] ]
                      [ HH.text err ]
                  Nothing -> HH.text ""
              , -- Username field
                HH.div
                  [ css [cls Mb_6] ]
                  [ HH.label
                      [ css [cls FormLabel, thm theme TextPrimary]
                      , HP.for "username"
                      ]
                      [ HH.text "Username" ]
                  , HH.input
                      [ HP.type_ HP.InputText
                      , HP.id "username"
                      , HP.value state.username
                      , HE.onValueInput UpdateUsername
                      , css [cls W_Full, cls Px_4, cls Py_3, cls RoundedLg, cls Border_2, thm theme PrimaryBorder, raw "bg-black/20", thm theme TextPrimary, cls FocusOutlineNone, cls FocusBorderAmber_400, cls TransitionColors]
                      , HP.placeholder "Enter your username"
                      , HP.required true
                      , HP.disabled state.loading
                      ]
                  ]
              , -- Password field
                HH.div
                  [ css [cls Mb_6] ]
                  [ HH.label
                      [ css [cls FormLabel, thm theme TextPrimary]
                      , HP.for "password"
                      ]
                      [ HH.text "Password" ]
                  , HH.input
                      [ HP.type_ HP.InputPassword
                      , HP.id "password"
                      , HP.value state.password
                      , HE.onValueInput UpdatePassword
                      , css [cls W_Full, cls Px_4, cls Py_3, cls RoundedLg, cls Border_2, thm theme PrimaryBorder, raw "bg-black/20", thm theme TextPrimary, cls FocusOutlineNone, cls FocusBorderAmber_400, cls TransitionColors]
                      , HP.placeholder "Enter your password"
                      , HP.required true
                      , HP.disabled state.loading
                      ]
                  ]
              , -- Submit button
                HH.button
                  [ HP.type_ HP.ButtonSubmit
                  , css [cls W_Full, cls Py_3, cls Px_4, cls RoundedLg, cls FontBold, cls Text_Lg, cls TransitionAll, raw 
                      if state.loading
                        then "bg-gray-600 text-gray-400 cursor-not-allowed"
                        else "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 cursor-pointer"]
                  , HP.disabled state.loading
                  ]
                  [ HH.text if state.loading then "Signing in..." else "Sign In" ]
              ]
          ]
      ]

handleAction :: forall m. MonadAff m => Action -> H.HalogenM State Action () Output m Unit
handleAction = case _ of
  Initialize -> pure unit

  UpdateUsername username ->
    H.modify_ _ { username = username, error = Nothing }

  UpdatePassword password ->
    H.modify_ _ { password = password, error = Nothing }

  HandleSubmit event -> do
    H.liftEffect $ preventDefault event
    state <- H.get
    H.modify_ _ { loading = true, error = Nothing }

    -- Make API call
    result <- H.liftAff $ AuthAPI.login
      { username: state.username
      , password: state.password
      }

    handleAction $ either LoginFailure LoginSuccess result

  LoginSuccess { token, userId, username } ->
    H.raise { token, userId, username }

  LoginFailure error ->
    H.modify_ _ { loading = false, error = Just error }
