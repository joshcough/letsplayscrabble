-- | Navigation bar component
module Component.Navigation where

import Prelude

import CSS.Class (CSSClass(..))
import CSS.ThemeColor (ThemeColor(..))
import Config.Themes (getTheme)
import Data.Maybe (Maybe(..))
import Effect.Class (class MonadEffect)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Core (Namespace(..))
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Route (Route(..))
import Types.Theme (Theme)
import Utils.CSS (CSSValue, cls, css, raw, thm)
import Web.UIEvent.MouseEvent (MouseEvent)

type Input =
  { username :: String
  , userId :: Int
  , currentRoute :: Maybe Route
  }

data Output
  = Logout
  | NavigateToHome
  | NavigateToOverlays
  | NavigateToTournamentManager
  | NavigateToCurrentMatch

type State =
  { username :: String
  , userId :: Int
  , theme :: Theme
  , isDropdownOpen :: Boolean
  , isAdminDropdownOpen :: Boolean
  , currentRoute :: Maybe Route
  }

data Action
  = Initialize
  | Receive Input
  | HandleLogout
  | HandleHomeClick
  | HandleOverlaysClick
  | HandleTournamentManagerClick
  | HandleCurrentMatchClick
  | ToggleDropdown MouseEvent
  | ToggleAdminDropdown MouseEvent
  | CloseDropdown

component :: forall query m. MonadEffect m => H.Component query Input Output m
component = H.mkComponent
  { initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = handleAction
      , initialize = Just Initialize
      , receive = Just <<< Receive
      }
  }

initialState :: Input -> State
initialState input =
  { username: input.username
  , userId: input.userId
  , theme: getTheme "scrabble"
  , isDropdownOpen: false
  , isAdminDropdownOpen: false
  , currentRoute: input.currentRoute
  }

-- | Get active class for a navigation link
getActiveClass :: Maybe Route -> Route -> CSSValue
getActiveClass currentRoute route =
  case currentRoute of
    Just r | r == route -> cls NavLinkActive
    _ -> cls Empty

