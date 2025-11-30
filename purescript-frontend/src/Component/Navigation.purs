-- | Navigation bar component
module Component.Navigation where

import Prelude

import Config.Themes (getTheme)
import Data.Maybe (Maybe(..))
import Effect.Class (class MonadEffect)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Core (Namespace(..))
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Web.UIEvent.MouseEvent (MouseEvent)

type Input =
  { username :: String
  , userId :: Int
  }

data Output
  = Logout
  | NavigateToOverlays

type State =
  { username :: String
  , userId :: Int
  , theme :: Theme
  , isDropdownOpen :: Boolean
  }

data Action
  = Initialize
  | HandleLogout
  | HandleOverlaysClick
  | ToggleDropdown MouseEvent
  | CloseDropdown

component :: forall query m. MonadEffect m => H.Component query Input Output m
component = H.mkComponent
  { initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = handleAction
      , initialize = Just Initialize
      }
  }

initialState :: Input -> State
initialState input =
  { username: input.username
  , userId: input.userId
  , theme: getTheme "scrabble"
  , isDropdownOpen: false
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  let theme = state.theme
      pageTextPrimary = theme.colors.textPrimary
      hoverBg = theme.colors.hoverBackground
  in
    HH.nav
      [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " border-b-4 " <> theme.colors.primaryBorder) ]
      [ HH.div
          [ HP.class_ (HH.ClassName "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8") ]
          [ HH.div
              [ HP.class_ (HH.ClassName "flex justify-between h-16") ]
              [ -- Left side - All nav links
                HH.div
                  [ HP.class_ (HH.ClassName "flex space-x-2") ]
                  [ -- Home link (TODO: implement routing)
                    HH.button
                      [ HP.class_ (HH.ClassName $ "inline-flex items-center px-4 py-2 mt-3 mb-3 " <>
                          pageTextPrimary <> " font-medium rounded " <>
                          hoverBg <> " transition-colors duration-200")
                      ]
                      [ HH.text "Home" ]
                  , -- Tournament Manager link (TODO: implement)
                    HH.button
                      [ HP.class_ (HH.ClassName $ "inline-flex items-center px-4 py-2 mt-3 mb-3 " <>
                          pageTextPrimary <> " font-medium rounded " <>
                          hoverBg <> " transition-colors duration-200")
                      ]
                      [ HH.text "Tournament Manager" ]
                  , -- Overlays link
                    HH.button
                      [ HP.class_ (HH.ClassName $ "inline-flex items-center px-4 py-2 mt-3 mb-3 " <>
                          pageTextPrimary <> " font-medium rounded " <>
                          hoverBg <> " transition-colors duration-200")
                      , HE.onClick \_ -> HandleOverlaysClick
                      ]
                      [ HH.text "Overlays" ]
                  , -- Admin dropdown (TODO: implement dropdown)
                    HH.button
                      [ HP.class_ (HH.ClassName $ "inline-flex items-center px-4 py-2 mt-3 mb-3 " <>
                          pageTextPrimary <> " font-medium rounded " <>
                          hoverBg <> " transition-colors duration-200")
                      ]
                      [ HH.text "Admin"
                      , -- Dropdown arrow SVG
                        HH.elementNS (Namespace "http://www.w3.org/2000/svg") (HH.ElemName "svg")
                          [ HP.attr (HH.AttrName "class") "ml-2 h-4 w-4 transition-transform"
                          , HP.attr (HH.AttrName "fill") "none"
                          , HP.attr (HH.AttrName "stroke") "currentColor"
                          , HP.attr (HH.AttrName "viewBox") "0 0 24 24"
                          ]
                          [ HH.elementNS (Namespace "http://www.w3.org/2000/svg") (HH.ElemName "path")
                              [ HP.attr (HH.AttrName "stroke-linecap") "round"
                              , HP.attr (HH.AttrName "stroke-linejoin") "round"
                              , HP.attr (HH.AttrName "stroke-width") "2"
                              , HP.attr (HH.AttrName "d") "M19 9l-7 7-7-7"
                              ]
                              []
                          ]
                      ]
                  ]
              , -- Right side - User dropdown
                HH.div
                  [ HP.class_ (HH.ClassName "flex items-center") ]
                  [ HH.div
                      [ HP.class_ (HH.ClassName "relative") ]
                      [ HH.button
                          [ HP.class_ (HH.ClassName $ "inline-flex items-center px-4 py-2 " <>
                              pageTextPrimary <> " font-medium rounded " <>
                              hoverBg <> " transition-colors duration-200")
                          , HE.onClick ToggleDropdown
                          ]
                          [ HH.text state.username
                          , -- Dropdown arrow SVG
                            HH.elementNS (Namespace "http://www.w3.org/2000/svg") (HH.ElemName "svg")
                              [ HP.attr (HH.AttrName "class") $ "ml-2 h-4 w-4 transition-transform " <>
                                  if state.isDropdownOpen then "rotate-180" else ""
                              , HP.attr (HH.AttrName "fill") "none"
                              , HP.attr (HH.AttrName "stroke") "currentColor"
                              , HP.attr (HH.AttrName "viewBox") "0 0 24 24"
                              ]
                              [ HH.elementNS (Namespace "http://www.w3.org/2000/svg") (HH.ElemName "path")
                                  [ HP.attr (HH.AttrName "stroke-linecap") "round"
                                  , HP.attr (HH.AttrName "stroke-linejoin") "round"
                                  , HP.attr (HH.AttrName "stroke-width") "2"
                                  , HP.attr (HH.AttrName "d") "M19 9l-7 7-7-7"
                                  ]
                                  []
                              ]
                          ]
                      , -- Dropdown menu
                        if state.isDropdownOpen
                          then
                            HH.div
                              [ HP.class_ (HH.ClassName "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50") ]
                              [ HH.div
                                  [ HP.class_ (HH.ClassName "py-1") ]
                                  [ -- User ID
                                    HH.div
                                      [ HP.class_ (HH.ClassName "px-4 py-2 text-xs text-gray-500 border-b") ]
                                      [ HH.text $ "ID: " <> show state.userId ]
                                  , -- Settings link (TODO: implement)
                                    HH.button
                                      [ HP.class_ (HH.ClassName "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200")
                                      ]
                                      [ HH.text "Settings" ]
                                  , -- Logout button
                                    HH.button
                                      [ HP.class_ (HH.ClassName "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200")
                                      , HE.onClick \_ -> HandleLogout
                                      ]
                                      [ HH.text "Logout" ]
                                  ]
                              ]
                          else HH.text ""
                      ]
                  ]
              ]
          ]
      ]

handleAction :: forall m. MonadEffect m => Action -> H.HalogenM State Action () Output m Unit
handleAction = case _ of
  Initialize -> pure unit

  HandleLogout -> do
    H.modify_ _ { isDropdownOpen = false }
    H.raise Logout

  HandleOverlaysClick -> H.raise NavigateToOverlays

  ToggleDropdown _ -> do
    state <- H.get
    H.modify_ _ { isDropdownOpen = not state.isDropdownOpen }

  CloseDropdown ->
    H.modify_ _ { isDropdownOpen = false }
