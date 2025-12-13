-- | Tournament Details page component
module Component.TournamentDetailsPage where

import Prelude

import CSS.Class (CSSClass(..))
import CSS.ThemeColor (ThemeColor(..))

import Backend.MonadBackend (class MonadBackend, clearCache, enablePolling, fullRefetchTournament, getTournamentRow, refetchTournament, stopPolling, updateTournament)
import Component.ThemeSelector as ThemeSelector
import Config.Themes (getTheme)
import Data.Int (fromString) as Int
import Data.JSDate (parse, toDateString)
import Data.Maybe (Maybe(..), maybe)
import Data.Foldable (for_)
import Domain.Types (TournamentId(..), TournamentSummary, UserId(..))
import Effect.Class (class MonadEffect, liftEffect)
import Utils.Logger (log)
import Effect.Unsafe (unsafePerformEffect)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Utils.Auth as Auth
import Utils.CSS (cls, css, hover, raw, thm)
import Utils.Halogen (withLoading)

type Input =
  { tournamentId :: Int
  }

type State =
  { tournamentId :: Int
  , tournament :: Maybe TournamentSummary
  , loading :: Boolean
  , error :: Maybe String
  , userId :: Maybe Int
  , theme :: Theme
  , editing :: Boolean
  , editForm :: EditForm
  , pollingDays :: Int
  }

type EditForm =
  { name :: String
  , longFormName :: String
  , city :: String
  , year :: String
  , lexicon :: String
  , theme :: String
  , dataUrl :: String
  }

data Action
  = Initialize
  | LoadTournament
  | HandleBackClick
  | HandleEditClick
  | HandleSaveClick
  | HandleCancelClick
  | HandleFieldChange Field String
  | HandlePollingDaysChange String
  | HandleStartPolling
  | HandleStopPolling
  | HandleClearCache
  | HandleRefetch
  | HandleFullRefetch

data Field
  = Name
  | LongFormName
  | City
  | Year
  | Lexicon
  | ThemeField
  | DataUrl

data Output
  = NavigateBack

component :: forall query m. MonadBackend m => MonadEffect m => H.Component query Input Output m
component = H.mkComponent
  { initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = handleAction
      , initialize = Just Initialize
      }
  }

initialState :: Input -> State
initialState input =
  { tournamentId: input.tournamentId
  , tournament: Nothing
  , loading: true
  , error: Nothing
  , userId: Nothing
  , theme: getTheme "scrabble"
  , editing: false
  , editForm: emptyEditForm
  , pollingDays: 4
  }

