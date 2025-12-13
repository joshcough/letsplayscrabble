-- | Current Match Management Page
module Component.CurrentMatchPage where

import Prelude

import CSS.Class as C
import CSS.Class (CSSClass(..))
import CSS.ThemeColor (ThemeColor(..))

import Backend.MonadBackend (class MonadBackend, getCurrentMatch, getTournament, listTournaments, setCurrentMatch)
import Component.CurrentMatchPageHelpers as Helpers
import Config.Themes (getTheme)
import Control.Monad.Error.Class (try)
import Data.Array (find, head, sortBy)
import Data.Array as Array
import Data.Either (hush)
import Data.Foldable (for_)
import Data.Int (fromString) as Int
import Data.Maybe (Maybe(..), fromMaybe)
import Domain.Types (TournamentId(..), DivisionId(..), PlayerId(..), PairingId(..), TournamentSummary, Tournament, Game, UserId(..))
import Effect.Class (class MonadEffect, liftEffect)
import Effect.Class.Console (log)
import Effect.Unsafe (unsafePerformEffect)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Utils.CSS (classes, cls, css, hover, thm, raw)
import Utils.Auth as Auth
import Utils.Halogen (withLoading)

type Input = Unit

type State =
  { userId :: Maybe Int
  , theme :: Theme
  , tournaments :: Array TournamentSummary
  , selectedTournament :: Maybe Tournament
  , selectedTournamentId :: String
  , selectedDivisionId :: String
  , selectedRound :: String
  , selectedPairingId :: Maybe Int
  , loading :: Boolean
  , error :: Maybe String
  , success :: Maybe String
  }

data Action
  = Initialize
  | LoadTournaments
  | SelectTournament String
  | SelectDivision String
  | SelectRound String
  | SelectPairing String
  | UpdateMatch
  | HandleBackClick

data Output
  = NavigateBack

component :: forall query m. MonadBackend m => MonadEffect m => H.Component query Input Output m
component = H.mkComponent
  { initialState
  , render
  , eval: H.mkEval H.defaultEval
      { handleAction = handleAction
      , initialize = Just Initialize
      }
  }

