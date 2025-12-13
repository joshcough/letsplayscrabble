-- | CSS utility functions for cleaner class name composition
module Utils.CSS where

import Prelude

import CSS.Class (CSSClass)
import CSS.ThemeColor (ThemeColor)
import CSS.ThemeColor as ThemeColor
import Data.Array (intercalate)
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)

-- | A CSS value can be a typed class, a typed theme color, or a raw string
data CSSValue
  = Class CSSClass
  | ThemeClr Theme ThemeColor
  | Raw String

-- | Convert CSSValue to string
toString :: CSSValue -> String
toString = case _ of
  Class c -> show c
  ThemeClr theme color -> ThemeColor.getColor theme color
  Raw str -> str

-- | Combine multiple CSS values into a single space-separated string
classes :: Array CSSValue -> String
classes = intercalate " " <<< map toString

-- | Convenience function to create a ClassName from an array of CSS values
-- | Example: classNames [cls PageTitle, thm theme TextPrimary, raw "mb-4"]
classNames :: Array CSSValue -> HH.ClassName
classNames = HH.ClassName <<< classes

-- | Create HP.class_ directly from CSS values - cleaner at call sites
-- | Example: HP.class_ $ classNames [...] becomes: css [...]
-- | This is the recommended way to use CSS classes in components
css :: forall r i. Array CSSValue -> HP.IProp (class :: String | r) i
css = HP.class_ <<< classNames

-- | Create a CSSValue from a CSSClass
-- | Example: cls PageTitle
cls :: CSSClass -> CSSValue
cls = Class

-- | Create a CSSValue from a theme color
-- | Example: thm theme TextPrimary
thm :: Theme -> ThemeColor -> CSSValue
thm = ThemeClr

-- | Create a CSSValue from a raw string (use sparingly!)
-- | Example: raw "hover:bg-blue-500"
raw :: String -> CSSValue
raw = Raw

-- | Add hover: prefix to create a hover pseudo-class
-- | Example: hover "bg-blue-500" -> raw "hover:bg-blue-500"
-- | Usage: css [hover "bg-blue-500"]
hover :: String -> CSSValue
hover cls' = Raw ("hover:" <> cls')

-- | Add group-hover: prefix to create a group-hover pseudo-class
-- | Example: groupHover "opacity-20" -> raw "group-hover:opacity-20"
-- | Usage: css [groupHover "opacity-20"]
groupHover :: String -> CSSValue
groupHover cls' = Raw ("group-hover:" <> cls')

-- | Add focus: prefix to create a focus pseudo-class
-- | Example: focus "ring-2" -> raw "focus:ring-2"
-- | Usage: css [focus "ring-2"]
focus :: String -> CSSValue
focus cls' = Raw ("focus:" <> cls')

-- | Add active: prefix to create an active pseudo-class
-- | Example: active "bg-blue-700" -> raw "active:bg-blue-700"
-- | Usage: css [active "bg-blue-700"]
active :: String -> CSSValue
active cls' = Raw ("active:" <> cls')
