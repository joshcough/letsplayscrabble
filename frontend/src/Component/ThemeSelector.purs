-- | Reusable theme selector component with preview cards
module Component.ThemeSelector where

import Prelude

import Config.Themes (allThemes)
import Data.Array as Array
import Data.String (Pattern(..), Replacement(..), replaceAll)
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Types.Theme (Theme)
import Utils.CSS (css, cls, hover, raw)
import CSS.Class (CSSClass(..))

-- | Convert text color class to background color class for preview bars
textToBg :: String -> String
textToBg = replaceAll (Pattern "text-") (Replacement "bg-")

-- | Render theme selector with preview cards
-- | Takes:
-- |   - selectedThemeId: The ID of the currently selected theme
-- |   - currentTheme: The theme to use for styling the selector itself
-- |   - onSelect: Action to raise when a theme is clicked
renderThemeSelector :: forall w action. String -> Theme -> (String -> action) -> HH.HTML w action
renderThemeSelector selectedThemeId currentTheme onSelect =
  HH.div_
    [ HH.label
        [ css [cls Block, raw currentTheme.colors.textPrimary, cls FontMedium, cls Mb_3] ]
        [ HH.text "Tournament Theme" ]
    , HH.p
        [ css [raw currentTheme.colors.textSecondary, cls Text_Sm, cls Mb_4] ]
        [ HH.text "Choose the theme that will be used for this tournament's overlays" ]
    , HH.div
        [ css [cls Grid, cls GridCols_1, raw "md:grid-cols-2", cls Gap_3] ]
        (Array.mapWithIndex (\_ themeOption -> renderThemeCard selectedThemeId currentTheme onSelect themeOption) allThemes)
    ]

-- | Render a single theme card with preview
-- | Takes:
-- |   - selectedThemeId: The ID of the currently selected theme
-- |   - currentTheme: The theme to use for styling the card borders/text
-- |   - onSelect: Action to raise when clicked
-- |   - themeOption: The theme being displayed in this card
renderThemeCard :: forall w action. String -> Theme -> (String -> action) -> Theme -> HH.HTML w action
renderThemeCard selectedThemeId _currentTheme onSelect themeOption =
  let
    isSelected = selectedThemeId == themeOption.id
    borderClass = if isSelected
                  then "border-blue-600 border-2 bg-blue-50"
                  else "border-gray-300 border"
  in
    HH.div
      [ css [cls CursorPointer, cls P_3, cls RoundedLg, raw borderClass, hover "border-blue-400", cls TransitionColors]
      , HE.onClick \_ -> onSelect themeOption.id
      ]
      [ HH.div
          [ css [cls H_12, cls Rounded, cls Border, cls OverflowHidden, cls Relative] ]
          [ HH.div
              [ css [cls H_Full, raw themeOption.colors.pageBackground, cls Relative] ]
              [ HH.div
                  [ css [cls Absolute, cls Inset_1, raw themeOption.colors.cardBackground, cls Rounded, cls Border, raw themeOption.colors.primaryBorder] ]
                  [ HH.div
                      [ css [cls Absolute, raw "top-0.5 left-0.5 right-0.5", cls H_1, raw themeOption.colors.titleGradient, cls RoundedSm] ]
                      []
                  , HH.div
                      [ css [cls Absolute, raw "bottom-0.5 left-0.5", cls W_6, cls H_1, raw (textToBg themeOption.colors.positiveColor), cls RoundedSm] ]
                      []
                  , HH.div
                      [ css [cls Absolute, raw "bottom-0.5 right-0.5", cls W_4, cls H_1, raw (textToBg themeOption.colors.negativeColor), cls RoundedSm] ]
                      []
                  ]
              ]
          -- Theme name centered over the preview
          , HH.div
              [ css [cls Absolute, cls Inset_0, cls Flex, cls ItemsCenter, cls JustifyCenter] ]
              [ HH.div
                  [ css [cls FontMedium, cls Text_Sm, raw themeOption.colors.textPrimary] ]
                  [ HH.text themeOption.name ]
              ]
          -- Radio button on the right
          , HH.div
              [ css [raw "absolute right-2 top-1/2 -translate-y-1/2"] ]
              [ if isSelected then
                  HH.div
                    [ css [cls W_3, cls H_3, cls TextBlue600, cls RoundedFull] ]
                    []
                else
                  HH.div
                    [ css [cls W_3, cls H_3, cls Border_2, cls BorderGray_400, cls RoundedFull] ]
                    []
              ]
          ]
      ]
