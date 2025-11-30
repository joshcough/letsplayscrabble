-- | Current Match Management Page
module Component.CurrentMatchPage where

import Prelude

import API.CurrentMatch as CurrentMatchAPI
import API.Tournament as TournamentAPI
import Config.Themes (getTheme)
import Data.Array (filter, find, head, fromFoldable, length, null, sort, sortBy)
import Data.Array as Array
import Data.Either (Either(..))
import Data.Int (fromString) as Int
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Set as Set
import Domain.Types (TournamentId(..), DivisionId(..), PlayerId(..), PairingId(..), TournamentSummary, Tournament, Division, Game, CreateCurrentMatch)
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Effect.Class.Console (log)
import Effect.Unsafe (unsafePerformEffect)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Types.Theme (Theme)
import Utils.Auth as Auth

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

component :: forall query m. MonadAff m => H.Component query Input Output m
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
    [ HP.class_ (HH.ClassName $ "min-h-screen p-8 " <> state.theme.colors.pageBackground) ]
    [ HH.div
        [ HP.class_ (HH.ClassName $ "max-w-4xl mx-auto " <> state.theme.colors.cardBackground <> " shadow-md rounded-lg p-6") ]
        [ HH.h1
            [ HP.class_ (HH.ClassName $ "text-2xl font-bold mb-6 " <> state.theme.colors.textPrimary) ]
            [ HH.text "Current Match Management" ]
        , case state.error of
            Just err ->
              HH.div
                [ HP.class_ (HH.ClassName "border-2 border-red-700/20 bg-red-700/10 text-red-700 px-4 py-3 rounded mb-4") ]
                [ HH.text err ]
            Nothing -> HH.text ""
        , case state.success of
            Just msg ->
              HH.div
                [ HP.class_ (HH.ClassName "border-2 border-green-700/20 bg-green-700/10 text-green-700 px-4 py-3 rounded mb-4") ]
                [ HH.text msg ]
            Nothing -> HH.text ""
        , if state.loading && Array.null state.tournaments then
            HH.div
              [ HP.class_ (HH.ClassName "text-center py-8") ]
              [ HH.text "Loading..." ]
          else
            HH.div
              [ HP.class_ (HH.ClassName "space-y-6") ]
              [ renderTournamentSelect state
              , renderDivisionSelect state
              , renderRoundSelect state
              , renderPairingSelect state
              , HH.button
                  [ HP.class_ (HH.ClassName $ "w-full py-2 px-4 rounded-md " <> buttonClass state)
                  , HP.disabled (state.loading || state.selectedPairingId == Nothing)
                  , HE.onClick \_ -> UpdateMatch
                  ]
                  [ HH.text if state.loading then "Updating..." else "Update Match" ]
              , HH.button
                  [ HP.class_ (HH.ClassName "w-full py-2 px-4 border rounded-md hover:bg-gray-50")
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
        else state.theme.colors.cardBackground <> " " <> state.theme.colors.hoverBackground <> " border-2 " <> state.theme.colors.primaryBorder

renderTournamentSelect :: forall w. State -> HH.HTML w Action
renderTournamentSelect state =
  HH.div []
    [ HH.label
        [ HP.class_ (HH.ClassName $ "block font-medium mb-2 " <> state.theme.colors.textPrimary) ]
        [ HH.text $ "Tournament (" <> show (Array.length state.tournaments) <> " available)" ]
    , HH.select
        [ HP.class_ (HH.ClassName $ "w-full p-2 border-2 rounded " <> state.theme.colors.secondaryBorder)
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
        [ HP.class_ (HH.ClassName $ "block font-medium mb-2 " <> state.theme.colors.textPrimary) ]
        [ HH.text $ "Division (" <> show (Array.length divisions) <> " available)" ]
    , HH.select
        [ HP.class_ (HH.ClassName $ "w-full p-2 border-2 rounded " <> state.theme.colors.secondaryBorder)
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
        [ HP.class_ (HH.ClassName $ "block font-medium mb-2 " <> state.theme.colors.textPrimary) ]
        [ HH.text $ "Round (" <> show (Array.length rounds) <> " available)" ]
    , HH.select
        [ HP.class_ (HH.ClassName $ "w-full p-2 border-2 rounded " <> state.theme.colors.secondaryBorder)
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
        [ HP.class_ (HH.ClassName $ "block font-medium mb-2 " <> state.theme.colors.textPrimary) ]
        [ HH.text $ "Pairing (" <> show (Array.length pairings) <> " available)" ]
    , HH.select
        [ HP.class_ (HH.ClassName $ "w-full p-2 border-2 rounded " <> state.theme.colors.secondaryBorder)
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
    division <- find (\d -> let DivisionId did = d.id in did == divId) tournament.divisions
    let roundNumbers = map _.roundNumber division.games
    pure $ sort $ Array.fromFoldable $ Set.fromFoldable roundNumbers

getPairingsForRound :: State -> Array Game
getPairingsForRound state =
  fromMaybe [] do
    tournament <- state.selectedTournament
    divId <- Int.fromString state.selectedDivisionId
    division <- find (\d -> let DivisionId did = d.id in did == divId) tournament.divisions
    roundNum <- Int.fromString state.selectedRound
    pure $ Array.filter (\g -> g.roundNumber == roundNum) division.games

getPlayerName :: State -> Int -> String
getPlayerName state playerId =
  fromMaybe "Unknown" do
    tournament <- state.selectedTournament
    divId <- Int.fromString state.selectedDivisionId
    division <- find (\d -> let DivisionId did = d.id in did == divId) tournament.divisions
    player <- find (\p -> let PlayerId pid = p.id in pid == playerId) division.players
    pure player.name

handleAction :: forall m. MonadAff m => Action -> H.HalogenM State Action () Output m Unit
handleAction = case _ of
  Initialize -> do
    userId <- liftEffect Auth.getUserId
    H.modify_ _ { userId = userId }
    handleAction LoadTournaments

  LoadTournaments -> do
    H.modify_ _ { loading = true, error = Nothing }
    result <- H.liftAff TournamentAPI.listTournaments
    case result of
      Left err -> H.modify_ _ { error = Just err, loading = false }
      Right tournaments -> do
        H.modify_ _ { tournaments = tournaments, loading = false }
        -- Load current match and auto-select
        state <- H.get
        case state.userId of
          Nothing -> pure unit
          Just uid -> do
            matchResult <- H.liftAff $ CurrentMatchAPI.getCurrentMatch uid
            case matchResult of
              Left _ -> pure unit
              Right Nothing -> pure unit
              Right (Just match) -> do
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

  SelectTournament tidStr -> do
    state <- H.get
    -- Only clear selections if we don't already have them set (e.g., from loading current match)
    let preserveSelections = state.selectedTournamentId == tidStr && state.selectedDivisionId /= ""
    liftEffect $ log $ "[SelectTournament] tidStr=" <> tidStr <> " preserveSelections=" <> show preserveSelections <> " currentDivId=" <> state.selectedDivisionId
    when (not preserveSelections) $
      H.modify_ _ { selectedTournamentId = tidStr, selectedDivisionId = "", selectedRound = "", selectedPairingId = Nothing }
    H.modify_ _ { selectedTournamentId = tidStr, loading = true }
    case Int.fromString tidStr of
      Nothing -> H.modify_ _ { loading = false }
      Just tid -> do
        currentState <- H.get
        case currentState.userId of
          Nothing -> H.modify_ _ { loading = false }
          Just uid -> do
            result <- H.liftAff $ CurrentMatchAPI.getTournament uid tid
            case result of
              Left err -> H.modify_ _ { error = Just err, loading = false }
              Right tournament -> do
                H.modify_ _ { selectedTournament = Just tournament, loading = false }
                finalState <- H.get
                liftEffect $ log $ "[SelectTournament] After loading tournament: selectedDivId=" <> finalState.selectedDivisionId <> " selectedRound=" <> finalState.selectedRound <> " selectedPairingId=" <> show finalState.selectedPairingId
                -- Only auto-select if we don't have selections already
                when (not preserveSelections) $ do
                  case head tournament.divisions of
                    Nothing -> pure unit
                    Just division -> do
                      let DivisionId did = division.id
                      handleAction $ SelectDivision (show did)

  SelectDivision didStr -> do
    H.modify_ _ { selectedDivisionId = didStr, selectedRound = "", selectedPairingId = Nothing }
    state <- H.get
    let rounds = getRoundsForDivision state
    case head rounds of
      Nothing -> pure unit
      Just r -> handleAction $ SelectRound (show r)

  SelectRound roundStr -> do
    H.modify_ _ { selectedRound = roundStr, selectedPairingId = Nothing }
    state <- H.get
    let pairings = getPairingsForRound state
    case head pairings of
      Nothing -> pure unit
      Just game -> do
        let maybePid = game.pairingId
        case maybePid of
          Nothing -> pure unit
          Just (PairingId pid) -> H.modify_ _ { selectedPairingId = Just pid }

  SelectPairing pidStr -> do
    case Int.fromString pidStr of
      Nothing -> H.modify_ _ { selectedPairingId = Nothing }
      Just pid -> H.modify_ _ { selectedPairingId = Just pid }

  UpdateMatch -> do
    state <- H.get
    case state.userId, Int.fromString state.selectedTournamentId, Int.fromString state.selectedDivisionId, Int.fromString state.selectedRound, state.selectedPairingId of
      Just uid, Just tid, Just did, Just round, Just pid -> do
        H.modify_ _ { loading = true, error = Nothing, success = Nothing }
        let request = { tournamentId: TournamentId tid, divisionId: DivisionId did, round, pairingId: PairingId pid }
        result <- H.liftAff $ CurrentMatchAPI.setCurrentMatch request
        case result of
          Left err -> H.modify_ _ { error = Just err, loading = false }
          Right match -> H.modify_ _ { success = Just "Match updated successfully!", loading = false }
      _, _, _, _, _ -> H.modify_ _ { error = Just "Please select all fields" }

  HandleBackClick -> H.raise NavigateBack
