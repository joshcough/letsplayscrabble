-- | Typed CSS class names
module CSS.Class where

import Prelude

-- | Common CSS classes from our index.css
data CSSClass
  -- Navigation
  = NavLink
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
  | W_Full
  | H_Full
  | Flex
  | FlexCol
  | FlexRow
  | ItemsCenter
  | JustifyCenter
  | JustifyBetween
  | Gap_2
  | Gap_4
  | Gap_8
  | Grid
  | GridCols_1
  | GridCols_2
  | GridCols_3
  | P_2
  | P_4
  | P_6
  | P_8
  | Px_2
  | Px_4
  | Py_2
  | Py_3
  | M_2
  | M_4
  | Mb_2
  | Mb_3
  | Mb_4
  | Mb_6
  | Mb_8
  | Mt_2
  | Mt_4
  | Mt_8
  | Mt_12
  | Rounded
  | RoundedLg
  | RoundedXl
  | Border
  | Border_2
  | BorderT
  | BorderB
  | Shadow
  | ShadowMd
  | ShadowLg
  | Text_Sm
  | Text_Lg
  | Text_Xl
  | Text_2xl
  | Text_3xl
  | Text_4xl
  | TextCenter
  | FontMedium
  | FontSemibold
  | FontBold
  | Underline
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
  | Inset_0
  | SpaceY_1
  | SpaceY_2
  | SpaceY_6

derive instance eqCSSClass :: Eq CSSClass
derive instance ordCSSClass :: Ord CSSClass

instance showCSSClass :: Show CSSClass where
  show = case _ of
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
    W_Full -> "w-full"
    H_Full -> "h-full"
    Flex -> "flex"
    FlexCol -> "flex-col"
    FlexRow -> "flex-row"
    ItemsCenter -> "items-center"
    JustifyCenter -> "justify-center"
    JustifyBetween -> "justify-between"
    Gap_2 -> "gap-2"
    Gap_4 -> "gap-4"
    Gap_8 -> "gap-8"
    Grid -> "grid"
    GridCols_1 -> "grid-cols-1"
    GridCols_2 -> "grid-cols-2"
    GridCols_3 -> "grid-cols-3"
    P_2 -> "p-2"
    P_4 -> "p-4"
    P_6 -> "p-6"
    P_8 -> "p-8"
    Px_2 -> "px-2"
    Px_4 -> "px-4"
    Py_2 -> "py-2"
    Py_3 -> "py-3"
    M_2 -> "m-2"
    M_4 -> "m-4"
    Mb_2 -> "mb-2"
    Mb_3 -> "mb-3"
    Mb_4 -> "mb-4"
    Mb_6 -> "mb-6"
    Mb_8 -> "mb-8"
    Mt_2 -> "mt-2"
    Mt_4 -> "mt-4"
    Mt_8 -> "mt-8"
    Mt_12 -> "mt-12"
    Rounded -> "rounded"
    RoundedLg -> "rounded-lg"
    RoundedXl -> "rounded-xl"
    Border -> "border"
    Border_2 -> "border-2"
    BorderT -> "border-t"
    BorderB -> "border-b"
    Shadow -> "shadow"
    ShadowMd -> "shadow-md"
    ShadowLg -> "shadow-lg"
    Text_Sm -> "text-sm"
    Text_Lg -> "text-lg"
    Text_Xl -> "text-xl"
    Text_2xl -> "text-2xl"
    Text_3xl -> "text-3xl"
    Text_4xl -> "text-4xl"
    TextCenter -> "text-center"
    FontMedium -> "font-medium"
    FontSemibold -> "font-semibold"
    FontBold -> "font-bold"
    Underline -> "underline"
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
    Inset_0 -> "inset-0"
    SpaceY_1 -> "space-y-1"
    SpaceY_2 -> "space-y-2"
    SpaceY_6 -> "space-y-6"

-- | Convert CSS class to string
toString :: CSSClass -> String
toString = show
