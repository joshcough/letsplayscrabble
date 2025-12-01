-- | Generic picture renderer for overlay components
-- | Renders a themed grid of player cards with photos
module Renderer.PictureRenderer where

import Prelude

import Data.Array as Array
import Data.Maybe (Maybe(..))
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Utils.Format (formatPlayerName)

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
    [ HP.class_ (HH.ClassName $ theme.colors.pageBackground <> " min-h-screen flex items-center justify-center p-6") ]
    [ HH.div
        [ HP.class_ (HH.ClassName "max-w-7xl w-full") ]
        [ -- Title section
          HH.div
            [ HP.class_ (HH.ClassName "text-center mb-8") ]
            [ HH.h1
                [ HP.class_ (HH.ClassName $ "text-6xl font-black leading-tight mb-4 " <>
                    if theme.name == "original"
                      then theme.colors.titleGradient
                      else "text-transparent bg-clip-text " <> theme.colors.titleGradient)
                ]
                [ HH.text pictureData.title ]
            , HH.div
                [ HP.class_ (HH.ClassName $ "text-3xl font-bold " <> theme.colors.textSecondary) ]
                [ HH.text pictureData.subtitle ]
            ]
        , -- Players grid
          HH.div
            [ HP.class_ (HH.ClassName "flex justify-center items-start gap-6 px-4") ]
            (Array.mapWithIndex (renderPlayerCard theme) pictureData.players)
        ]
    ]

-- | Render a single player card
renderPlayerCard :: forall w i. Theme -> Int -> PlayerCard -> HH.HTML w i
renderPlayerCard theme index player =
  HH.div
    [ HP.class_ (HH.ClassName "flex flex-col items-center") ]
    [ -- Rank badge
      HH.div
        [ HP.class_ (HH.ClassName "relative mb-4") ]
        [ HH.div
            [ HP.class_ (HH.ClassName "absolute -top-2 -left-2 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-300") ]
            [ HH.span
                [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " font-black text-lg") ]
                [ HH.text $ "#" <> show player.rank ]
            ]
        , -- Player image
          HH.div
            [ HP.class_ (HH.ClassName $ "w-36 h-36 rounded-2xl overflow-hidden border-2 " <> theme.colors.primaryBorder <> " " <> theme.colors.cardBackground <> " shadow-xl") ]
            [ HH.img
                [ HP.src player.imageUrl
                , HP.alt player.name
                , HP.class_ (HH.ClassName "w-full h-full object-cover")
                ]
            ]
        ]
    , -- Player name
      HH.div
        [ HP.class_ (HH.ClassName $ theme.colors.textPrimary <> " text-3xl font-black text-center mb-4 max-w-48 min-h-[4rem] flex items-center justify-center") ]
        [ HH.text $ formatPlayerName player.name ]
    , -- Player stats
      HH.div
        [ HP.class_ (HH.ClassName $ theme.colors.cardBackground <> " rounded-xl px-6 py-4 border " <> theme.colors.secondaryBorder <> " min-h-[6rem] flex flex-col justify-center") ]
        [ HH.div
            [ HP.class_ (HH.ClassName "text-center") ]
            (Array.mapWithIndex (renderStatRow theme) player.stats)
        ]
    ]

-- | Render a single stat row
renderStatRow :: forall w i. Theme -> Int -> StatRow -> HH.HTML w i
renderStatRow theme index stat =
  HH.div
    [ HP.class_ (HH.ClassName $ if index > 0 then "mt-2" else "") ]
    [ case stat.label of
        Just label ->
          HH.div_
            [ HH.div
                [ HP.class_ (HH.ClassName $ "text-" <> sizeClass index <> " font-" <> weightClass index <> " " <> stat.color <> " text-center") ]
                [ HH.text stat.value ]
            , HH.div
                [ HP.class_ (HH.ClassName $ theme.colors.textSecondary <> " text-lg font-bold text-center uppercase tracking-wider mt-1") ]
                [ HH.text label ]
            ]
        Nothing ->
          HH.div
            [ HP.class_ (HH.ClassName $ "text-" <> sizeClass index <> " font-" <> weightClass index <> " " <> stat.color <> " text-center") ]
            [ HH.text stat.value ]
    ]
  where
    sizeClass idx = if idx == 0 then "6xl" else "3xl"
    weightClass idx = if idx == 0 then "black" else "black"
