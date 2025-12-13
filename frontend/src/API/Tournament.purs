-- | API calls for tournament operations
module API.Tournament where

import Prelude

import Affjax (printError)
import Affjax.RequestBody as RequestBody
import Affjax.RequestHeader (RequestHeader(..))
import Affjax.Web as AW
import Affjax.ResponseFormat as ResponseFormat
import Data.HTTP.Method (Method(..))
import Data.Argonaut.Core (Json, stringify)
import Data.Argonaut.Decode (decodeJson, printJsonDecodeError, (.:), (.:?))
import Data.Argonaut.Encode (encodeJson, (:=), (~>))
import Data.Bifunctor (lmap)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Data.Traversable (traverse)
import Domain.Types (TournamentId(..), TournamentSummary)
import Effect.Aff (Aff)
import Effect.Class (liftEffect)
import Utils.Auth as Auth
import Utils.Logger (log)

-- | Decode a single tournament from JSON (handles camelCase domain model from backend)
decodeTournament :: Json -> Either String TournamentSummary
decodeTournament json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  id <- TournamentId <$> (lmap printJsonDecodeError $ obj .: "id")
  name <- lmap printJsonDecodeError $ obj .: "name"
  city <- lmap printJsonDecodeError $ obj .: "city"
  year <- lmap printJsonDecodeError $ obj .: "year"
  lexicon <- lmap printJsonDecodeError $ obj .: "lexicon"
  longFormName <- lmap printJsonDecodeError $ obj .: "longFormName"
  dataUrl <- lmap printJsonDecodeError $ obj .: "dataUrl"
  pollUntil <- lmap printJsonDecodeError $ obj .:? "pollUntil"
  theme <- lmap printJsonDecodeError $ obj .: "theme"
  transparentBackground <- lmap printJsonDecodeError $ obj .: "transparentBackground"
  pure { id, name, city, year, lexicon, longFormName, dataUrl, pollUntil, theme, transparentBackground }

-- | Decode the API response for tournament list
decodeTournamentListResponse :: Json -> Either String (Array TournamentSummary)
decodeTournamentListResponse json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  success <- lmap printJsonDecodeError $ obj .: "success"
  if success then do
    tournamentsJson <- lmap printJsonDecodeError $ obj .: "data"
    tournaments <- traverse decodeTournament tournamentsJson
    pure tournaments
  else do
    error <- lmap printJsonDecodeError $ obj .: "error"
    Left error

-- | Create tournament parameters
type CreateTournamentParams =
  { name :: String
  , city :: String
  , year :: Int
  , lexicon :: String
  , longFormName :: String
  , dataUrl :: String
  , theme :: String
  }

-- | Create a new tournament
createTournament :: CreateTournamentParams -> Aff (Either String TournamentSummary)
createTournament params = do
  maybeToken <- liftEffect Auth.getAuthToken
  case maybeToken of
    Nothing -> pure $ Left "Not authenticated"
    Just token -> do
      let headers = [ RequestHeader "Authorization" ("Bearer " <> token)
                    , RequestHeader "Content-Type" "application/json"
                    ]
      let body =
            "name" := params.name
            ~> "city" := params.city
            ~> "year" := params.year
            ~> "lexicon" := params.lexicon
            ~> "longFormName" := params.longFormName
            ~> "dataUrl" := params.dataUrl
            ~> "theme" := params.theme
            ~> encodeJson {}
      result <- AW.request $ AW.defaultRequest
        { url = "/api/private/tournaments"
        , method = Left POST
        , headers = headers
        , content = Just $ RequestBody.json body
        , responseFormat = ResponseFormat.json
        }

      case result of
        Left err -> pure $ Left $ "Network error: " <> printError err
        Right response -> pure $ decodeTournamentRowResponse response.body

-- | List all tournaments
listTournaments :: Aff (Either String (Array TournamentSummary))
listTournaments = do
  -- Get auth token from localStorage
  maybeToken <- liftEffect Auth.getAuthToken

  case maybeToken of
    Nothing -> pure $ Left "Not authenticated"
    Just token -> do
      -- Make request with Authorization header
      let headers = [ RequestHeader "Authorization" ("Bearer " <> token) ]
      result <- AW.request $ AW.defaultRequest
        { url = "/api/private/tournaments/list"
        , method = Left GET
        , headers = headers
        , responseFormat = ResponseFormat.json
        }

      case result of
        Left err -> pure $ Left $ "Network error: " <> printError err
        Right response -> pure $ decodeTournamentListResponse response.body

-- | Decode the API response for a single tournament row
decodeTournamentRowResponse :: Json -> Either String TournamentSummary
decodeTournamentRowResponse json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  success <- lmap printJsonDecodeError $ obj .: "success"
  if success then do
    tournamentJson <- lmap printJsonDecodeError $ obj .: "data"
    decodeTournament tournamentJson
  else do
    error <- lmap printJsonDecodeError $ obj .: "error"
    Left error