-- | Check if admin section is active
isAdminActive :: Maybe Route -> Boolean
isAdminActive currentRoute =
  case currentRoute of
    Just CurrentMatch -> true
    _ -> false

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  let theme = state.theme
  in
    HH.nav
      [ css [thm theme CardBackground, cls BorderB_4, thm theme PrimaryBorder]
      , HP.attr (HH.AttrName "style") "position: relative; z-index: 1000;"
      ]
      [ HH.div
          [ css [cls MaxW_7xl, cls Mx_Auto, cls Px_4, raw "sm:px-6 lg:px-8"] ]
          [ HH.div
              [ css [cls Flex, cls JustifyBetween, cls H_16] ]
              [ -- Left side - All nav links
                HH.div
                  [ css [cls Flex, cls Gap_2] ]
                  [ -- Home link
                    HH.button
                      [ css [cls NavLink, thm theme TextPrimary, thm theme HoverBackground, getActiveClass state.currentRoute Home]
                      , HE.onClick \_ -> HandleHomeClick
                      ]
                      [ HH.text "Home" ]
                  , -- Tournament Manager link
                    HH.button
                      [ css [cls NavLink, thm theme TextPrimary, thm theme HoverBackground, getActiveClass state.currentRoute TournamentManager]
                      , HE.onClick \_ -> HandleTournamentManagerClick
                      ]
                      [ HH.text "Tournament Manager" ]
                  , -- Overlays link
                    HH.button
                      [ css [cls NavLink, thm theme TextPrimary, thm theme HoverBackground, getActiveClass state.currentRoute Overlays]
                      , HE.onClick \_ -> HandleOverlaysClick
                      ]
                      [ HH.text "Overlays" ]
                  , -- Admin dropdown
                    HH.div
                      [ css [cls Relative]
                      , HP.attr (HH.AttrName "style") "z-index: 1001;"
                      ]
                      [ HH.button
                          [ css
                              [ cls NavLink
                              , thm theme TextPrimary
                              , thm theme HoverBackground
                              , if isAdminActive state.currentRoute then cls NavLinkActive else cls Empty
                              ]
                          , HE.onClick ToggleAdminDropdown
                          ]
                          [ HH.text "Admin"
                          , -- Dropdown arrow SVG
                            HH.elementNS (Namespace "http://www.w3.org/2000/svg") (HH.ElemName "svg")
                              [ HP.attr (HH.AttrName "class") $ "dropdown-arrow" <>
                                  if state.isAdminDropdownOpen then " dropdown-arrow-open" else ""
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
                      , -- Admin dropdown menu
                        if state.isAdminDropdownOpen
                          then
                            HH.div
                              [ css [raw "nav-dropdown"]
                              , HP.attr (HH.AttrName "style") "z-index: 9999;"
                              ]
                              [ HH.div
                                  [ css [cls Py_1] ]
                                  [ HH.button
                                      [ css [raw "nav-dropdown-item"]
                                      , HE.onClick \_ -> HandleCurrentMatchClick
                                      ]
                                      [ HH.text "Current Match" ]
                                  ]
                              ]
                          else HH.text ""
                      ]
                  ]
              , -- Right side - User dropdown
                HH.div
                  [ css [cls Flex, cls ItemsCenter] ]
                  [ HH.div
                      [ css [cls Relative] ]
                      [ HH.button
                          [ css [cls NavUserButton, thm theme TextPrimary, thm theme HoverBackground]
                          , HE.onClick ToggleDropdown
                          ]
                          [ HH.text state.username
                          , -- Dropdown arrow SVG
                            HH.elementNS (Namespace "http://www.w3.org/2000/svg") (HH.ElemName "svg")
                              [ HP.attr (HH.AttrName "class") $ "dropdown-arrow" <>
                                  if state.isDropdownOpen then " dropdown-arrow-open" else ""
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
                              [ css [raw "nav-dropdown", cls Right_0, cls Z_50] ]
                              [ HH.div
                                  [ css [cls Py_1] ]
                                  [ -- User ID
                                    HH.div
                                      [ css [cls Px_4, cls Py_2, cls Text_Xs, cls TextGray500, cls BorderB] ]
                                      [ HH.text $ "ID: " <> show state.userId ]
                                  , -- Settings link (TODO: implement)
                                    HH.button
                                      [ css [raw "nav-dropdown-item"]
                                      ]
                                      [ HH.text "Settings" ]
                                  , -- Logout button
                                    HH.button
                                      [ css [raw "nav-dropdown-item"]
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

  Receive input -> do
    H.modify_ _ { currentRoute = input.currentRoute }

  HandleLogout -> do
    H.modify_ _ { isDropdownOpen = false }
    H.raise Logout

  HandleHomeClick -> do
    H.modify_ _ { isDropdownOpen = false, isAdminDropdownOpen = false }
    H.raise NavigateToHome

  HandleOverlaysClick -> do
    H.modify_ _ { isDropdownOpen = false, isAdminDropdownOpen = false }
    H.raise NavigateToOverlays

  HandleTournamentManagerClick -> do
    H.modify_ _ { isDropdownOpen = false, isAdminDropdownOpen = false }
    H.raise NavigateToTournamentManager

  HandleCurrentMatchClick -> do
    H.modify_ _ { isDropdownOpen = false, isAdminDropdownOpen = false }
    H.raise NavigateToCurrentMatch

  ToggleDropdown _ -> do
    state <- H.get
    H.modify_ _ { isDropdownOpen = not state.isDropdownOpen }

  ToggleAdminDropdown _ -> do
    state <- H.get
    H.modify_ _ { isAdminDropdownOpen = not state.isAdminDropdownOpen }

  CloseDropdown ->
    H.modify_ _ { isDropdownOpen = false }
