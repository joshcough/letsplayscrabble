-- | Main router component that handles navigation
module Component.Router where

import Prelude

import CSS.Class (CSSClass(..))
import Component.HomePage as HomePage
import Component.LoginPage as LoginPage
import Component.Navigation as Navigation
import Component.OverlaysPage as OverlaysPage
import Component.TournamentManagerPage as TournamentManagerPage
import Component.AddTournament as AddTournament
import Component.TournamentDetailsPage as TournamentDetailsPage
import Component.CurrentMatchPage as CurrentMatchPage
import Utils.Auth as Auth
import Component.Overlay.Standings as Standings
import Component.Overlay.StandingsWithPics as StandingsWithPics
import Component.Overlay.HighScores as HighScores
import Component.Overlay.HighScoresWithPics as HighScoresWithPics
import Component.Overlay.RatingGain as RatingGain
import Component.Overlay.RatingGainWithPics as RatingGainWithPics
import Component.Overlay.ScoringLeaders as ScoringLeaders
import Component.Overlay.ScoringLeadersWithPics as ScoringLeadersWithPics
import Component.Overlay.CrossTablesPlayerProfile as CrossTablesPlayerProfile
import Component.Overlay.HeadToHead as HeadToHead
import Component.Overlay.MiscOverlay as MiscOverlay
import Component.MiscOverlayTestingPage as MiscOverlayTestingPage
import Component.Overlay.TournamentStats as TournamentStats
import Component.WorkerPage as WorkerPage
import BroadcastChannel.Manager as BroadcastManager
import BroadcastChannel.MonadBroadcast (class MonadBroadcast)
import BroadcastChannel.MonadEmitters (class MonadEmitters)
import Data.Either (Either(..))
import Effect.Unsafe (unsafePerformEffect)
import Data.Maybe (Maybe(..), fromMaybe)
import Domain.Types (TournamentId(..))
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Effect.Class.Console (log)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Route (Route(..), routeCodec)
import Routing.Duplex (parse, print)
import Routing.Hash (getHash, setHash)
import Type.Proxy (Proxy(..))

-- | Router state
type State =
  { route :: Maybe Route
  , isAuthenticated :: Boolean
  , username :: Maybe String
  , userId :: Maybe Int
  , broadcastManager :: Maybe BroadcastManager.BroadcastManager
  }

-- | Router queries
data Query a
  = Navigate Route a

-- | Router actions
data Action
  = Initialize
  | NavigateAction Route
  | HandleHomeOutput HomePage.Output
  | HandleOverlaysOutput Route
  | HandleLoginSuccess LoginOutput
  | HandleNavigationOutput Navigation.Output
  | HandleTournamentDetailsOutput TournamentDetailsPage.Output
  | HandleTournamentManagerOutput TournamentManagerPage.Output
  | HandleCurrentMatchOutput CurrentMatchPage.Output

-- | Login output type
type LoginOutput =
  { token :: String
  , userId :: Int
  , username :: String
  }

-- | Child slots
type Slots =
  ( home :: forall query. H.Slot query HomePage.Output Unit
  , login :: forall query. H.Slot query LoginOutput Unit
  , navigation :: forall query. H.Slot query Navigation.Output Unit
  , overlays :: forall query. H.Slot query Route Unit
  , tournamentManager :: forall query. H.Slot query TournamentManagerPage.Output Unit
  , addTournament :: forall query. H.Slot query Void Unit
  , tournamentDetails :: forall query. H.Slot query TournamentDetailsPage.Output Unit
  , currentMatch :: forall query. H.Slot query CurrentMatchPage.Output Unit
  , standings :: forall query. H.Slot query Void Unit
  , standingsWithPics :: forall query. H.Slot query Void Unit
  , highScores :: forall query. H.Slot query Void Unit
  , highScoresWithPics :: forall query. H.Slot query Void Unit
  , ratingGain :: forall query. H.Slot query Void Unit
  , ratingGainWithPics :: forall query. H.Slot query Void Unit
  , scoringLeaders :: forall query. H.Slot query Void Unit
  , scoringLeadersWithPics :: forall query. H.Slot query Void Unit
  , crossTablesPlayerProfile :: forall query. H.Slot query Void Unit
  , headToHead :: forall query. H.Slot query Void Unit
  , miscOverlay :: forall query. H.Slot query Void Unit
  , miscOverlayTesting :: forall query. H.Slot query Void Unit
  , tournamentStats :: forall query. H.Slot query Void Unit
  , worker :: forall query. H.Slot query Void Unit
  )

