-- | Tournament API client
module Api.TournamentApi where

import Prelude

import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode (decodeJson, (.:), printJsonDecodeError, JsonDecodeError(..))
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..), DivisionId(..), DivisionScopedData)
import Effect (Effect)
import Effect.Aff (Aff, makeAff, nonCanceler)
import Effect.Class (liftEffect)
import Effect.Console as Console
import Effect.Exception (error)
import Foreign (unsafeFromForeign)

-- | FFI: Fetch JSON from URL
foreign import fetchJsonImpl :: String -> (Json -> Effect Unit) -> (String -> Effect Unit) -> Effect Unit

-- | Fetch tournament data
-- | Now accepts optional divisionName parameter
fetchTournamentData :: Int -> TournamentId -> Maybe String -> Aff (Either String DivisionScopedData)
fetchTournamentData userId (TournamentId tournamentId) maybeDivisionName = do
  let url = buildUrl userId tournamentId maybeDivisionName
  liftEffect $ Console.log $ "[TournamentApi] Fetching from: " <> url

  -- Fetch JSON from API
  json <- makeAff \cb -> do
    fetchJsonImpl url
      (\j -> cb (Right j))
      (\err -> cb (Left (error err)))
    pure nonCanceler

  liftEffect $ Console.log "[TournamentApi] Received response, decoding..."

  -- Decode the API response envelope { success: true, data: ... }
  case decodeApiResponse json of
    Left err -> do
      liftEffect $ Console.log $ "[TournamentApi] Decode error: " <> printJsonDecodeError err
      pure $ Left $ "Failed to decode response: " <> printJsonDecodeError err
    Right data_ -> do
      liftEffect $ Console.log "[TournamentApi] Successfully decoded response"
      pure $ Right data_

  where
    buildUrl :: Int -> Int -> Maybe String -> String
    buildUrl uid tid Nothing =
      "http://localhost:3001/api/public/users/" <> show uid <>
      "/tournaments/" <> show tid
    buildUrl uid tid (Just divName) =
      "http://localhost:3001/api/public/users/" <> show uid <>
      "/tournaments/" <> show tid <>
      "?divisionName=" <> divName

    decodeApiResponse :: Json -> Either JsonDecodeError DivisionScopedData
    decodeApiResponse json = do
      obj <- decodeJson json
      success <- obj .: "success"
      if success
        then obj .: "data"
        else Left $ TypeMismatch "API returned success: false"
