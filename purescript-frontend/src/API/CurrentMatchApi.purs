-- | API module for fetching current match data
module Api.CurrentMatchApi where

import Prelude

import Affjax (printError)
import Affjax.Web as AW
import Affjax.ResponseFormat as ResponseFormat
import Affjax.StatusCode (StatusCode(..))
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode (class DecodeJson, JsonDecodeError, decodeJson, (.:), printJsonDecodeError)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Effect.Aff (Aff)
import Effect.Class (liftEffect)
import Utils.Logger (log)
import Types.CurrentMatch (CurrentMatch)

-- | Fetch current match for a user
fetchCurrentMatch :: Int -> Aff (Either String (Maybe CurrentMatch))
fetchCurrentMatch userId = do
  let url = "http://localhost:3001/api/overlay/users/" <> show userId <> "/match/current"

  -- Use Affjax to fetch
  affjaxResult <- AW.get ResponseFormat.json url

  case affjaxResult of
    Left err -> do
      let errMsg = printError err
      liftEffect $ log $ "[CurrentMatchApi] Network error: " <> errMsg
      pure $ Left $ "Network error: " <> errMsg

    Right response -> do
      case response.status of
        StatusCode 404 -> do
          pure $ Right Nothing

        StatusCode 200 -> do
          case decodeApiResponse response.body of
            Left err -> do
              let errMsg = printJsonDecodeError err
              liftEffect $ log $ "[CurrentMatchApi] Decode error: " <> errMsg
              pure $ Left errMsg
            Right decoded -> do
              pure $ Right decoded

        _ -> do
          liftEffect $ log $ "[CurrentMatchApi] HTTP error: " <> show response.status
          pure $ Left $ "HTTP error: " <> show response.status

-- | Decode API response with success/data/error structure
decodeApiResponse :: Json -> Either JsonDecodeError (Maybe CurrentMatch)
decodeApiResponse json = do
  obj <- decodeJson json
  success <- obj .: "success"
  if success
    then do
      -- Try to decode data - it might be null (no current match) or a CurrentMatch object
      dataJson <- obj .: "data"
      case decodeJson dataJson of
        Left _ -> Right Nothing -- data is null or invalid - no current match
        Right match -> Right (Just match)
    else do
      -- Error case - just return Nothing for now
      -- (decodeJson will fail with proper error if structure is wrong)
      Right Nothing