_home = Proxy :: Proxy "home"
_login = Proxy :: Proxy "login"
_navigation = Proxy :: Proxy "navigation"
_overlays = Proxy :: Proxy "overlays"
_tournamentManager = Proxy :: Proxy "tournamentManager"
_addTournament = Proxy :: Proxy "addTournament"
_tournamentDetails = Proxy :: Proxy "tournamentDetails"
_currentMatch = Proxy :: Proxy "currentMatch"
_standings = Proxy :: Proxy "standings"
_standingsWithPics = Proxy :: Proxy "standingsWithPics"
_highScores = Proxy :: Proxy "highScores"
_highScoresWithPics = Proxy :: Proxy "highScoresWithPics"
_ratingGain = Proxy :: Proxy "ratingGain"
_ratingGainWithPics = Proxy :: Proxy "ratingGainWithPics"
_scoringLeaders = Proxy :: Proxy "scoringLeaders"
_scoringLeadersWithPics = Proxy :: Proxy "scoringLeadersWithPics"
_crossTablesPlayerProfile = Proxy :: Proxy "crossTablesPlayerProfile"
_headToHead = Proxy :: Proxy "headToHead"
_miscOverlay = Proxy :: Proxy "miscOverlay"
_miscOverlayTesting = Proxy :: Proxy "miscOverlayTesting"
_tournamentStats = Proxy :: Proxy "tournamentStats"
_worker = Proxy :: Proxy "worker"

-- | Check if a route requires authentication
requiresAuth :: Route -> Boolean
requiresAuth = case _ of
  Home -> false
  Login -> false
  Worker -> false
  CrossTablesPlayerProfile _ -> false
  HeadToHead _ -> false
  MiscOverlay _ -> false
  TournamentStats _ -> false
  MiscOverlayTesting -> false
  _ -> true

-- | Helper to determine route based on authentication and whether route requires auth
routeWithAuth :: Boolean -> Route -> Route
routeWithAuth isAuth route =
  if requiresAuth route && not isAuth
    then Login
    else route

-- | Wrap content with navigation if user is authenticated
withNavigation :: forall m. MonadAff m => State -> H.ComponentHTML Action Slots m -> H.ComponentHTML Action Slots m
withNavigation state content =
  case state.username, state.userId of
    Just username, Just userId ->
      HH.div_
        [ HH.slot _navigation unit Navigation.component { username, userId, currentRoute: state.route } HandleNavigationOutput
        , content
        ]
    _, _ -> content

-- | Router component
component :: forall input output m. MonadAff m => MonadBroadcast m => MonadEmitters m => H.Component Query input output m
component = H.mkComponent
  { initialState: \_ -> { route: Nothing, isAuthenticated: false, username: Nothing, userId: Nothing, broadcastManager: Nothing }
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = handleAction
      , handleQuery = handleQuery
      , initialize = Just Initialize
      }
  }

