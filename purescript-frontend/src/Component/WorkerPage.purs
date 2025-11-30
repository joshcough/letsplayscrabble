-- | WorkerPage component - Displays worker status and manages WebSocket connection
module Component.WorkerPage where

import Prelude

import Api.CurrentMatchApi as CurrentMatchApi
import Api.TournamentApi as TournamentApi
import BroadcastChannel.Manager as BroadcastManager
import BroadcastChannel.Messages (SubscribeMessage, TournamentDataResponse)
import Control.Monad.Rec.Class (forever)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Data.Newtype (unwrap)
import Domain.Types (TournamentId(..), DivisionId(..))
import Effect.Aff as Aff
import Effect.Aff.Class (class MonadAff)
import Effect.Class (liftEffect)
import Effect.Console as Effect.Console
import Effect.Ref as Ref
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Halogen.Subscription as HS
import Worker.WorkerSocketManager as WSM

type State =
  { workerState :: Maybe (Ref.Ref WSM.WorkerState)
  , broadcastManager :: Maybe BroadcastManager.BroadcastManager
  , status :: String
  , error :: Maybe String
  , lastUpdate :: Number
  }

data Action
  = Initialize
  | Finalize
  | UpdateStatus
  | HandleSubscribe SubscribeMessage

component :: forall query input output m. MonadAff m => H.Component query input output m
component =
  H.mkComponent
    { initialState
    , render
    , eval: H.mkEval $ H.defaultEval
        { handleAction = handleAction
        , initialize = Just Initialize
        , finalize = Just Finalize
        }
    }