emptyEditForm :: EditForm
emptyEditForm =
  { name: ""
  , longFormName: ""
  , city: ""
  , year: ""
  , lexicon: ""
  , theme: ""
  , dataUrl: ""
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  let theme = state.theme
  in
    HH.div
      [ css [cls MinHScreen, thm theme PageBackground] ]
      [ HH.div
          [ css [cls PageContainer] ]
          [ HH.div
              [ css [thm theme CardBackground, cls P_6, cls RoundedLg, cls ShadowMd] ]
              [ HH.div
                  [ css [cls Flex, cls ItemsCenter, cls JustifyBetween, cls Mb_4] ]
                  [ HH.h2
                      [ css [cls PageTitle, thm theme TextPrimary] ]
                      [ HH.text $ maybe
                          ("Tournament #" <> show state.tournamentId)
                          _.name
                          state.tournament
                      ]
                  , HH.div
                      [ css [cls Flex, cls Gap_2] ]
                      [ if state.editing then
                          HH.div
                            [ css [cls Flex, cls Gap_2] ]
                            [ HH.button
                                [ css [cls BtnSecondary, cls Text_Sm, thm theme CardBackground, thm theme PrimaryBorder, thm theme HoverBackground]
                                , HE.onClick \_ -> HandleSaveClick
                                ]
                                [ HH.text "Save" ]
                            , HH.button
                                [ css [raw "btn-secondary", cls Text_Sm, hover "bg-gray-50"]
                                , HE.onClick \_ -> HandleCancelClick
                                ]
                                [ HH.text "Cancel" ]
                            ]
                        else
                          HH.button
                            [ css [cls BtnSecondary, cls Text_Sm, thm theme CardBackground, thm theme PrimaryBorder, thm theme HoverBackground]
                            , HE.onClick \_ -> HandleEditClick
                            ]
                            [ HH.text "Edit" ]
                      , HH.button
                          [ css [raw "btn-secondary", cls Text_Sm, hover "bg-gray-50"]
                          , HE.onClick \_ -> HandleBackClick
                          ]
                          [ HH.text "Back to List" ]
                      ]
                  ]
              , if state.loading then
                  HH.div
                    [ css [thm theme TextSecondary] ]
                    [ HH.text "Loading tournament details..." ]
                else case state.error of
                  Just err ->
                    HH.div
                      [ css [cls TextRed600] ]
                      [ HH.text err ]
                  Nothing -> case state.tournament of
                    Just tournament -> renderTournamentDetails state.editing state.editForm theme tournament state.pollingDays
                    Nothing ->
                      HH.div
                        [ css [thm theme TextSecondary] ]
                        [ HH.text "Tournament not found" ]
              ]
          ]
      ]

renderTournamentDetails :: forall w. Boolean -> EditForm -> Theme -> TournamentSummary -> Int -> HH.HTML w Action
renderTournamentDetails editing editForm theme tournament pollingDays =
  let tournamentTheme = getTheme tournament.theme
  in HH.div
    [ css [cls Grid, raw "grid-cols-[auto_1fr]", cls Gap_X_4] ]
    (join
      [ -- Tournament metadata fields
        renderFieldOrInput editing theme "Name" tournament.name editForm.name Name
      , renderFieldOrInput editing theme "Long Form Name" tournament.longFormName editForm.longFormName LongFormName
      , renderFieldOrInput editing theme "City" tournament.city editForm.city City
      , renderFieldOrInput editing theme "Year" (show tournament.year) editForm.year Year
      , renderFieldOrInput editing theme "Lexicon" tournament.lexicon editForm.lexicon Lexicon
      , renderThemeSection editing theme tournamentTheme.name editForm.theme
      , renderFieldOrInput editing theme "Data URL" tournament.dataUrl editForm.dataUrl DataUrl
      -- Auto-Update controls
      , renderPollingSection theme tournament pollingDays
      -- Cache controls
      , renderControlSection theme "Cache"
          "Clear tournament cache across all browser tabs"
          [ HH.button
              [ css [cls BtnSecondary, cls Text_Sm, thm theme CardBackground, thm theme PrimaryBorder, thm theme HoverBackground]
              , HE.onClick \_ -> HandleClearCache
              ]
              [ HH.text "Clear Cache" ]
          ]
      -- CrossTables controls
      , renderControlSection theme "CrossTables"
          "Update player photos and data from CrossTables"
          [ HH.button
              [ css [cls BtnSecondary, cls Text_Sm, cls Mr_2, thm theme CardBackground, thm theme PrimaryBorder, thm theme HoverBackground]
              , HE.onClick \_ -> HandleRefetch
              ]
              [ HH.text "Refetch" ]
          , HH.button
              [ css [cls BtnSecondary, cls Text_Sm, thm theme CardBackground, thm theme PrimaryBorder, thm theme HoverBackground]
              , HE.onClick \_ -> HandleFullRefetch
              ]
              [ HH.text "Full Refetch" ]
          ]
      ]
    )

renderPollingSection :: forall w. Theme -> TournamentSummary -> Int -> Array (HH.HTML w Action)
renderPollingSection theme tournament pollingDays =
  [ HH.div
      [ css [cls FontMedium, cls Py_2, cls BorderT, thm theme TextSecondary, thm theme SecondaryBorder] ]
      [ HH.text "Auto-Update:" ]
  , HH.div
      [ css [cls Flex, cls ItemsCenter, cls JustifyBetween, cls Py_2, cls BorderT, thm theme SecondaryBorder] ]
      [ case tournament.pollUntil of
          Just dateStr ->
            -- Polling is active - show green text and Stop button
            HH.div
              [ css [cls Flex, cls ItemsCenter, cls Gap_4] ]
              [ HH.div
                  [ css [cls TextGreen600] ]
                  [ HH.text $ "Active until " <> formatDateString dateStr ]
              , HH.button
                  [ css [cls Px_3, cls Py_1, cls Text_Sm, cls BgRed_50, cls TextRed600, cls Rounded, hover "bg-red-100"]
                  , HE.onClick \_ -> HandleStopPolling
                  ]
                  [ HH.text "Stop" ]
              ]
          Nothing ->
            -- Polling is disabled - show input and Start button
            HH.div
              [ css [cls Flex, cls ItemsCenter, cls Gap_4] ]
              [ HH.input
                  [ HP.type_ HP.InputNumber
                  , HP.min 1.0
                  , HP.max 30.0
                  , HP.value $ show pollingDays
                  , css [cls W_16, cls Px_2, cls Py_1, cls Border, cls Rounded]
                  , HE.onValueInput (HandlePollingDaysChange)
                  ]
              , HH.span
                  [ css [cls TextGray600] ]
                  [ HH.text "days" ]
              , HH.button
                  [ css [cls Px_3, cls Py_1, cls Text_Sm, cls BgGreen_50, cls TextGreen600, cls Rounded, hover "bg-green-100"]
                  , HE.onClick \_ -> HandleStartPolling
                  ]
                  [ HH.text "Start" ]
              ]
      , HH.div [] []  -- Empty div for layout
      ]
  ]

renderControlSection :: forall w. Theme -> String -> String -> Array (HH.HTML w Action) -> Array (HH.HTML w Action)
renderControlSection theme label description buttons =
  [ HH.div
      [ css [cls FontMedium, cls Py_2, cls BorderT, thm theme TextSecondary, thm theme SecondaryBorder] ]
      [ HH.text $ label <> ":" ]
  , HH.div
      [ css [cls Flex, cls ItemsCenter, cls JustifyBetween, cls Py_2, cls BorderT, thm theme SecondaryBorder] ]
      [ HH.div
          [ css [thm theme TextPrimary] ]
          [ HH.text description ]
      , HH.div
          [ css [cls Flex, cls Gap_2] ]
          buttons
      ]
  ]

-- Format a date string to a readable string
formatDateString :: String -> String
formatDateString dateStr =
  let dateResult = unsafePerformEffect $ parse dateStr
  in toDateString dateResult

-- Update a field in the edit form
updateField :: Field -> String -> EditForm -> EditForm
updateField field value form = case field of
  Name -> form { name = value }
  LongFormName -> form { longFormName = value }
  City -> form { city = value }
  Year -> form { year = value }
  Lexicon -> form { lexicon = value }
  ThemeField -> form { theme = value }
  DataUrl -> form { dataUrl = value }

-- Render theme selection with cards showing previews
renderThemeSection :: forall w. Boolean -> Theme -> String -> String -> Array (HH.HTML w Action)
renderThemeSection editing currentTheme themeName selectedThemeId =
  [ HH.div
      [ css [cls FontMedium, cls Py_2, cls BorderT, raw currentTheme.colors.textSecondary, raw currentTheme.colors.secondaryBorder] ]
      [ HH.text "Overlay Theme:" ]
  , HH.div
      [ css [cls Py_2, cls BorderT, cls ColSpan_1, raw currentTheme.colors.secondaryBorder] ]
      [ if editing then
          ThemeSelector.renderThemeSelector selectedThemeId currentTheme (HandleFieldChange ThemeField)
        else
          HH.div
            [ css [raw currentTheme.colors.textPrimary] ]
            [ HH.text themeName ]
      ]
  ]

renderFieldOrInput :: forall w. Boolean -> Theme -> String -> String -> String -> Field -> Array (HH.HTML w Action)
renderFieldOrInput editing theme label value editValue field =
  [ HH.div
      [ css [cls FontMedium, cls Py_2, cls BorderT, thm theme TextSecondary, thm theme SecondaryBorder] ]
      [ HH.text $ label <> ":" ]
  , HH.div
      [ css [cls Py_2, cls BorderT, thm theme SecondaryBorder] ]
      [ if editing then
          HH.input
            [ css [cls W_Full, cls Px_2, cls Py_1, cls Border, cls Rounded, thm theme TextPrimary]
            , HP.type_ HP.InputText
            , HP.value editValue
            , HE.onValueInput (HandleFieldChange field)
            ]
        else
          HH.div
            [ css [thm theme TextPrimary] ]
            [ HH.text value ]
      ]
  ]

handleAction :: forall m. MonadBackend m => MonadEffect m => Action -> H.HalogenM State Action () Output m Unit
handleAction = case _ of
  Initialize -> do
    -- Get userId from localStorage
    userId <- liftEffect Auth.getUserId
    H.modify_ _ { userId = userId }
    handleAction LoadTournament

  LoadTournament ->
    handleLoadTournament

  HandleBackClick -> H.raise NavigateBack

  HandleEditClick ->
    handleEditClick

  HandleSaveClick ->
    handleSaveClick

  HandleCancelClick -> do
    H.modify_ _ { editing = false, editForm = emptyEditForm }

  HandleFieldChange field value -> do
    H.modify_ \s -> s { editForm = updateField field value s.editForm }

  HandlePollingDaysChange value -> do
    for_ (Int.fromString value) \days ->
      H.modify_ _ { pollingDays = days }

  HandleStartPolling ->
    handleStartPolling

  HandleStopPolling ->
    handleStopPolling

  HandleClearCache -> do
    liftEffect $ log "[TournamentDetailsPage] Clear cache clicked"
    withLoading clearCache \_ ->
      liftEffect $ log "[TournamentDetailsPage] Cache cleared successfully"

  HandleRefetch -> do
    liftEffect $ log "[TournamentDetailsPage] Refetch clicked"
    state <- H.get
    withLoading (refetchTournament (TournamentId state.tournamentId)) \message ->
      liftEffect $ log $ "[TournamentDetailsPage] Refetch successful: " <> message

  HandleFullRefetch -> do
    liftEffect $ log "[TournamentDetailsPage] Full refetch clicked"
    state <- H.get
    withLoading (fullRefetchTournament (TournamentId state.tournamentId)) \message ->
      liftEffect $ log $ "[TournamentDetailsPage] Full refetch successful: " <> message

-- | Populate edit form with current tournament data
handleEditClick :: forall output m. H.HalogenM State Action () output m Unit
handleEditClick = do
  state <- H.get
  for_ state.tournament \t -> do
    let editForm =
          { name: t.name
          , longFormName: t.longFormName
          , city: t.city
          , year: show t.year
          , lexicon: t.lexicon
          , theme: t.theme
          , dataUrl: t.dataUrl
          }
    H.modify_ _ { editing = true, editForm = editForm }

-- | Save tournament edits
handleSaveClick :: forall output m. MonadBackend m => MonadEffect m => H.HalogenM State Action () output m Unit
handleSaveClick = do
  state <- H.get
  liftEffect $ log "[TournamentDetailsPage] Save clicked"

  -- Parse year from string
  case Int.fromString state.editForm.year of
    Nothing -> do
      liftEffect $ log "[TournamentDetailsPage] Invalid year value"
      H.modify_ _ { error = Just "Year must be a valid number" }
    Just yearInt -> do
      let updateReq =
            { name: state.editForm.name
            , longFormName: state.editForm.longFormName
            , city: state.editForm.city
            , year: yearInt
            , lexicon: state.editForm.lexicon
            , theme: state.editForm.theme
            , dataUrl: state.editForm.dataUrl
            }

      withLoading (updateTournament (TournamentId state.tournamentId) updateReq) \tournament -> do
        liftEffect $ log $ "[TournamentDetailsPage] Tournament updated: " <> tournament.name
        H.modify_ _
          { editing = false
          , tournament = Just tournament
          , editForm = emptyEditForm
          }

-- | Load tournament with authentication check
handleLoadTournament :: forall m. MonadBackend m => MonadEffect m => H.HalogenM State Action () Output m Unit
handleLoadTournament = do
  state <- H.get
  maybe
    (H.modify_ _ { loading = false, error = Just "Not authenticated" })
    (\userId -> do
      liftEffect $ log $ "[TournamentDetailsPage] Loading tournament " <> show state.tournamentId <> " for user " <> show userId
      withLoading (getTournamentRow (UserId userId) (TournamentId state.tournamentId)) \tournament -> do
        liftEffect $ log $ "[TournamentDetailsPage] Loaded tournament: " <> tournament.name
        H.modify_ _ { tournament = Just tournament })
    state.userId

-- | Start polling and reload tournament
handleStartPolling :: forall m. MonadBackend m => MonadEffect m => H.HalogenM State Action () Output m Unit
handleStartPolling = do
  liftEffect $ log "[TournamentDetailsPage] Start polling clicked"
  state <- H.get
  withLoading (enablePolling (TournamentId state.tournamentId) state.pollingDays) \_ -> do
    liftEffect $ log "[TournamentDetailsPage] Polling started successfully"
    -- Reload tournament to get updated pollUntil
    handleAction LoadTournament

-- | Stop polling and reload tournament
handleStopPolling :: forall m. MonadBackend m => MonadEffect m => H.HalogenM State Action () Output m Unit
handleStopPolling = do
  liftEffect $ log "[TournamentDetailsPage] Stop polling clicked"
  state <- H.get
  withLoading (stopPolling (TournamentId state.tournamentId)) \_ -> do
    liftEffect $ log "[TournamentDetailsPage] Polling stopped successfully"
    -- Reload tournament to get updated pollUntil
    handleAction LoadTournament