render :: forall m. MonadAff m => MonadBroadcast m => MonadEmitters m => State -> H.ComponentHTML Action Slots m
render state =
  let _ = unsafePerformEffect $ log $ "[Router] Rendering route: " <> show state.route
  in case state.route of
    Nothing ->
      HH.div
        [ HP.class_ (HH.ClassName $ show CenterContainer) ]
        [ HH.text "Loading..." ]

    Just Home ->
      withNavigation state $
        HH.slot _home unit HomePage.component unit HandleHomeOutput

    Just Login ->
      HH.slot _login unit LoginPage.component unit HandleLoginSuccess

    Just Overlays ->
      withNavigation state $
        HH.slot _overlays unit OverlaysPage.component unit HandleOverlaysOutput

    Just TournamentManager ->
      withNavigation state $
        HH.slot _tournamentManager unit TournamentManagerPage.component unit HandleTournamentManagerOutput

    Just AddTournament ->
      withNavigation state $
        HH.slot_ _addTournament unit AddTournament.component unit

    Just (TournamentDetail tournamentId) ->
      withNavigation state $
        HH.slot _tournamentDetails unit TournamentDetailsPage.component { tournamentId } HandleTournamentDetailsOutput

    Just CurrentMatch ->
      withNavigation state $
        HH.slot _currentMatch unit CurrentMatchPage.component unit HandleCurrentMatchOutput

    Just (Standings params) ->
      case state.broadcastManager of
        Nothing -> HH.text "Initializing broadcast manager..."
        Just _ ->
          case params.pics of
            Just true ->
              HH.slot_ _standingsWithPics unit StandingsWithPics.component
                { userId: params.userId
                , tournamentId: map TournamentId params.tournamentId
                , divisionName: params.divisionName
                , extra: unit
                }
            _ ->
              HH.slot_ _standings unit Standings.component
                { userId: params.userId
                , tournamentId: map TournamentId params.tournamentId
                , divisionName: params.divisionName
                , extra: unit
                }

    Just (HighScores params) ->
      case state.broadcastManager of
        Nothing -> HH.text "Initializing broadcast manager..."
        Just _ ->
          case params.pics of
            Just true ->
              HH.slot_ _highScoresWithPics unit HighScoresWithPics.component
                { userId: params.userId
                , tournamentId: map TournamentId params.tournamentId
                , divisionName: params.divisionName
                , extra: unit
                }
            _ ->
              HH.slot_ _highScores unit HighScores.component
                { userId: params.userId
                , tournamentId: map TournamentId params.tournamentId
                , divisionName: params.divisionName
                , extra: unit
                }

    Just (RatingGain params) ->
      case state.broadcastManager of
        Nothing -> HH.text "Initializing broadcast manager..."
        Just _ ->
          case params.pics of
            Just true ->
              HH.slot_ _ratingGainWithPics unit RatingGainWithPics.component
                { userId: params.userId
                , tournamentId: map TournamentId params.tournamentId
                , divisionName: params.divisionName
                , extra: unit
                }
            _ ->
              HH.slot_ _ratingGain unit RatingGain.component
                { userId: params.userId
                , tournamentId: map TournamentId params.tournamentId
                , divisionName: params.divisionName
                , extra: unit
                }

    Just (ScoringLeaders params) ->
      case state.broadcastManager of
        Nothing -> HH.text "Initializing broadcast manager..."
        Just _ ->
          case params.pics of
            Just true ->
              HH.slot_ _scoringLeadersWithPics unit ScoringLeadersWithPics.component
                { userId: params.userId
                , tournamentId: map TournamentId params.tournamentId
                , divisionName: params.divisionName
                , extra: unit
                }
            _ ->
              HH.slot_ _scoringLeaders unit ScoringLeaders.component
                { userId: params.userId
                , tournamentId: map TournamentId params.tournamentId
                , divisionName: params.divisionName
                , extra: unit
                }

    Just (CrossTablesPlayerProfile params) ->
      case state.broadcastManager of
        Nothing -> HH.text "Initializing broadcast manager..."
        Just _ ->
          HH.slot_ _crossTablesPlayerProfile unit CrossTablesPlayerProfile.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            , extra: params.playerId
            }

    Just (HeadToHead params) ->
      case state.broadcastManager of
        Nothing -> HH.text "Initializing broadcast manager..."
        Just _ ->
          HH.slot_ _headToHead unit HeadToHead.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            , extra: { playerId1: fromMaybe 0 params.playerId1, playerId2: fromMaybe 0 params.playerId2 }
            }

    Just (MiscOverlay params) ->
      case state.broadcastManager of
        Nothing -> HH.text "Initializing broadcast manager..."
        Just _ ->
          HH.slot_ _miscOverlay unit MiscOverlay.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            , extra: MiscOverlay.parseSource params.source
            }

    Just (TournamentStats params) ->
      case state.broadcastManager of
        Nothing -> HH.text "Initializing broadcast manager..."
        Just _ ->
          HH.slot_ _tournamentStats unit TournamentStats.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            }

    Just MiscOverlayTesting ->
      HH.slot_ _miscOverlayTesting unit MiscOverlayTestingPage.component unit

    Just Worker ->
      HH.slot_ _worker unit WorkerPage.component unit

