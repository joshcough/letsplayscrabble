-- | CSS utility functions for cleaner class name composition
module Utils.CSS where

import Prelude

import CSS.Class (CSSClass)
import CSS.Class as CSSClass
import CSS.ThemeColor (ThemeColor)
import CSS.ThemeColor as ThemeColor
import Data.Array (intercalate)
import Halogen.HTML as HH
import Types.Theme (Theme)

-- | A CSS value can be a typed class, a typed theme color, or a raw string
data CSSValue
  = Class CSSClass
  | ThemeClr Theme ThemeColor
  | Raw String

-- | Convert CSSValue to string
toString :: CSSValue -> String
toString = case _ of
  Class cls -> show cls
  ThemeClr theme color -> ThemeColor.getColor theme color
  Raw str -> str

-- | Combine multiple CSS values into a single space-separated string
classes :: Array CSSValue -> String
classes = intercalate " " <<< map toString

-- | Convenience function to create a ClassName from an array of CSS values
-- | Example: classNames [cls PageTitle, thm theme TextPrimary, raw "mb-4"]
classNames :: Array CSSValue -> HH.ClassName
classNames = HH.ClassName <<< classes

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

-- | Add hover: prefix to a raw string
-- | Example: hover "bg-blue-500" -> "hover:bg-blue-500"
hover :: String -> String
hover cls' = "hover:" <> cls'

-- | Add group-hover: prefix to a raw string
-- | Example: groupHover "opacity-20" -> "group-hover:opacity-20"
groupHover :: String -> String
groupHover cls' = "group-hover:" <> cls'

-- | Add focus: prefix to a raw string
-- | Example: focus "ring-2" -> "focus:ring-2"
focus :: String -> String
focus cls' = "focus:" <> cls'

-- | Add active: prefix to a raw string
-- | Example: active "bg-blue-700" -> "active:bg-blue-700"
active :: String -> String
active cls' = "active:" <> cls'
