-- | HTML rendering helper functions
module Utils.HTML where

import Prelude

import Halogen.HTML as HH
import Utils.CSS (css, raw)

-- | Helper to create a text div with raw CSS classes (for classes not yet in typed system)
textDivRaw :: forall w i. String -> String -> HH.HTML w i
textDivRaw cssClasses text = HH.div [ css [raw cssClasses] ] [ HH.text text ]

-- | Helper to create a simple black text div (most common case)
blackTextDiv :: forall w i. String -> HH.HTML w i
blackTextDiv = textDivRaw "text-black"
