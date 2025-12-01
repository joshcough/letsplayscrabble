-- | Generic table renderer for overlay components
-- | Renders a themed table with configurable columns and rows
module Renderer.TableRenderer where

import Prelude

import Data.Array as Array
import Data.Maybe (Maybe(..))
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)

-- | Cell renderer type
data CellRenderer
  = RankCell          -- Renders rank with # prefix
  | NameCell          -- Renders name with medal for top 3
  | TextCell Alignment  -- Renders plain text with alignment
  | ColoredTextCell Alignment (String -> String)  -- Renders text with dynamic color based on value

-- | Text alignment options
data Alignment = Left | Center | Right

-- | Column configuration
type Column =
  { header :: String
  , align :: Alignment
  , renderer :: CellRenderer
  }

-- | Table data structure
type TableData =
  { title :: String
  , subtitle :: String
  , columns :: Array Column
  , rows :: Array (Array String)
  }

-- | Render a complete overlay with table
renderTableOverlay :: forall w i. Theme -> TableData -> HH.HTML w i
renderTableOverlay theme tableData =
  HH.div
    [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
    [ HH.div
        [ HP.class_ (HH.ClassName "max-w-7xl w-full") ]
        [ -- Title section
          HH.div
            [ HP.class_ (HH.ClassName "text-center mb-8") ]
            [ HH.h1
                [ HP.class_ (HH.ClassName $ "text-6xl font-black leading-tight mb-4 " <> theme.colors.textPrimary) ]
                [ HH.text tableData.title ]
            , HH.div
                [ HP.class_ (HH.ClassName $ "text-3xl font-bold " <> theme.colors.textSecondary) ]
                [ HH.text tableData.subtitle ]
            ]
        , -- Table
          renderTable theme tableData.columns tableData.rows
        ]
    ]

-- | Render just the table (without page wrapper)
renderTable :: forall w i. Theme -> Array Column -> Array (Array String) -> HH.HTML w i
renderTable theme columns rows =
  HH.div
    [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " rounded-2xl px-6 py-3 border-2 " <> theme.colors.primaryBorder <> " shadow-2xl " <> theme.colors.shadowColor) ]
    [ HH.div
        [ HP.class_ (HH.ClassName "overflow-x-auto") ]
        [ HH.table
            [ HP.class_ (HH.ClassName "w-full") ]
            [ HH.thead_
                [ HH.tr
                    [ HP.class_ (HH.ClassName $ "border-b-2 " <> theme.colors.primaryBorder) ]
                    (Array.mapWithIndex (renderHeader theme) columns)
                ]
            , HH.tbody_
                (Array.mapWithIndex (renderRow theme columns) rows)
            ]
        ]
    ]

-- | Render a table header cell
renderHeader :: forall w i. Theme -> Int -> Column -> HH.HTML w i
renderHeader theme _ column =
  HH.th
    [ HP.class_ (HH.ClassName $ "px-4 py-1 " <> alignmentClass column.align <> " " <> theme.colors.textPrimary <> " text-xl font-black uppercase tracking-wider") ]
    [ HH.text column.header ]

-- | Render a table row
renderRow :: forall w i. Theme -> Array Column -> Int -> Array String -> HH.HTML w i
renderRow theme columns rowIndex cellValues =
  HH.tr
    [ HP.class_ (HH.ClassName $ "border-b last:border-0 transition-colors " <> theme.colors.secondaryBorder <> " " <> theme.colors.hoverBackground) ]
    (Array.zipWith (renderCell theme rowIndex) columns cellValues)

-- | Render a table cell based on its renderer type
renderCell :: forall w i. Theme -> Int -> Column -> String -> HH.HTML w i
renderCell theme rowIndex column cellValue =
  case column.renderer of
    RankCell -> renderRankCell theme rowIndex cellValue
    NameCell -> renderNameCell theme rowIndex cellValue
    TextCell align -> renderTextCell align theme rowIndex cellValue
    ColoredTextCell align getColor -> renderColoredTextCell align getColor theme rowIndex cellValue

-- | Get CSS class for alignment
alignmentClass :: Alignment -> String
alignmentClass = case _ of
  Left -> "text-left"
  Center -> "text-center"
  Right -> "text-right"

-- | Helper: Render a simple text cell
renderTextCell :: forall w i. Alignment -> Theme -> Int -> String -> HH.HTML w i
renderTextCell align theme _ value =
  HH.td
    [ HP.class_ (HH.ClassName $ "px-4 py-1 " <> alignmentClass align <> " " <> theme.colors.textPrimary <> " text-2xl font-black") ]
    [ HH.text value ]

-- | Helper: Render a colored text cell
renderColoredTextCell :: forall w i. Alignment -> (String -> String) -> Theme -> Int -> String -> HH.HTML w i
renderColoredTextCell align getColor _ _ value =
  HH.td
    [ HP.class_ (HH.ClassName $ "px-4 py-1 " <> alignmentClass align <> " " <> getColor value <> " text-2xl font-black") ]
    [ HH.text value ]

-- | Helper: Render a rank cell with # prefix
renderRankCell :: forall w i. Theme -> Int -> String -> HH.HTML w i
renderRankCell theme _ value =
  HH.td
    [ HP.class_ (HH.ClassName $ "px-4 py-1 text-center " <> theme.colors.textPrimary <> " text-2xl font-black") ]
    [ HH.text $ "#" <> value ]

-- | Helper: Render a name cell with optional medal
renderNameCell :: forall w i. Theme -> Int -> String -> HH.HTML w i
renderNameCell theme index name =
  let
    medal = case index of
      0 -> Just "🥇"
      1 -> Just "🥈"
      2 -> Just "🥉"
      _ -> Nothing
  in
    HH.td
      [ HP.class_ (HH.ClassName $ "px-4 py-1 text-left " <> theme.colors.textPrimary <> " text-2xl font-black") ]
      [ HH.div
          [ HP.class_ (HH.ClassName "flex items-center gap-2") ]
          [ case medal of
              Just m -> HH.span [ HP.class_ (HH.ClassName "text-2xl") ] [ HH.text m ]
              Nothing -> HH.text ""
          , HH.text name
          ]
      ]
