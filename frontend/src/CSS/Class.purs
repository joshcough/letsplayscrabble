-- | Typed CSS class names
module CSS.Class where

import Prelude

-- | Common CSS classes from our index.css
data CSSClass
  -- Special
  = Empty  -- Empty class for conditionals (renders to empty string)
  -- Navigation
  | NavLink
  | NavLinkActive
  | NavUserButton
  | NavDropdown
  | NavDropdownItem
  -- Page layouts
  | PageContainer
  | PageHeader
  | PageTitle
  | PageSubtitle
  -- Cards
  | CardContainer
  | CardOverlay
  | CardContent
  | CardTitle
  | CardGrid
  -- Forms
  | FormContainer
  | FormGroup
  | FormLabel
  | FormInput
  | FormButton
  -- Grids
  | OverlayGrid
  -- Tournament components
  | TournamentCard
  | TournamentHeader
  | TournamentTitle
  | TournamentInfo
  | TournamentInfoRow
  -- Buttons
  | BtnPrimary
  | BtnSecondary
  -- Utilities
  | CenterContainer
  | LoadingContainer
  | ErrorMessage
  -- Logo
  | LogoContainer
  | LogoLink
  | LogoImage
  -- Footer
  | PageFooter
  -- Dropdowns
  | DropdownArrow
  | DropdownArrowOpen
  -- Tailwind utilities (common ones)
  | MinHScreen
  | HScreen
  | W_Full
  | H_Full
  | W_16
  | H_16
  | W_28
  | H_32
  | Flex
  | FlexCol
  | FlexRow
  | FlexRowReverse
  | FlexWrap
  | FlexGrow
  | FlexShrink_0
  | ItemsCenter
  | ItemsStart
  | JustifyCenter
  | JustifyBetween
  | Gap_2
  | Gap_3
  | Gap_4
  | Gap_6
  | Gap_8
  | Gap_X_4
  | Grid
  | GridCols_1
  | GridCols_2
  | GridCols_3
  | P_2
  | P_3
  | P_4
  | P_6
  | P_8
  | Px_2
  | Px_3
  | Px_4
  | Px_6
  | Py_1
  | Py_2
  | Py_3
  | M_2
  | M_4
  | Ml_2
  | Mr_2
  | Mb_1
  | Mb_2
  | Mb_3
  | Mb_4
  | Mb_6
  | Mb_8
  | Mb_16
  | Mt_2
  | Mt_3
  | Mt_4
  | Mt_5
  | Mt_6
  | Mt_8
  | Mt_12
  | Mx_Auto
  | Pb_2
  | Pr_3
  | Pr_4
  | Py_8
  | Rounded
  | RoundedMd
  | RoundedLg
  | RoundedXl
  | Rounded_2xl
  | RoundedFull
  | Border
  | Border_0
  | Border_2
  | BorderT
  | BorderB
  | BorderB_4
  | BorderSeparate
  | Shadow
  | ShadowMd
  | ShadowLg
  | ShadowXl
  | Shadow_2xl
  | Text_Xs
  | Text_Sm
  | Text_Base
  | Text_Lg
  | Text_Xl
  | Text_2xl
  | Text_3xl
  | Text_4xl
  | Text_5xl
  | Text_6xl
  | TextCenter
  | TextLeft
  | TextRight
  | TextTransparent
  | TextEllipsis
  | TextRed600
  | TextWhite
  | TextBlack
  | Uppercase
  | TrackingWide
  | TrackingWider
  | FontMedium
  | FontSemibold
  | FontBold
  | FontBlack
  | FontExtrabold
  | FontMono
  | Underline
  | BgClipText
  | Opacity_10
  | Opacity_20
  | Transition
  | TransitionAll
  | TransitionColors
  | Duration_200
  | CursorPointer
  | Block
  | Relative
  | Absolute
  | Right_0
  | Inset_0
  | SpaceY_1
  | SpaceY_2
  | SpaceY_6
  | Group
  | Flex_1
  | ColSpan_1
  | ColSpan_2
  | MaxW_Md
  | MaxW_4xl
  | MaxW_6xl
  | MaxW_7xl
  | OutlineNone
  | DisabledOpacity_50
  | DisabledCursorNotAllowed
  | FocusOutlineNone
  | FocusRing_2
  | FocusRingBlue_500
  | FocusBorderAmber_400
  | BackdropBlurXl
  | OverflowHidden
  | OverflowXAuto
  | WhitespaceNowrap
  | BreakAll
  | ObjectCover
  | AlignTop
  | TableFixed
  -- Colors
  | TextRed200
  | TextRed700
  | TextGreen600
  | TextGreen700
  | TextGray500
  | TextGray600
  | TextOrange200
  | TextOrange300
  | TextOrange800
  | TextBlue600
  | TextBlue800
  | BgRed_50
  | BgRed_100
  | BgGreen_50
  | BgGreen_100
  | BgGray_50
  | BgWhite
  | BorderRed_400
  | BorderGreen_400
  | BorderBlue_400
  | BorderGray_300
  | BorderGray_400
  | BorderOrange_400
  -- Additional spacing
  | Mt_1
  | Mr_6
  -- Negative spacing
  | NegTop_2
  | NegLeft_2
  -- Typography
  | LeadingTight
  -- Layout
  | MaxW_48
  -- Borders
  | RoundedSm
  | Rounded_3xl
  | Inset_1
  -- Width/Height
  | W_3
  | W_4
  | W_6
  | W_10
  | W_36
  | W_40
  | H_1
  | H_3
  | H_10
  | H_12
  | H_36
  | H_40
  -- Other
  | Z_10
  | Z_50
  | Ring_2
  | DropShadowLg
  | Opacity_70
  | Opacity_90

