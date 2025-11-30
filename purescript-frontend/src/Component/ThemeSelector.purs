-- | Reusable theme selector component with preview cards
module Component.ThemeSelector where

import Prelude

import Config.Themes (allThemes)
import Data.Array as Array
import Data.String (Pattern(..), Replacement(..), replaceAll)
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)

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
        [ HP.class_ (HH.ClassName $ "block " <> currentTheme.colors.textPrimary <> " font-medium mb-3") ]
        [ HH.text "Tournament Theme" ]
    , HH.p
        [ HP.class_ (HH.ClassName $ currentTheme.colors.textSecondary <> " text-sm mb-4") ]
        [ HH.text "Choose the theme that will be used for this tournament's overlays" ]
    , HH.div
        [ HP.class_ (HH.ClassName "grid grid-cols-1 md:grid-cols-2 gap-3") ]
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
      [ HP.class_ (HH.ClassName $ "cursor-pointer p-3 rounded-lg " <> borderClass <> " hover:border-blue-400 transition-colors")
      , HE.onClick \_ -> onSelect themeOption.id
      ]
      [ HH.div
          [ HP.class_ (HH.ClassName "h-12 rounded border overflow-hidden relative") ]
          [ HH.div
              [ HP.class_ (HH.ClassName $ "h-full " <> themeOption.colors.pageBackground <> " relative") ]
              [ HH.div
                  [ HP.class_ (HH.ClassName $ "absolute inset-1 " <> themeOption.colors.cardBackground <> " rounded border " <> themeOption.colors.primaryBorder) ]
                  [ HH.div
                      [ HP.class_ (HH.ClassName $ "absolute top-0.5 left-0.5 right-0.5 h-1 " <> themeOption.colors.titleGradient <> " rounded-sm") ]
                      []
                  , HH.div
                      [ HP.class_ (HH.ClassName $ "absolute bottom-0.5 left-0.5 w-6 h-1 " <> textToBg themeOption.colors.positiveColor <> " rounded-sm") ]
                      []
                  , HH.div
                      [ HP.class_ (HH.ClassName $ "absolute bottom-0.5 right-0.5 w-4 h-1 " <> textToBg themeOption.colors.negativeColor <> " rounded-sm") ]
                      []
                  ]
              ]
          -- Theme name centered over the preview
          , HH.div
              [ HP.class_ (HH.ClassName "absolute inset-0 flex items-center justify-center") ]
              [ HH.div
                  [ HP.class_ (HH.ClassName $ "font-medium text-sm " <> themeOption.colors.textPrimary) ]
                  [ HH.text themeOption.name ]
              ]
          -- Radio button on the right
          , HH.div
              [ HP.class_ (HH.ClassName "absolute right-2 top-1/2 -translate-y-1/2") ]
              [ if isSelected then
                  HH.div
                    [ HP.class_ (HH.ClassName "w-3 h-3 bg-blue-600 rounded-full") ]
                    []
                else
                  HH.div
                    [ HP.class_ (HH.ClassName "w-3 h-3 border-2 border-gray-400 rounded-full") ]
                    []
              ]
          ]
      ]
