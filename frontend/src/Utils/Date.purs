module Utils.Date where

import Prelude (Unit, unit)

foreign import todayISOImpl :: Unit -> String
foreign import toLocaleDateStringImpl :: String -> String

todayISO :: String
todayISO = todayISOImpl unit

-- Convert ISO date string to locale date string
-- Matches TypeScript: new Date(dateStr).toLocaleDateString()
toLocaleDateString :: String -> String
toLocaleDateString = toLocaleDateStringImpl