initialState :: Input -> State
initialState _ =
  { userId: Nothing
  , theme: getTheme "scrabble"
  , tournaments: []
  , selectedTournament: Nothing
  , selectedTournamentId: ""
  , selectedDivisionId: ""
  , selectedRound: ""
  , selectedPairingId: Nothing
  , loading: true
  , error: Nothing
  , success: Nothing
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  HH.div
    [ css [cls MinHScreen, cls P_8, thm state.theme PageBackground] ]
    [ HH.div
        [ css [cls MaxW_4xl, cls Mx_Auto, thm state.theme CardBackground, cls ShadowMd, cls C.RoundedLg, cls P_6] ]
        [ HH.h1
            [ css [cls PageTitle, cls Mb_6, thm state.theme TextPrimary] ]
            [ HH.text "Current Match Management" ]
        , case state.error of
            Just err ->
              HH.div
                [ css [cls C.Border_2, raw "border-red-700/20 bg-red-700/10", cls C.TextRed700, cls C.Px_4, cls C.Py_3, cls C.Rounded, cls C.Mb_4] ]
                [ HH.text err ]
            Nothing -> HH.text ""
        , case state.success of
            Just msg ->
              HH.div
                [ css [cls C.Border_2, raw "border-green-700/20 bg-green-700/10", cls C.TextGreen700, cls C.Px_4, cls C.Py_3, cls C.Rounded, cls C.Mb_4] ]
                [ HH.text msg ]
            Nothing -> HH.text ""
        , if state.loading && Array.null state.tournaments then
            HH.div
              [ css [cls C.TextCenter, cls Py_8] ]
              [ HH.text "Loading..." ]
          else
            HH.div
              [ css [cls SpaceY_6] ]
              [ renderTournamentSelect state
              , renderDivisionSelect state
              , renderRoundSelect state
              , renderPairingSelect state
              , HH.button
                  [ css [cls C.W_Full, cls C.Py_2, cls C.Px_4, cls C.RoundedMd, raw (buttonClass state)]
                  , HP.disabled (state.loading || state.selectedPairingId == Nothing)
                  , HE.onClick \_ -> UpdateMatch
                  ]
                  [ HH.text if state.loading then "Updating..." else "Update Match" ]
              , HH.button
                  [ css [cls C.W_Full, cls C.Px_4, cls C.Py_2, cls C.Border, cls C.Rounded, cls C.FocusOutlineNone, cls C.FocusRing_2, cls C.TransitionColors, hover "bg-gray-50"]
                  , HE.onClick \_ -> HandleBackClick
                  ]
                  [ HH.text "Back to List" ]
              ]
        ]
    ]
  where
    buttonClass s =
      if s.loading || s.selectedPairingId == Nothing
        then "opacity-50 cursor-not-allowed bg-gray-300"
        else classes [thm state.theme CardBackground, thm state.theme HoverBackground, cls C.Border_2, thm state.theme PrimaryBorder]

renderTournamentSelect :: forall w. State -> HH.HTML w Action
renderTournamentSelect state =
  HH.div []
    [ HH.label
        [ css [cls FormLabel, thm state.theme TextPrimary] ]
        [ HH.text $ "Tournament (" <> show (Array.length state.tournaments) <> " available)" ]
    , HH.select
        [ css [cls FormInput, thm state.theme SecondaryBorder]
        , HP.value state.selectedTournamentId
        , HE.onValueChange SelectTournament
        , HP.disabled state.loading
        ]
        ([ HH.option [ HP.value "" ] [ HH.text "Select Tournament" ] ] <>
         map tournamentOption (sortBy (\a b -> compare a.name b.name) state.tournaments))
    ]
  where
    tournamentOption t =
      let TournamentId tid = t.id
          isSelected = show tid == state.selectedTournamentId
      in HH.option
          [ HP.value (show tid)
          , HP.selected isSelected
          ]
          [ HH.text t.longFormName ]

renderDivisionSelect :: forall w. State -> HH.HTML w Action
renderDivisionSelect state =
  let divisions = fromMaybe [] (map _.divisions state.selectedTournament)
      _ = unsafePerformEffect $ log $ "[renderDivisionSelect] divisions count=" <> show (Array.length divisions) <> " selectedDivisionId=" <> state.selectedDivisionId
  in HH.div []
    [ HH.label
        [ css [cls FormLabel, thm state.theme TextPrimary] ]
        [ HH.text $ "Division (" <> show (Array.length divisions) <> " available)" ]
    , HH.select
        [ css [cls FormInput, thm state.theme SecondaryBorder]
        , HP.value state.selectedDivisionId
        , HE.onValueChange SelectDivision
        , HP.disabled (state.selectedTournamentId == "" || state.loading)
        ]
        ([ HH.option [ HP.value "" ] [ HH.text "Select Division" ] ] <>
         map divisionOption divisions)
    ]
  where
    divisionOption d =
      let DivisionId did = d.id
          isSelected = show did == state.selectedDivisionId
      in HH.option
          [ HP.value (show did)
          , HP.selected isSelected
          ]
          [ HH.text d.name ]

renderRoundSelect :: forall w. State -> HH.HTML w Action
renderRoundSelect state =
  let rounds = getRoundsForDivision state
      _ = unsafePerformEffect $ log $ "[renderRoundSelect] rounds count=" <> show (Array.length rounds) <> " selectedRound=" <> state.selectedRound
  in HH.div []
    [ HH.label
        [ css [cls FormLabel, thm state.theme TextPrimary] ]
        [ HH.text $ "Round (" <> show (Array.length rounds) <> " available)" ]
    , HH.select
        [ css [cls FormInput, thm state.theme SecondaryBorder]
        , HP.value state.selectedRound
        , HE.onValueChange SelectRound
        , HP.disabled (state.selectedDivisionId == "" || state.loading)
        ]
        ([ HH.option [ HP.value "" ] [ HH.text "Select Round" ] ] <>
         map roundOption rounds)
    ]
  where
    roundOption r =
      let isSelected = show r == state.selectedRound
      in HH.option
          [ HP.value (show r)
          , HP.selected isSelected
          ]
          [ HH.text $ "Round " <> show r ]

renderPairingSelect :: forall w. State -> HH.HTML w Action
renderPairingSelect state =
  let pairings = getPairingsForRound state
      _ = unsafePerformEffect $ log $ "[renderPairingSelect] pairings count=" <> show (Array.length pairings) <> " selectedPairingId=" <> show state.selectedPairingId
  in HH.div []
    [ HH.label
        [ css [cls FormLabel, thm state.theme TextPrimary] ]
        [ HH.text $ "Pairing (" <> show (Array.length pairings) <> " available)" ]
    , HH.select
        [ css [cls FormInput, thm state.theme SecondaryBorder]
        , HP.value (fromMaybe "" (map show state.selectedPairingId))
        , HE.onValueChange SelectPairing
        , HP.disabled (state.selectedRound == "" || state.loading)
        ]
        ([ HH.option [ HP.value "" ] [ HH.text "Select Pairing" ] ] <>
         map (pairingOption state) pairings)
    ]
  where
    pairingOption s game =
      let PairingId pid = fromMaybe (PairingId 0) game.pairingId
          PlayerId p1id = game.player1Id
          PlayerId p2id = game.player2Id
          player1Name = getPlayerName s p1id
          player2Name = if game.isBye then "BYE" else getPlayerName s p2id
          isSelected = case s.selectedPairingId of
            Just selectedPid -> pid == selectedPid
            Nothing -> false
      in HH.option
          [ HP.value (show pid)
          , HP.selected isSelected
          ]
          [ HH.text $ player1Name <> " vs " <> player2Name ]

-- Helper functions

getRoundsForDivision :: State -> Array Int
getRoundsForDivision state =
  fromMaybe [] do
    tournament <- state.selectedTournament
    divId <- Int.fromString state.selectedDivisionId
    Helpers.getRoundsForDivision tournament divId

getPairingsForRound :: State -> Array Game
getPairingsForRound state =
  fromMaybe [] do
    tournament <- state.selectedTournament
    divId <- Int.fromString state.selectedDivisionId
    division <- find (\d -> let DivisionId did = d.id in did == divId) tournament.divisions
    roundNum <- Int.fromString state.selectedRound
    pure $ Helpers.getPairingsForRound division roundNum

getPlayerName :: State -> Int -> String
getPlayerName state playerId =
  fromMaybe "Unknown" do
    tournament <- state.selectedTournament
    divId <- Int.fromString state.selectedDivisionId
    division <- find (\d -> let DivisionId did = d.id in did == divId) tournament.divisions
    Helpers.getPlayerName division.players playerId

handleAction :: forall m. MonadBackend m => MonadEffect m => Action -> H.HalogenM State Action () Output m Unit
handleAction = case _ of
  Initialize -> do
    userId <- liftEffect Auth.getUserId
    H.modify_ _ { userId = userId }
    handleAction LoadTournaments

  LoadTournaments ->
    withLoading listTournaments handleTournamentsLoaded

  SelectTournament tidStr ->
    handleSelectTournament tidStr

  SelectDivision didStr -> do
    H.modify_ _ { selectedDivisionId = didStr, selectedRound = "", selectedPairingId = Nothing }
    state <- H.get
    let rounds = getRoundsForDivision state
    for_ (head rounds) \r -> handleAction $ SelectRound (show r)

  SelectRound roundStr -> do
    H.modify_ _ { selectedRound = roundStr, selectedPairingId = Nothing }
    state <- H.get
    let pairings = getPairingsForRound state
    for_ (head pairings) \game ->
      for_ game.pairingId \(PairingId pid) ->
        H.modify_ _ { selectedPairingId = Just pid }

  SelectPairing pidStr ->
    H.modify_ _ { selectedPairingId = Int.fromString pidStr }

  UpdateMatch ->
    handleUpdateMatch

  HandleBackClick -> H.raise NavigateBack

-- | Handle tournaments loaded - auto-select current match if available
handleTournamentsLoaded :: forall m. MonadBackend m => MonadEffect m => Array TournamentSummary -> H.HalogenM State Action () Output m Unit
handleTournamentsLoaded tournaments = do
  H.modify_ _ { tournaments = tournaments }
  -- Load current match and auto-select
  state <- H.get
  for_ state.userId \uid -> do
    result <- H.lift $ try $ getCurrentMatch (UserId uid)
    for_ (join $ hush result) \match -> do
      let TournamentId tid = match.tournamentId
          DivisionId did = match.divisionId
          PairingId pid = match.pairingId
      liftEffect $ log $ "[CurrentMatch] Loaded current match: tid=" <> show tid <> " did=" <> show did <> " round=" <> show match.round <> " pid=" <> show pid
      -- Store the current match data in state before loading tournament
      H.modify_ _
        { selectedTournamentId = show tid
        , selectedDivisionId = show did
        , selectedRound = show match.round
        , selectedPairingId = Just pid
        }
      -- Now load the tournament data
      handleAction $ SelectTournament (show tid)

-- | Handle tournament selection with auto-selection of first division
handleSelectTournament :: forall m. MonadBackend m => MonadEffect m => String -> H.HalogenM State Action () Output m Unit
handleSelectTournament tidStr = do
  state <- H.get
  -- Only clear selections if we don't already have them set (e.g., from loading current match)
  let preserveSelections = state.selectedTournamentId == tidStr && state.selectedDivisionId /= ""
  liftEffect $ log $ "[SelectTournament] tidStr=" <> tidStr <> " preserveSelections=" <> show preserveSelections <> " currentDivId=" <> state.selectedDivisionId
  when (not preserveSelections) $
    H.modify_ _ { selectedTournamentId = tidStr, selectedDivisionId = "", selectedRound = "", selectedPairingId = Nothing }
  H.modify_ _ { selectedTournamentId = tidStr }
  for_ (Int.fromString tidStr) \tid -> do
    currentState <- H.get
    for_ currentState.userId \uid ->
      withLoading (getTournament (UserId uid) (TournamentId tid)) \tournament -> do
        H.modify_ _ { selectedTournament = Just tournament }
        finalState <- H.get
        liftEffect $ log $ "[SelectTournament] After loading tournament: selectedDivId=" <> finalState.selectedDivisionId <> " selectedRound=" <> finalState.selectedRound <> " selectedPairingId=" <> show finalState.selectedPairingId
        -- Only auto-select if we don't have selections already
        when (not preserveSelections) $
          for_ (head tournament.divisions) \division -> do
            let DivisionId did = division.id
            handleAction $ SelectDivision (show did)

-- | Update current match selection
handleUpdateMatch :: forall m. MonadBackend m => H.HalogenM State Action () Output m Unit
handleUpdateMatch = do
  state <- H.get
  case state.userId, Int.fromString state.selectedTournamentId, Int.fromString state.selectedDivisionId, Int.fromString state.selectedRound, state.selectedPairingId of
    Just _, Just tid, Just did, Just round, Just pid -> do
      H.modify_ _ { success = Nothing }
      let request = { tournamentId: TournamentId tid, divisionId: DivisionId did, round, pairingId: PairingId pid }
      withLoading (setCurrentMatch request) \_ ->
        H.modify_ _ { success = Just "Match updated successfully!" }
    _, _, _, _, _ -> H.modify_ _ { error = Just "Please select all fields" }
