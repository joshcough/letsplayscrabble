-- | Tournament API client
module Api.TournamentApi where

import Prelude

import Affjax.Web as AX
import Affjax.ResponseFormat as ResponseFormat
import Affjax.RequestHeader (RequestHeader(..))
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode (decodeJson, (.:), printJsonDecodeError, JsonDecodeError(..))
import Data.Either (Either(..))
import Data.HTTP.Method (Method(..))
import Data.Maybe (Maybe)
import Domain.Types (TournamentId(..), Tournament)
import API.CurrentMatch (decodeTournament)
import Effect.Aff (Aff)
import Effect.Class (liftEffect)
import Utils.Logger (log)

-- | Fetch tournament data (full tournament with all divisions)
-- | divisionName parameter is ignored - we always fetch the full tournament
fetchTournamentData :: Int -> TournamentId -> Maybe String -> Aff (Either String Tournament)
fetchTournamentData userId (TournamentId tournamentId) maybeDivisionName = do
  let url = buildUrl userId tournamentId maybeDivisionName

  -- Fetch JSON from API using Affjax
  result <- AX.request (AX.defaultRequest
    { url = url
    , method = Left GET
    , responseFormat = ResponseFormat.json
    , headers =
        [ RequestHeader "Content-Type" "application/json"
        ]
    , withCredentials = true
    })

  case result of
    Left err -> do
      liftEffect $ log $ "[TournamentApi] HTTP error: " <> AX.printError err
      pure $ Left $ "HTTP error: " <> AX.printError err
    Right response -> do
      -- Decode the API response envelope { success: true, data: ... }
      case decodeApiResponse response.body of
        Left err -> do
          liftEffect $ log $ "[TournamentApi] Decode error: " <> printJsonDecodeError err
          pure $ Left $ "Failed to decode response: " <> printJsonDecodeError err
        Right data_ -> do
          pure $ Right data_

  where
    buildUrl :: Int -> Int -> Maybe String -> String
    buildUrl uid tid _ =
      -- Always fetch full tournament (no division parameter)
      "/api/public/users/" <> show uid <>
      "/tournaments/" <> show tid

    decodeApiResponse :: Json -> Either JsonDecodeError Tournament
    decodeApiResponse json = do
      obj <- decodeJson json
      success <- obj .: "success"
      if success
        then do
          dataJson <- obj .: "data"
          case decodeTournament dataJson of
            Left err -> Left $ TypeMismatch $ "Failed to decode Tournament: " <> err
            Right tournament -> Right tournament
        else Left $ TypeMismatch "API returned success: false"
