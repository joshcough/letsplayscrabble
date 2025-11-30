-- | API calls for tournament operations
module API.Tournament where

import Prelude

import Affjax (printError)
import Affjax.RequestHeader (RequestHeader(..))
import Affjax.Web as AW
import Affjax.ResponseFormat as ResponseFormat
import Data.HTTP.Method (Method(..))
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode (decodeJson, printJsonDecodeError, (.:), (.:?))
import Data.Bifunctor (lmap)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Data.Traversable (traverse)
import Domain.Types (TournamentId(..), TournamentSummary)
import Effect.Aff (Aff)
import Effect.Class (liftEffect)
import Utils.Auth as Auth

-- | Decode a single tournament from JSON (handles snake_case from backend)
decodeTournament :: Json -> Either String TournamentSummary
decodeTournament json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  id <- TournamentId <$> (lmap printJsonDecodeError $ obj .: "id")
  name <- lmap printJsonDecodeError $ obj .: "name"
  city <- lmap printJsonDecodeError $ obj .: "city"
  year <- lmap printJsonDecodeError $ obj .: "year"
  lexicon <- lmap printJsonDecodeError $ obj .: "lexicon"
  longFormName <- lmap printJsonDecodeError $ obj .: "long_form_name"
  dataUrl <- lmap printJsonDecodeError $ obj .: "data_url"
  pollUntil <- lmap printJsonDecodeError $ obj .:? "poll_until"
  theme <- lmap printJsonDecodeError $ obj .: "theme"
  transparentBackground <- lmap printJsonDecodeError $ obj .: "transparent_background"
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
        { url = "http://localhost:3001/api/private/tournaments/list"
        , method = Left GET
        , headers = headers
        , responseFormat = ResponseFormat.json
        }

      case result of
        Left err -> pure $ Left $ "Network error: " <> printError err
        Right response -> pure $ decodeTournamentListResponse response.body
