-- | API calls for authentication
module API.Auth where

import Prelude

import Affjax (printError)
import Affjax.Web as AW
import Affjax.RequestBody as RequestBody
import Affjax.ResponseFormat as ResponseFormat
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode (decodeJson, printJsonDecodeError, (.:))
import Data.Argonaut.Encode (encodeJson)
import Data.Bifunctor (lmap)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Effect.Aff (Aff)

type LoginRequest =
  { username :: String
  , password :: String
  }

type LoginResponse =
  { token :: String
  , user ::
      { id :: Int
      , username :: String
      }
  }

-- | Decode the API response
decodeLoginResponse :: Json -> Either String { token :: String, userId :: Int, username :: String }
decodeLoginResponse json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  success <- lmap printJsonDecodeError $ obj .: "success"
  if success then do
    data_ <- lmap printJsonDecodeError $ obj .: "data"
    token <- lmap printJsonDecodeError $ data_ .: "token"
    user <- lmap printJsonDecodeError $ data_ .: "user"
    userId <- lmap printJsonDecodeError $ user .: "id"
    username <- lmap printJsonDecodeError $ user .: "username"
    pure { token, userId, username }
  else do
    error <- lmap printJsonDecodeError $ obj .: "error"
    Left error

-- | Login with username and password
login :: LoginRequest -> Aff (Either String { token :: String, userId :: Int, username :: String })
login credentials = do
  result <- AW.post ResponseFormat.json "/api/auth/login" (Just $ RequestBody.json $ encodeJson credentials)

  case result of
    Left err -> pure $ Left $ "Network error: " <> printError err
    Right response -> pure $ decodeLoginResponse response.body
