-- | Main router component that handles navigation
module Component.Router where

import Prelude

import Component.OverlaysPage as OverlaysPage
import Component.Standings as Standings
import Component.StandingsWithPics as StandingsWithPics
import Component.HighScores as HighScores
import Component.HighScoresWithPics as HighScoresWithPics
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
  }

-- | Router queries
data Query a
  = Navigate Route a

-- | Router actions
data Action
  = Initialize
  | NavigateAction Route
  | HandleOverlaysOutput Route

-- | Child slots
type Slots =
  ( overlays :: forall query. H.Slot query Route Unit
  , standings :: forall query. H.Slot query Void Unit
  , standingsWithPics :: forall query. H.Slot query Void Unit
  , highScores :: forall query. H.Slot query Void Unit
  , highScoresWithPics :: forall query. H.Slot query Void Unit
  , worker :: forall query. H.Slot query Void Unit
  )

_overlays = Proxy :: Proxy "overlays"
_standings = Proxy :: Proxy "standings"
_standingsWithPics = Proxy :: Proxy "standingsWithPics"
_highScores = Proxy :: Proxy "highScores"
_highScoresWithPics = Proxy :: Proxy "highScoresWithPics"
_worker = Proxy :: Proxy "worker"

-- | Router component
component :: forall input output m. MonadAff m => H.Component Query input output m
component = H.mkComponent
  { initialState: \_ -> { route: Nothing }
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
      -- Shouldn't get here since we redirect in Initialize, but just in case
      HH.slot_ _overlays unit OverlaysPage.component unit

    Just Overlays ->
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

    Just Worker ->
      HH.slot_ _worker unit WorkerPage.component unit

handleAction :: forall output m. MonadAff m => Action -> H.HalogenM State Action Slots output m Unit
handleAction = case _ of
  Initialize -> do
    liftEffect $ log "[Router] Initializing..."

    -- Get initial route from hash
    initialHash <- liftEffect getHash
    liftEffect $ log $ "[Router] Initial hash: '" <> initialHash <> "'"

    case parse routeCodec initialHash of
      Left err -> do
        liftEffect $ log $ "[Router] Failed to parse initial route: " <> show err
        -- Default to Overlays if parsing fails
        H.modify_ _ { route = Just Overlays }
      Right route -> do
        liftEffect $ log $ "[Router] Parsed initial route: " <> show route
        -- Redirect Home to Overlays
        let finalRoute = if route == Home then Overlays else route
        H.modify_ _ { route = Just finalRoute }

  NavigateAction route -> do
    liftEffect $ log $ "[Router] Navigating to: " <> show route
    H.modify_ _ { route = Just route }

  HandleOverlaysOutput route -> do
    liftEffect $ log $ "[Router] OverlaysPage output: " <> show route
    H.modify_ _ { route = Just route }

handleQuery :: forall output m a. MonadAff m => Query a -> H.HalogenM State Action Slots output m (Maybe a)
handleQuery = case _ of
  Navigate route next -> do
    liftEffect $ log $ "[Router] Query Navigate to: " <> show route
    H.modify_ _ { route = Just route }
    pure $ Just next