-- | Get tournament metadata (row) by ID
getTournamentRow :: Int -> Int -> Aff (Either String TournamentSummary)
getTournamentRow userId tournamentId = do
  let url = "/api/public/users/" <> show userId <> "/tournaments/" <> show tournamentId <> "/row"
  result <- AW.request $ AW.defaultRequest
    { url = url
    , method = Left GET
    , responseFormat = ResponseFormat.json
    }

  case result of
    Left err -> pure $ Left $ "Network error: " <> printError err
    Right response -> pure $ decodeTournamentRowResponse response.body

-- | Update tournament metadata
updateTournament :: Int -> { name :: String, longFormName :: String, city :: String, year :: Int, lexicon :: String, theme :: String, dataUrl :: String } -> Aff (Either String TournamentSummary)
updateTournament tournamentId metadata = do
  maybeToken <- liftEffect Auth.getAuthToken
  case maybeToken of
    Nothing -> pure $ Left "Not authenticated"
    Just token -> do
      let headers = [ RequestHeader "Authorization" ("Bearer " <> token)
                    , RequestHeader "Content-Type" "application/json"
                    ]
      let url = "/api/private/tournaments/" <> show tournamentId
      let body =
            "name" := metadata.name
            ~> "longFormName" := metadata.longFormName
            ~> "city" := metadata.city
            ~> "year" := metadata.year
            ~> "lexicon" := metadata.lexicon
            ~> "theme" := metadata.theme
            ~> "dataUrl" := metadata.dataUrl
            ~> encodeJson {}
      result <- AW.request $ AW.defaultRequest
        { url = url
        , method = Left PUT
        , headers = headers
        , content = Just $ RequestBody.json body
        , responseFormat = ResponseFormat.json
        }

      case result of
        Left err -> pure $ Left $ "Network error: " <> printError err
        Right response -> do
          -- Log the response for debugging
          liftEffect $ log $ "[API] Update response: " <> stringify response.body

          -- The response has a nested structure: { success, data: { tournament, changes } }
          obj <- pure $ decodeJson response.body
          case obj of
            Left err -> do
              liftEffect $ log $ "[API] Failed to decode response object: " <> printJsonDecodeError err
              pure $ Left $ printJsonDecodeError err
            Right respObj -> do
              success <- pure $ respObj .: "success"
              case success of
                Left err -> pure $ Left $ printJsonDecodeError err
                Right false -> do
                  error <- pure $ respObj .: "error"
                  case error of
                    Left _ -> pure $ Left "Update failed"
                    Right errMsg -> pure $ Left errMsg
                Right true -> do
                  dataObj <- pure $ respObj .: "data"
                  case dataObj of
                    Left err -> do
                      liftEffect $ log $ "[API] Failed to decode data object: " <> printJsonDecodeError err
                      pure $ Left $ printJsonDecodeError err
                    Right d -> do
                      tournamentJson <- pure $ d .: "tournament"
                      case tournamentJson of
                        Left err -> do
                          liftEffect $ log $ "[API] Failed to decode tournament: " <> printJsonDecodeError err
                          pure $ Left $ printJsonDecodeError err
                        Right t -> pure $ decodeTournament t

-- | Enable polling for a tournament
enablePolling :: Int -> Int -> Aff (Either String String)
enablePolling tournamentId days = do
  maybeToken <- liftEffect Auth.getAuthToken
  case maybeToken of
    Nothing -> pure $ Left "Not authenticated"
    Just token -> do
      let headers = [ RequestHeader "Authorization" ("Bearer " <> token)
                    , RequestHeader "Content-Type" "application/json"
                    ]
      let url = "/api/private/tournaments/" <> show tournamentId <> "/polling"
      let body = "days" := days ~> encodeJson {}
      result <- AW.request $ AW.defaultRequest
        { url = url
        , method = Left POST
        , headers = headers
        , content = Just $ RequestBody.json body
        , responseFormat = ResponseFormat.json
        }

      case result of
        Left err -> pure $ Left $ "Network error: " <> printError err
        Right response -> do
          obj <- pure $ decodeJson response.body
          case obj of
            Left err -> pure $ Left $ printJsonDecodeError err
            Right respObj -> do
              success <- pure $ respObj .: "success"
              case success of
                Left err -> pure $ Left $ printJsonDecodeError err
                Right false -> do
                  error <- pure $ respObj .: "error"
                  case error of
                    Left _ -> pure $ Left "Failed to enable polling"
                    Right errMsg -> pure $ Left errMsg
                Right true -> do
                  dataObj <- pure $ respObj .: "data"
                  case dataObj of
                    Left err -> pure $ Left $ printJsonDecodeError err
                    Right d -> do
                      pollUntil <- pure $ d .: "pollUntil"
                      case pollUntil of
                        Left err -> pure $ Left $ printJsonDecodeError err
                        Right dateStr -> pure $ Right dateStr

