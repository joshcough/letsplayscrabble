-- | Main router component that handles navigation
module Component.Router where

import Prelude

import Component.LoginPage as LoginPage
import Component.Navigation as Navigation
import Component.OverlaysPage as OverlaysPage
import Utils.Auth as Auth
import Component.Standings as Standings
import Component.StandingsWithPics as StandingsWithPics
import Component.HighScores as HighScores
import Component.HighScoresWithPics as HighScoresWithPics
import Component.RatingGain as RatingGain
import Component.RatingGainWithPics as RatingGainWithPics
import Component.ScoringLeaders as ScoringLeaders
import Component.ScoringLeadersWithPics as ScoringLeadersWithPics
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
import Routing.Duplex (parse)
import Routing.Hash (getHash)
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
  , standings :: forall query. H.Slot query Void Unit
  , standingsWithPics :: forall query. H.Slot query Void Unit
  , highScores :: forall query. H.Slot query Void Unit
  , highScoresWithPics :: forall query. H.Slot query Void Unit
  , ratingGain :: forall query. H.Slot query Void Unit
  , ratingGainWithPics :: forall query. H.Slot query Void Unit
  , scoringLeaders :: forall query. H.Slot query Void Unit
  , scoringLeadersWithPics :: forall query. H.Slot query Void Unit
  , worker :: forall query. H.Slot query Void Unit
  )

_login = Proxy :: Proxy "login"
_navigation = Proxy :: Proxy "navigation"
_overlays = Proxy :: Proxy "overlays"
_standings = Proxy :: Proxy "standings"
_standingsWithPics = Proxy :: Proxy "standingsWithPics"
_highScores = Proxy :: Proxy "highScores"
_highScoresWithPics = Proxy :: Proxy "highScoresWithPics"
_ratingGain = Proxy :: Proxy "ratingGain"
_ratingGainWithPics = Proxy :: Proxy "ratingGainWithPics"
_scoringLeaders = Proxy :: Proxy "scoringLeaders"
_scoringLeadersWithPics = Proxy :: Proxy "scoringLeadersWithPics"
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

    Just (Standings params) ->
      case params.pics of
        Just true ->
          HH.slot_ _standingsWithPics unit StandingsWithPics.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            }
        _ ->
          HH.slot_ _standings unit Standings.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            }

    Just (HighScores params) ->
      case params.pics of
        Just true ->
          HH.slot_ _highScoresWithPics unit HighScoresWithPics.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            }
        _ ->
          HH.slot_ _highScores unit HighScores.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            }

    Just (RatingGain params) ->
      case params.pics of
        Just true ->
          HH.slot_ _ratingGainWithPics unit RatingGainWithPics.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            }
        _ ->
          HH.slot_ _ratingGain unit RatingGain.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            }

    Just (ScoringLeaders params) ->
      case params.pics of
        Just true ->
          HH.slot_ _scoringLeadersWithPics unit ScoringLeadersWithPics.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            }
        _ ->
          HH.slot_ _scoringLeaders unit ScoringLeaders.component
            { userId: params.userId
            , tournamentId: map TournamentId params.tournamentId
            , divisionName: params.divisionName
            }

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
          -- Allow access to public routes
          Login -> H.modify_ _ { route = Just Login }
          Worker -> H.modify_ _ { route = Just Worker }
          -- All overlay routes require auth
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
        -- Update state and navigate to login
        H.modify_ _
          { isAuthenticated = false
          , username = Nothing
          , userId = Nothing
          , route = Just Login
          }
      Navigation.NavigateToOverlays -> do
        liftEffect $ log "[Router] Navigating to Overlays..."
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
          Login -> Login
          Worker -> Worker
          -- All other overlay routes require auth
          _ -> if state.isAuthenticated then route else Login

    H.modify_ _ { route = Just finalRoute }
    pure $ Just next