derive instance eqCSSClass :: Eq CSSClass
derive instance ordCSSClass :: Ord CSSClass

instance showCSSClass :: Show CSSClass where
  show = case _ of
    -- Special
    Empty -> ""
    -- Navigation
    NavLink -> "nav-link"
    NavLinkActive -> "nav-link-active"
    NavUserButton -> "nav-user-button"
    NavDropdown -> "nav-dropdown"
    NavDropdownItem -> "nav-dropdown-item"
    -- Page layouts
    PageContainer -> "page-container"
    PageHeader -> "page-header"
    PageTitle -> "page-title"
    PageSubtitle -> "page-subtitle"
    -- Cards
    CardContainer -> "card-container"
    CardOverlay -> "card-overlay"
    CardContent -> "card-content"
    CardTitle -> "card-title"
    CardGrid -> "card-grid"
    -- Forms
    FormContainer -> "form-container"
    FormGroup -> "form-group"
    FormLabel -> "form-label"
    FormInput -> "form-input"
    FormButton -> "form-button"
    -- Grids
    OverlayGrid -> "overlay-grid"
    -- Tournament
    TournamentCard -> "tournament-card"
    TournamentHeader -> "tournament-header"
    TournamentTitle -> "tournament-title"
    TournamentInfo -> "tournament-info"
    TournamentInfoRow -> "tournament-info-row"
    -- Buttons
    BtnPrimary -> "btn-primary"
    BtnSecondary -> "btn-secondary"
    -- Utilities
    CenterContainer -> "center-container"
    LoadingContainer -> "loading-container"
    ErrorMessage -> "error-message"
    -- Logo
    LogoContainer -> "logo-container"
    LogoLink -> "logo-link"
    LogoImage -> "logo-image"
    -- Footer
    PageFooter -> "page-footer"
    -- Dropdowns
    DropdownArrow -> "dropdown-arrow"
    DropdownArrowOpen -> "dropdown-arrow-open"
    -- Tailwind utilities
    MinHScreen -> "min-h-screen"
    HScreen -> "h-screen"
    W_Full -> "w-full"
    H_Full -> "h-full"
    W_16 -> "w-16"
    H_16 -> "h-16"
    W_28 -> "w-28"
    H_32 -> "h-32"
    Flex -> "flex"
    FlexCol -> "flex-col"
    FlexRow -> "flex-row"
    FlexRowReverse -> "flex-row-reverse"
    FlexWrap -> "flex-wrap"
    FlexGrow -> "flex-grow"
    FlexShrink_0 -> "flex-shrink-0"
    ItemsCenter -> "items-center"
    ItemsStart -> "items-start"
    JustifyCenter -> "justify-center"
    JustifyBetween -> "justify-between"
    Gap_2 -> "gap-2"
    Gap_3 -> "gap-3"
    Gap_4 -> "gap-4"
    Gap_6 -> "gap-6"
    Gap_8 -> "gap-8"
    Gap_X_4 -> "gap-x-4"
    Grid -> "grid"
    GridCols_1 -> "grid-cols-1"
    GridCols_2 -> "grid-cols-2"
    GridCols_3 -> "grid-cols-3"
    P_2 -> "p-2"
    P_3 -> "p-3"
    P_4 -> "p-4"
    P_6 -> "p-6"
    P_8 -> "p-8"
    Px_2 -> "px-2"
    Px_3 -> "px-3"
    Px_4 -> "px-4"
    Px_6 -> "px-6"
    Py_1 -> "py-1"
    Py_2 -> "py-2"
    Py_3 -> "py-3"
    M_2 -> "m-2"
    M_4 -> "m-4"
    Ml_2 -> "ml-2"
    Mr_2 -> "mr-2"
    Mb_1 -> "mb-1"
    Mb_2 -> "mb-2"
    Mb_3 -> "mb-3"
    Mb_4 -> "mb-4"
    Mb_6 -> "mb-6"
    Mb_8 -> "mb-8"
    Mb_16 -> "mb-16"
    Mt_2 -> "mt-2"
    Mt_3 -> "mt-3"
    Mt_4 -> "mt-4"
    Mt_5 -> "mt-5"
    Mt_6 -> "mt-6"
    Mt_8 -> "mt-8"
    Mt_12 -> "mt-12"
    Mx_Auto -> "mx-auto"
    Pb_2 -> "pb-2"
    Pr_3 -> "pr-3"
    Pr_4 -> "pr-4"
    Py_8 -> "py-8"
    Rounded -> "rounded"
    RoundedMd -> "rounded-md"
    RoundedLg -> "rounded-lg"
    RoundedXl -> "rounded-xl"
    Rounded_2xl -> "rounded-2xl"
    RoundedFull -> "rounded-full"
    Border -> "border"
    Border_0 -> "border-0"
    Border_2 -> "border-2"
    BorderT -> "border-t"
    BorderB -> "border-b"
    BorderB_4 -> "border-b-4"
    BorderSeparate -> "border-separate"
    Shadow -> "shadow"
    ShadowMd -> "shadow-md"
    ShadowLg -> "shadow-lg"
    ShadowXl -> "shadow-xl"
    Shadow_2xl -> "shadow-2xl"
    Text_Xs -> "text-xs"
    Text_Sm -> "text-sm"
    Text_Base -> "text-base"
    Text_Lg -> "text-lg"
    Text_Xl -> "text-xl"
    Text_2xl -> "text-2xl"
    Text_3xl -> "text-3xl"
    Text_4xl -> "text-4xl"
    Text_5xl -> "text-5xl"
    Text_6xl -> "text-6xl"
    TextCenter -> "text-center"
    TextLeft -> "text-left"
    TextRight -> "text-right"
    TextTransparent -> "text-transparent"
    TextEllipsis -> "text-ellipsis"
    TextRed600 -> "text-red-600"
    TextWhite -> "text-white"
    TextBlack -> "text-black"
    Uppercase -> "uppercase"
    TrackingWide -> "tracking-wide"
    TrackingWider -> "tracking-wider"
    FontMedium -> "font-medium"
    FontSemibold -> "font-semibold"
    FontBold -> "font-bold"
    FontBlack -> "font-black"
    FontExtrabold -> "font-extrabold"
    FontMono -> "font-mono"
    Underline -> "underline"
    BgClipText -> "bg-clip-text"
    Opacity_10 -> "opacity-10"
    Opacity_20 -> "opacity-20"
    Transition -> "transition"
    TransitionAll -> "transition-all"
    TransitionColors -> "transition-colors"
    Duration_200 -> "duration-200"
    CursorPointer -> "cursor-pointer"
    Block -> "block"
    Relative -> "relative"
    Absolute -> "absolute"
    Right_0 -> "right-0"
    Inset_0 -> "inset-0"
    SpaceY_1 -> "space-y-1"
    SpaceY_2 -> "space-y-2"
    SpaceY_6 -> "space-y-6"
    Group -> "group"
    Flex_1 -> "flex-1"
    ColSpan_1 -> "col-span-1"
    ColSpan_2 -> "col-span-2"
    MaxW_Md -> "max-w-md"
    MaxW_4xl -> "max-w-4xl"
    MaxW_6xl -> "max-w-6xl"
    MaxW_7xl -> "max-w-7xl"
    OutlineNone -> "outline-none"
    DisabledOpacity_50 -> "disabled:opacity-50"
    DisabledCursorNotAllowed -> "disabled:cursor-not-allowed"
    FocusOutlineNone -> "focus:outline-none"
    FocusRing_2 -> "focus:ring-2"
    FocusRingBlue_500 -> "focus:ring-blue-500"
    FocusBorderAmber_400 -> "focus:border-amber-400"
    BackdropBlurXl -> "backdrop-blur-xl"
    OverflowHidden -> "overflow-hidden"
    OverflowXAuto -> "overflow-x-auto"
    WhitespaceNowrap -> "whitespace-nowrap"
    BreakAll -> "break-all"
    ObjectCover -> "object-cover"
    AlignTop -> "align-top"
    TableFixed -> "table-fixed"
    -- Colors
    TextRed200 -> "text-red-200"
    TextRed700 -> "text-red-700"
    TextGreen600 -> "text-green-600"
    TextGreen700 -> "text-green-700"
    TextGray500 -> "text-gray-500"
    TextGray600 -> "text-gray-600"
    TextOrange200 -> "text-orange-200"
    TextOrange300 -> "text-orange-300"
    TextOrange800 -> "text-orange-800"
    TextBlue600 -> "text-blue-600"
    TextBlue800 -> "text-blue-800"
    BgRed_50 -> "bg-red-50"
    BgRed_100 -> "bg-red-100"
    BgGreen_50 -> "bg-green-50"
    BgGreen_100 -> "bg-green-100"
    BgGray_50 -> "bg-gray-50"
    BgWhite -> "bg-white"
    BorderRed_400 -> "border-red-400"
    BorderGreen_400 -> "border-green-400"
    BorderBlue_400 -> "border-blue-400"
    BorderGray_300 -> "border-gray-300"
    BorderGray_400 -> "border-gray-400"
    BorderOrange_400 -> "border-orange-400"
    -- Additional spacing
    Mt_1 -> "mt-1"
    Mr_6 -> "mr-6"
    -- Negative spacing
    NegTop_2 -> "-top-2"
    NegLeft_2 -> "-left-2"
    -- Typography
    LeadingTight -> "leading-tight"
    -- Layout
    MaxW_48 -> "max-w-48"
    -- Borders
    RoundedSm -> "rounded-sm"
    Rounded_3xl -> "rounded-3xl"
    Inset_1 -> "inset-1"
    -- Width/Height
    W_3 -> "w-3"
    W_4 -> "w-4"
    W_6 -> "w-6"
    W_10 -> "w-10"
    W_36 -> "w-36"
    W_40 -> "w-40"
    H_1 -> "h-1"
    H_3 -> "h-3"
    H_10 -> "h-10"
    H_12 -> "h-12"
    H_36 -> "h-36"
    H_40 -> "h-40"
    -- Other
    Z_10 -> "z-10"
    Z_50 -> "z-50"
    Ring_2 -> "ring-2"
    DropShadowLg -> "drop-shadow-lg"
    Opacity_70 -> "opacity-70"
    Opacity_90 -> "opacity-90"

-- | Convert CSS class to string
toString :: CSSClass -> String
toString = show
