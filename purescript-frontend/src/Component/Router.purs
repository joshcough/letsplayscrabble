-- | Main router component that handles navigation
module Component.Router where

import Prelude

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
import Data.Either (Either(..))
import Effect.Unsafe (unsafePerformEffect)
import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..), DivisionId(..))
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
  }

-- | Router queries
data Query a
  = Navigate Route a

-- | Router actions
data Action
  = Initialize
  | NavigateAction Route
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
  ( login :: forall query. H.Slot query LoginOutput Unit
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

-- | Router component
component :: forall input output m. MonadAff m => H.Component Query input output m
component = H.mkComponent
  { initialState: \_ -> { route: Nothing, isAuthenticated: false, username: Nothing, userId: Nothing }
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = handleAction
      , handleQuery = handleQuery
      , initialize = Just Initialize
      }
  }

render :: forall m. MonadAff m => State -> H.ComponentHTML Action Slots m
render state =
  let _ = unsafePerformEffect $ log $ "[Router] Rendering route: " <> show state.route
  in case state.route of
    Nothing ->
      HH.div
        [ HP.class_ (HH.ClassName "min-h-screen flex items-center justify-center") ]
        [ HH.text "Loading..." ]

    Just Home ->
      -- Redirect Home to Login for now
      HH.slot _login unit LoginPage.component unit HandleLoginSuccess

    Just Login ->
      HH.slot _login unit LoginPage.component unit HandleLoginSuccess

    Just Overlays ->
      case state.username, state.userId of
        Just username, Just userId ->
          HH.div_
            [ HH.slot _navigation unit Navigation.component { username, userId } HandleNavigationOutput
            , HH.slot _overlays unit OverlaysPage.component unit HandleOverlaysOutput
            ]
        _, _ ->
          HH.slot _overlays unit OverlaysPage.component unit HandleOverlaysOutput

    Just TournamentManager ->
      case state.username, state.userId of
        Just username, Just userId ->
          HH.div_
            [ HH.slot _navigation unit Navigation.component { username, userId } HandleNavigationOutput
            , HH.slot _tournamentManager unit TournamentManagerPage.component unit HandleTournamentManagerOutput
            ]
        _, _ ->
          HH.slot _tournamentManager unit TournamentManagerPage.component unit HandleTournamentManagerOutput

    Just AddTournament ->
      case state.username, state.userId of
        Just username, Just userId ->
          HH.div_
            [ HH.slot _navigation unit Navigation.component { username, userId } HandleNavigationOutput
            , HH.slot_ _addTournament unit AddTournament.component unit
            ]
        _, _ ->
          HH.slot_ _addTournament unit AddTournament.component unit

    Just (TournamentDetail tournamentId) ->
      case state.username, state.userId of
        Just username, Just userId ->
          HH.div_
            [ HH.slot _navigation unit Navigation.component { username, userId } HandleNavigationOutput
            , HH.slot _tournamentDetails unit TournamentDetailsPage.component { tournamentId } HandleTournamentDetailsOutput
            ]
        _, _ ->
          HH.slot _tournamentDetails unit TournamentDetailsPage.component { tournamentId } HandleTournamentDetailsOutput

    Just CurrentMatch ->
      case state.username, state.userId of
        Just username, Just userId ->
          HH.div_
            [ HH.slot _navigation unit Navigation.component { username, userId } HandleNavigationOutput
            , HH.slot _currentMatch unit CurrentMatchPage.component unit HandleCurrentMatchOutput
            ]
        _, _ ->
          HH.slot _currentMatch unit CurrentMatchPage.component unit HandleCurrentMatchOutput

    Just (Standings params) ->
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
      HH.slot_ _crossTablesPlayerProfile unit CrossTablesPlayerProfile.component
        { userId: params.userId
        , tournamentId: map TournamentId params.tournamentId
        , divisionName: params.divisionName
        , extra: params.playerId
        }

    Just (HeadToHead params) ->
      HH.slot_ _headToHead unit HeadToHead.component
        { userId: params.userId
        , tournamentId: params.tournamentId
        , divisionName: params.divisionName
        , playerId1: params.playerId1
        , playerId2: params.playerId2
        }

    Just (MiscOverlay params) ->
      HH.slot_ _miscOverlay unit MiscOverlay.component
        { userId: params.userId
        , tournamentId: map TournamentId params.tournamentId
        , divisionName: params.divisionName
        , extra: MiscOverlay.parseSource params.source
        }

    Just (TournamentStats params) ->
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

    -- Check if user is authenticated
    isAuth <- liftEffect Auth.isAuthenticated
    liftEffect $ log $ "[Router] Is authenticated: " <> show isAuth

    -- Load user data from localStorage
    username <- liftEffect Auth.getUsername
    userId <- liftEffect Auth.getUserId
    liftEffect $ log $ "[Router] Username: " <> show username <> ", UserId: " <> show userId

    H.modify_ _ { isAuthenticated = isAuth, username = username, userId = userId }

    -- Get initial route from hash
    initialHash <- liftEffect getHash
    liftEffect $ log $ "[Router] Initial hash: '" <> initialHash <> "'"

    case parse routeCodec initialHash of
      Left err -> do
        liftEffect $ log $ "[Router] Failed to parse initial route: " <> show err
        -- Default based on auth status
        H.modify_ _ { route = Just (if isAuth then Overlays else Login) }
      Right route -> do
        liftEffect $ log $ "[Router] Parsed initial route: " <> show route
        -- Handle Home route based on auth
        case route of
          Home -> H.modify_ _ { route = Just (if isAuth then Overlays else Login) }
          -- If not authenticated and trying to access protected route, redirect to login
          Overlays -> H.modify_ _ { route = Just (if isAuth then Overlays else Login) }
          TournamentManager -> H.modify_ _ { route = Just (if isAuth then TournamentManager else Login) }
          TournamentDetail id -> H.modify_ _ { route = Just (if isAuth then TournamentDetail id else Login) }
          CurrentMatch -> H.modify_ _ { route = Just (if isAuth then CurrentMatch else Login) }
          -- Allow access to public routes
          Login -> H.modify_ _ { route = Just Login }
          Worker -> H.modify_ _ { route = Just Worker }
          -- Public overlay routes (no auth required)
          CrossTablesPlayerProfile _ -> H.modify_ _ { route = Just route }
          HeadToHead _ -> H.modify_ _ { route = Just route }
          MiscOverlay _ -> H.modify_ _ { route = Just route }
          TournamentStats _ -> H.modify_ _ { route = Just route }
          MiscOverlayTesting -> H.modify_ _ { route = Just route }
          -- All other overlay routes require auth
          _ -> H.modify_ _ { route = Just (if isAuth then route else Login) }

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

handleQuery :: forall output m a. MonadAff m => Query a -> H.HalogenM State Action Slots output m (Maybe a)
handleQuery = case _ of
  Navigate route next -> do
    liftEffect $ log $ "[Router] Query Navigate to: " <> show route
    state <- H.get

    -- Check if route requires auth
    let finalRoute = case route of
          Home -> if state.isAuthenticated then Overlays else Login
          Overlays -> if state.isAuthenticated then Overlays else Login
          TournamentManager -> if state.isAuthenticated then TournamentManager else Login
          TournamentDetail id -> if state.isAuthenticated then TournamentDetail id else Login
          CurrentMatch -> if state.isAuthenticated then CurrentMatch else Login
          Login -> Login
          Worker -> Worker
          -- Public overlay routes (no auth required)
          CrossTablesPlayerProfile _ -> route
          HeadToHead _ -> route
          MiscOverlay _ -> route
          TournamentStats _ -> route
          MiscOverlayTesting -> route
          -- All other overlay routes require auth
          _ -> if state.isAuthenticated then route else Login

    H.modify_ _ { route = Just finalRoute }
    pure $ Just next