initialState :: forall input. input -> State
initialState _ =
  { workerState: Nothing
  , broadcastManager: Nothing
  , status: "Initializing..."
  , error: Nothing
  , lastUpdate: 0.0
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  HH.div
    [ HP.style "position: fixed; top: 10px; left: 10px; z-index: 9999" ]
    [ HH.div
        [ HP.style "background-color: rgba(0, 0, 0, 0.8); color: white; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; min-width: 300px" ]
        [ HH.div
            [ HP.style "font-weight: bold; margin-bottom: 5px" ]
            [ HH.text "🔧 Tournament Worker Status" ]
        , HH.div
            [ HP.style "display: flex; align-items: center; gap: 10px; margin-bottom: 5px" ]
            [ HH.div
                [ HP.style $ "width: 10px; height: 10px; border-radius: 50%; background-color: " <> getStatusColor state ]
                []
            , HH.span_ [ HH.text state.status ]
            ]
        , case state.error of
            Just err ->
              HH.div
                [ HP.style "color: #ff4444; margin-bottom: 5px" ]
                [ HH.text $ "❌ " <> err ]
            Nothing -> HH.text ""
        , HH.div
            [ HP.style "font-size: 10px; color: #aaa; margin-top: 5px" ]
            [ HH.text "Broadcasting on 'tournament-updates' & 'worker-status' channels" ]
        ]
    ]

getStatusColor :: State -> String
getStatusColor state =
  case state.error of
    Just _ -> "#ff4444"
    Nothing ->
      if state.status == "Connected" then "#44ff44"
      else if state.status == "Connecting" || state.status == "Initializing..." then "#ffaa44"
      else "#666666"

handleAction :: forall output m. MonadAff m => Action -> H.HalogenM State Action () output m Unit
handleAction = case _ of
  Initialize -> do
    liftEffect $ Effect.Console.log "[WorkerPage] Initialize action called"

    -- Create BroadcastManager to handle API requests
    liftEffect $ Effect.Console.log "[WorkerPage] Creating BroadcastManager"
    manager <- liftEffect BroadcastManager.create

    -- Subscribe to subscribe messages (overlay components requesting data)
    liftEffect $ Effect.Console.log "[WorkerPage] Subscribing to subscribe messages"
    void $ H.subscribe $
      manager.subscribeEmitter <#> HandleSubscribe

    -- Store broadcast manager
    H.modify_ _ { broadcastManager = Just manager }

    -- Create worker state for Socket.IO
    stateRef <- liftEffect do
      Effect.Console.log "[WorkerPage] Creating worker state"
      workerState <- WSM.createWorkerState
      Ref.new workerState

    -- Initialize worker with API URL
    liftEffect do
      Effect.Console.log "[WorkerPage] Calling WSM.initialize"
      WSM.initialize "http://localhost:3001" stateRef

    -- Store reference to worker state
    H.modify_ _ { workerState = Just stateRef }
    liftEffect $ Effect.Console.log "[WorkerPage] Worker initialized"

    -- Start polling for status updates
    { emitter, listener } <- liftEffect HS.create
    _ <- H.subscribe (UpdateStatus <$ emitter)

    -- Poll every 500ms
    void $ H.fork $ forever do
      H.liftAff $ Aff.delay (Aff.Milliseconds 500.0)
      liftEffect $ HS.notify listener unit

  Finalize -> do
    -- Clean up worker connection
    state <- H.get
    case state.workerState of
      Just stateRef -> liftEffect $ WSM.cleanup stateRef
      Nothing -> pure unit

  UpdateStatus -> do
    -- Read current state from worker and update UI
    state <- H.get
    case state.workerState of
      Just stateRef -> do
        workerState <- liftEffect $ Ref.read stateRef
        H.modify_ _
          { status = workerState.connectionStatus
          , error = workerState.error
          , lastUpdate = workerState.lastDataUpdate
          }
      Nothing -> pure unit

  HandleSubscribe msg -> do
    liftEffect $ Effect.Console.log "[WorkerPage] Received subscribe message"
    liftEffect $ Effect.Console.log $ "[WorkerPage] userId=" <> show msg.userId <>
      ", tournament=" <> show msg.tournament

    -- Extract tournament/division info from message
    case msg.tournament of
      Nothing -> do
        liftEffect $ Effect.Console.log "[WorkerPage] No tournament specified - fetching current match"

        -- Fetch current match from API
        currentMatchResult <- H.liftAff $ CurrentMatchApi.fetchCurrentMatch msg.userId

        case currentMatchResult of
          Left err -> do
            liftEffect $ Effect.Console.log $ "[WorkerPage] Error fetching current match: " <> err
            pure unit

          Right Nothing -> do
            liftEffect $ Effect.Console.log "[WorkerPage] No current match found for user"
            pure unit

          Right (Just currentMatch) -> do
            let cm = unwrap currentMatch
            liftEffect $ Effect.Console.log $ "[WorkerPage] Current match found: tournament=" <>
              show cm.tournamentId <> ", division=" <> cm.divisionName

            -- Now fetch tournament data using current match info
            result <- H.liftAff $ TournamentApi.fetchTournamentData msg.userId
              (TournamentId cm.tournamentId)
              (Just cm.divisionName)

            case result of
              Left err -> do
                liftEffect $ Effect.Console.log $ "[WorkerPage] Error fetching tournament data: " <> err
                pure unit

              Right tournamentData -> do
                liftEffect $ Effect.Console.log "[WorkerPage] Successfully fetched tournament data for current match"

                -- Broadcast the data
                state <- H.get
                case state.broadcastManager of
                  Just mgr -> do
                    let response =
                          { userId: msg.userId
                          , tournamentId: TournamentId cm.tournamentId
                          , divisionId: DivisionId cm.divisionId
                          , isCurrentMatch: true
                          , data: tournamentData
                          }
                    liftEffect $ BroadcastManager.postTournamentDataResponse mgr response
                    liftEffect $ Effect.Console.log "[WorkerPage] Broadcast tournament data for current match"
                  Nothing -> liftEffect $ Effect.Console.log "[WorkerPage] No broadcast manager"

      Just tournament -> do
        let tournamentId = tournament.tournamentId
        let divisionName = case tournament.division of
              Just div -> Just div.divisionName
              Nothing -> Nothing

        liftEffect $ Effect.Console.log $ "[WorkerPage] Tournament: " <> show tournamentId <> ", Division: " <> show divisionName

        -- Fetch tournament data from API with divisionName query param
        liftEffect $ Effect.Console.log "[WorkerPage] Fetching tournament data from API..."
        result <- H.liftAff $ TournamentApi.fetchTournamentData msg.userId tournamentId divisionName

        case result of
          Left err -> do
            liftEffect $ Effect.Console.log $ "[WorkerPage] API fetch failed: " <> err
            -- TODO: Broadcast error message
            pure unit

          Right data_ -> do
            liftEffect $ Effect.Console.log "[WorkerPage] API fetch succeeded, broadcasting response..."

            -- Get the divisionId from the response data
            let divisionId = data_.division.id

            -- Create response message
            let response :: TournamentDataResponse
                response =
                  { userId: msg.userId
                  , tournamentId: tournamentId
                  , divisionId: divisionId
                  , isCurrentMatch: false  -- This is a specific tournament request
                  , data: data_
                  }

            -- Broadcast response to all listeners
            state <- H.get
            case state.broadcastManager of
              Just manager -> do
                BroadcastManager.postTournamentDataResponse manager response
                liftEffect $ Effect.Console.log "[WorkerPage] Response broadcasted successfully"
              Nothing -> do
                liftEffect $ Effect.Console.log "[WorkerPage] ERROR: No broadcast manager available"
