-- | Generic table renderer for overlay components
-- | Renders a themed table with configurable columns and rows
module Renderer.TableRenderer where

import Prelude

import Data.Array as Array
import Data.Maybe (Maybe(..))
import Halogen.HTML as HH
import Types.Theme (Theme)
import Utils.CSS (css, cls, raw)
import CSS.Class (CSSClass(..))

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
    [ css [raw theme.colors.pageBackground, cls MinHScreen, cls Flex, cls ItemsCenter, cls JustifyCenter, cls P_6] ]
    [ HH.div
        [ css [cls MaxW_7xl, cls W_Full] ]
        [ -- Title section
          HH.div
            [ css [cls TextCenter, cls Mb_8] ]
            [ HH.h1
                [ css [cls Text_6xl, cls FontBlack, cls LeadingTight, cls Mb_4, raw theme.colors.textPrimary] ]
                [ HH.text tableData.title ]
            , HH.div
                [ css [cls Text_3xl, cls FontBold, raw theme.colors.textSecondary] ]
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
    [ css [raw theme.colors.cardBackground, cls Rounded_2xl, cls Px_6, cls Py_3, cls Border_2, raw theme.colors.primaryBorder, cls Shadow_2xl, raw theme.colors.shadowColor] ]
    [ HH.div
        [ css [cls OverflowXAuto] ]
        [ HH.table
            [ css [cls W_Full] ]
            [ HH.thead_
                [ HH.tr
                    [ css [raw $ "border-b-2 " <> theme.colors.primaryBorder] ]
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
    [ css [cls Px_4, cls Py_1, raw (alignmentClass column.align), raw theme.colors.textPrimary, cls Text_Xl, cls FontBlack, cls Uppercase, cls TrackingWider] ]
    [ HH.text column.header ]

-- | Render a table row
renderRow :: forall w i. Theme -> Array Column -> Int -> Array String -> HH.HTML w i
renderRow theme columns rowIndex cellValues =
  HH.tr
    [ css [cls BorderB, raw "last:border-0", cls TransitionColors, raw theme.colors.secondaryBorder, raw theme.colors.hoverBackground] ]
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
    [ css [cls Px_4, cls Py_1, raw (alignmentClass align), raw theme.colors.textPrimary, cls Text_2xl, cls FontBlack] ]
    [ HH.text value ]

-- | Helper: Render a colored text cell
renderColoredTextCell :: forall w i. Alignment -> (String -> String) -> Theme -> Int -> String -> HH.HTML w i
renderColoredTextCell align getColor _ _ value =
  HH.td
    [ css [cls Px_4, cls Py_1, raw (alignmentClass align), raw (getColor value), cls Text_2xl, cls FontBlack] ]
    [ HH.text value ]

-- | Helper: Render a rank cell with # prefix
renderRankCell :: forall w i. Theme -> Int -> String -> HH.HTML w i
renderRankCell theme _ value =
  HH.td
    [ css [cls Px_4, cls Py_1, cls TextCenter, raw theme.colors.textPrimary, cls Text_2xl, cls FontBlack] ]
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
      [ css [cls Px_4, cls Py_1, cls TextLeft, raw theme.colors.textPrimary, cls Text_2xl, cls FontBlack] ]
      [ HH.div
          [ css [cls Flex, cls ItemsCenter, cls Gap_2] ]
          [ case medal of
              Just m -> HH.span [ css [cls Text_2xl] ] [ HH.text m ]
              Nothing -> HH.text ""
          , HH.text name
          ]
      ]
