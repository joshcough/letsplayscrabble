-- | Generic picture renderer for overlay components
-- | Renders a themed grid of player cards with photos
module Renderer.PictureRenderer where

import Prelude

import Data.Array as Array
import Data.Maybe (Maybe(..))
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Utils.CSS (css, cls, raw)
import Utils.Format (formatPlayerName)
import CSS.Class (CSSClass(..))

-- | Player card data
type PlayerCard =
  { rank :: Int
  , name :: String
  , imageUrl :: String
  , stats :: Array StatRow
  }

-- | A single stat row on the card
type StatRow =
  { value :: String
  , color :: String
  , label :: Maybe String  -- Optional label to display above the value
  }

-- | Picture grid data structure
type PictureData =
  { title :: String
  , subtitle :: String
  , players :: Array PlayerCard
  }

-- | Render a complete overlay with picture grid
renderPictureOverlay :: forall w i. Theme -> PictureData -> HH.HTML w i
renderPictureOverlay theme pictureData =
  HH.div
    [ css [raw theme.colors.pageBackground, cls MinHScreen, cls Flex, cls ItemsCenter, cls JustifyCenter, cls P_6] ]
    [ HH.div
        [ css [cls MaxW_7xl, cls W_Full] ]
        [ -- Title section
          HH.div
            [ css [cls TextCenter, cls Mb_8] ]
            [ HH.h1
                [ css [cls Text_6xl, cls FontBlack, cls LeadingTight, cls Mb_4, raw theme.titleExtraClasses, raw theme.colors.titleGradient]
                ]
                [ HH.text pictureData.title ]
            , HH.div
                [ css [cls Text_3xl, cls FontBold, raw theme.colors.textSecondary] ]
                [ HH.text pictureData.subtitle ]
            ]
        , -- Players grid
          HH.div
            [ css [cls Flex, cls JustifyCenter, cls ItemsStart, cls Gap_6, cls Px_4] ]
            (Array.mapWithIndex (renderPlayerCard theme) pictureData.players)
        ]
    ]

-- | Render a single player card
renderPlayerCard :: forall w i. Theme -> Int -> PlayerCard -> HH.HTML w i
renderPlayerCard theme index player =
  HH.div
    [ css [cls Flex, cls FlexCol, cls ItemsCenter] ]
    [ -- Rank badge
      HH.div
        [ css [cls Relative, cls Mb_4] ]
        [ HH.div
            [ css [cls Absolute, cls NegTop_2, cls NegLeft_2, cls Z_10, cls W_10, cls H_10, cls BgWhite, cls RoundedFull, cls Flex, cls ItemsCenter, cls JustifyCenter, cls ShadowLg, cls Border_2, cls BorderGray_300] ]
            [ HH.span
                [ css [raw theme.colors.textPrimary, cls FontBlack, cls Text_Lg] ]
                [ HH.text $ "#" <> show player.rank ]
            ]
        , -- Player image
          HH.div
            [ css [cls W_36, cls H_36, cls Rounded_2xl, cls OverflowHidden, cls Border_2, raw theme.colors.primaryBorder, raw theme.colors.cardBackground, cls ShadowXl] ]
            [ HH.img
                [ HP.src player.imageUrl
                , HP.alt player.name
                , css [cls W_Full, cls H_Full, cls ObjectCover]
                ]
            ]
        ]
    , -- Player name
      HH.div
        [ css [raw theme.colors.textPrimary, cls Text_3xl, cls FontBlack, cls TextCenter, cls Mb_4, cls MaxW_48, raw "min-h-[4rem]", cls Flex, cls ItemsCenter, cls JustifyCenter] ]
        [ HH.text $ formatPlayerName player.name ]
    , -- Player stats
      HH.div
        [ css [raw theme.colors.cardBackground, cls RoundedXl, cls Px_6, cls P_4, cls Border, raw theme.colors.secondaryBorder, raw "min-h-[6rem]", cls Flex, cls FlexCol, cls JustifyCenter] ]
        [ HH.div
            [ css [cls TextCenter] ]
            (Array.mapWithIndex (renderStatRow theme) player.stats)
        ]
    ]

-- | Render a single stat row
renderStatRow :: forall w i. Theme -> Int -> StatRow -> HH.HTML w i
renderStatRow theme index stat =
  HH.div
    [ css [if index > 0 then cls Mt_2 else cls Empty] ]
    [ case stat.label of
        Just label ->
          HH.div_
            [ HH.div
                [ css [raw $ "text-" <> sizeClass index <> " font-" <> weightClass index <> " " <> stat.color <> " text-center"] ]
                [ HH.text stat.value ]
            , HH.div
                [ css [raw theme.colors.textSecondary, cls Text_Lg, cls FontBold, cls TextCenter, cls Uppercase, cls TrackingWider, cls Mt_1] ]
                [ HH.text label ]
            ]
        Nothing ->
          HH.div
            [ css [raw $ "text-" <> sizeClass index <> " font-" <> weightClass index <> " " <> stat.color <> " text-center"] ]
            [ HH.text stat.value ]
    ]
  where
    sizeClass idx = if idx == 0 then "6xl" else "3xl"
    weightClass idx = if idx == 0 then "black" else "black"