handleAction :: forall output m. MonadAff m => Action -> H.HalogenM State Action Slots output m Unit
handleAction = case _ of
  Initialize -> do
    liftEffect $ log "[Router] Initializing..."

    -- Create broadcast manager for overlay components
    manager <- liftEffect BroadcastManager.create
    liftEffect $ log "[Router] Created broadcast manager"

    -- Check if user is authenticated
    isAuth <- liftEffect Auth.isAuthenticated
    liftEffect $ log $ "[Router] Is authenticated: " <> show isAuth

    -- Load user data from localStorage
    username <- liftEffect Auth.getUsername
    userId <- liftEffect Auth.getUserId
    liftEffect $ log $ "[Router] Username: " <> show username <> ", UserId: " <> show userId

    H.modify_ _ { isAuthenticated = isAuth, username = username, userId = userId, broadcastManager = Just manager }

    -- Get initial route from hash
    initialHash <- liftEffect getHash
    liftEffect $ log $ "[Router] Initial hash: '" <> initialHash <> "'"

    case parse routeCodec initialHash of
      Left err -> do
        liftEffect $ log $ "[Router] Failed to parse initial route: " <> show err
        -- Default to Home page
        H.modify_ _ { route = Just Home }
      Right route -> do
        liftEffect $ log $ "[Router] Parsed initial route: " <> show route
        -- Apply auth check to route
        H.modify_ _ { route = Just (routeWithAuth isAuth route) }

  NavigateAction route -> do
    liftEffect $ log $ "[Router] Navigating to: " <> show route
    H.modify_ _ { route = Just route }

  HandleOverlaysOutput route -> do
    liftEffect $ log $ "[Router] OverlaysPage output: " <> show route
    H.modify_ _ { route = Just route }

  HandleLoginSuccess loginData -> do
    liftEffect $ log $ "[Router] Login successful: " <> loginData.username
    -- Store auth token in localStorage
    liftEffect $ Auth.saveAuth loginData
    -- Update authenticated state and navigate to Overlays
    H.modify_ _
      { isAuthenticated = true
      , username = Just loginData.username
      , userId = Just loginData.userId
      , route = Just Overlays
      }

  HandleNavigationOutput output -> do
    case output of
      Navigation.Logout -> do
        liftEffect $ log "[Router] Logging out..."
        -- Clear auth data
        liftEffect Auth.clearAuth
        -- Update hash and state
        liftEffect $ setHash (print routeCodec Login)
        H.modify_ _
          { isAuthenticated = false
          , username = Nothing
          , userId = Nothing
          , route = Just Login
          }
      Navigation.NavigateToHome -> do
        liftEffect $ log "[Router] Navigating to Home..."
        liftEffect $ setHash (print routeCodec Home)
        H.modify_ _ { route = Just Home }
      Navigation.NavigateToOverlays -> do
        liftEffect $ log "[Router] Navigating to Overlays..."
        liftEffect $ setHash (print routeCodec Overlays)
        H.modify_ _ { route = Just Overlays }
      Navigation.NavigateToTournamentManager -> do
        liftEffect $ log "[Router] Navigating to Tournament Manager..."
        liftEffect $ setHash (print routeCodec TournamentManager)
        H.modify_ _ { route = Just TournamentManager }
      Navigation.NavigateToCurrentMatch -> do
        liftEffect $ log "[Router] Navigating to Current Match..."
        liftEffect $ setHash (print routeCodec CurrentMatch)
        H.modify_ _ { route = Just CurrentMatch }

  HandleTournamentDetailsOutput output -> do
    case output of
      TournamentDetailsPage.NavigateBack -> do
        liftEffect $ log "[Router] Navigating back to Tournament Manager..."
        liftEffect $ setHash (print routeCodec TournamentManager)
        H.modify_ _ { route = Just TournamentManager }

  HandleTournamentManagerOutput output -> do
    case output of
      TournamentManagerPage.NavigateToTournament tournamentId -> do
        liftEffect $ log $ "[Router] Navigating to tournament: " <> show tournamentId
        liftEffect $ setHash (print routeCodec (TournamentDetail tournamentId))
        H.modify_ _ { route = Just (TournamentDetail tournamentId) }
      TournamentManagerPage.NavigateToAddTournament -> do
        liftEffect $ log "[Router] Navigating to Add Tournament..."
        liftEffect $ setHash (print routeCodec AddTournament)
        H.modify_ _ { route = Just AddTournament }

  HandleCurrentMatchOutput output -> do
    case output of
      CurrentMatchPage.NavigateBack -> do
        liftEffect $ log "[Router] Navigating back from Current Match..."
        liftEffect $ setHash (print routeCodec Overlays)
        H.modify_ _ { route = Just Overlays }

  HandleHomeOutput output -> do
    case output of
      HomePage.Navigate route -> do
        liftEffect $ log $ "[Router] Home navigation to: " <> show route
        liftEffect $ setHash (print routeCodec route)
        H.modify_ _ { route = Just route }

handleQuery :: forall output m a. MonadAff m => Query a -> H.HalogenM State Action Slots output m (Maybe a)
handleQuery = case _ of
  Navigate route next -> do
    liftEffect $ log $ "[Router] Query Navigate to: " <> show route
    state <- H.get
    H.modify_ _ { route = Just (routeWithAuth state.isAuthenticated route) }
    pure $ Just next