-- | Stop polling for a tournament
stopPolling :: Int -> Aff (Either String Unit)
stopPolling tournamentId = do
  maybeToken <- liftEffect Auth.getAuthToken
  case maybeToken of
    Nothing -> pure $ Left "Not authenticated"
    Just token -> do
      let headers = [ RequestHeader "Authorization" ("Bearer " <> token) ]
      let url = "/api/private/tournaments/" <> show tournamentId <> "/polling"
      result <- AW.request $ AW.defaultRequest
        { url = url
        , method = Left DELETE
        , headers = headers
        , responseFormat = ResponseFormat.json
        }

      case result of
        Left err -> pure $ Left $ "Network error: " <> printError err
        Right response -> do
          obj <- pure $ decodeJson response.body
          case obj of
            Left err -> pure $ Left $ printJsonDecodeError err
            Right respObj -> do
              success <- pure $ respObj .: "success"
              case success of
                Left err -> pure $ Left $ printJsonDecodeError err
                Right false -> do
                  error <- pure $ respObj .: "error"
                  case error of
                    Left _ -> pure $ Left "Failed to stop polling"
                    Right errMsg -> pure $ Left errMsg
                Right true -> pure $ Right unit

-- | Clear tournament cache
clearCache :: Aff (Either String Unit)
clearCache = do
  maybeToken <- liftEffect Auth.getAuthToken
  case maybeToken of
    Nothing -> pure $ Left "Not authenticated"
    Just token -> do
      let headers = [ RequestHeader "Authorization" ("Bearer " <> token) ]
      let url = "/api/private/cache/clear"
      result <- AW.request $ AW.defaultRequest
        { url = url
        , method = Left POST
        , headers = headers
        , responseFormat = ResponseFormat.json
        }

      case result of
        Left err -> pure $ Left $ "Network error: " <> printError err
        Right response -> do
          obj <- pure $ decodeJson response.body
          case obj of
            Left err -> pure $ Left $ printJsonDecodeError err
            Right respObj -> do
              success <- pure $ respObj .: "success"
              case success of
                Left err -> pure $ Left $ printJsonDecodeError err
                Right false -> do
                  error <- pure $ respObj .: "error"
                  case error of
                    Left _ -> pure $ Left "Failed to clear cache"
                    Right errMsg -> pure $ Left errMsg
                Right true -> pure $ Right unit

-- | Refetch tournament data from CrossTables
refetchTournament :: Int -> Aff (Either String String)
refetchTournament tournamentId = do
  maybeToken <- liftEffect Auth.getAuthToken
  case maybeToken of
    Nothing -> pure $ Left "Not authenticated"
    Just token -> do
      let headers = [ RequestHeader "Authorization" ("Bearer " <> token) ]
      let url = "/api/private/tournaments/" <> show tournamentId <> "/refetch"
      result <- AW.request $ AW.defaultRequest
        { url = url
        , method = Left POST
        , headers = headers
        , responseFormat = ResponseFormat.json
        }

      case result of
        Left err -> pure $ Left $ "Network error: " <> printError err
        Right response -> do
          obj <- pure $ decodeJson response.body
          case obj of
            Left err -> pure $ Left $ printJsonDecodeError err
            Right respObj -> do
              success <- pure $ respObj .: "success"
              case success of
                Left err -> pure $ Left $ printJsonDecodeError err
                Right false -> do
                  error <- pure $ respObj .: "error"
                  case error of
                    Left _ -> pure $ Left "Refetch failed"
                    Right errMsg -> pure $ Left errMsg
                Right true -> do
                  dataObj <- pure $ respObj .: "data"
                  case dataObj of
                    Left err -> pure $ Left $ printJsonDecodeError err
                    Right d -> do
                      message <- pure $ d .: "message"
                      case message of
                        Left err -> pure $ Left $ printJsonDecodeError err
                        Right msg -> pure $ Right msg

-- | Full refetch tournament data from CrossTables (clears existing data first)
fullRefetchTournament :: Int -> Aff (Either String String)
fullRefetchTournament tournamentId = do
  maybeToken <- liftEffect Auth.getAuthToken
  case maybeToken of
    Nothing -> pure $ Left "Not authenticated"
    Just token -> do
      let headers = [ RequestHeader "Authorization" ("Bearer " <> token) ]
      let url = "/api/private/tournaments/" <> show tournamentId <> "/full-refetch"
      result <- AW.request $ AW.defaultRequest
        { url = url
        , method = Left POST
        , headers = headers
        , responseFormat = ResponseFormat.json
        }

      case result of
        Left err -> pure $ Left $ "Network error: " <> printError err
        Right response -> do
          obj <- pure $ decodeJson response.body
          case obj of
            Left err -> pure $ Left $ printJsonDecodeError err
            Right respObj -> do
              success <- pure $ respObj .: "success"
              case success of
                Left err -> pure $ Left $ printJsonDecodeError err
                Right false -> do
                  error <- pure $ respObj .: "error"
                  case error of
                    Left _ -> pure $ Left "Full refetch failed"
                    Right errMsg -> pure $ Left errMsg
                Right true -> do
                  dataObj <- pure $ respObj .: "data"
                  case dataObj of
                    Left err -> pure $ Left $ printJsonDecodeError err
                    Right d -> do
                      message <- pure $ d .: "message"
                      case message of
                        Left err -> pure $ Left $ printJsonDecodeError err
                        Right msg -> pure $ Right msg
