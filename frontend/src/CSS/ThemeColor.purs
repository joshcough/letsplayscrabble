-- | Typed theme color accessors
module CSS.ThemeColor where

import Prelude
import Types.Theme (Theme)

-- | Theme color types
data ThemeColor
  = PageBackground
  | CardBackground
  | TextPrimary
  | TextSecondary
  | TextAccent
  | PrimaryBorder
  | SecondaryBorder
  | HoverBackground
  | ShadowColor
  | TitleGradient
  | PositiveColor
  | NegativeColor

derive instance eqThemeColor :: Eq ThemeColor
derive instance ordThemeColor :: Ord ThemeColor

-- | Get the CSS class string for a theme color
getColor :: Theme -> ThemeColor -> String
getColor theme = case _ of
  PageBackground -> theme.colors.pageBackground
  CardBackground -> theme.colors.cardBackground
  TextPrimary -> theme.colors.textPrimary
  TextSecondary -> theme.colors.textSecondary
  TextAccent -> theme.colors.textAccent
  PrimaryBorder -> theme.colors.primaryBorder
  SecondaryBorder -> theme.colors.secondaryBorder
  HoverBackground -> theme.colors.hoverBackground
  ShadowColor -> theme.colors.shadowColor
  TitleGradient -> theme.colors.titleGradient
  PositiveColor -> theme.colors.positiveColor
  NegativeColor -> theme.colors.negativeColor
