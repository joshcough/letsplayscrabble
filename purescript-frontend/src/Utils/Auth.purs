-- | Authentication utilities for managing auth tokens in localStorage
module Utils.Auth where

import Prelude

import Data.Maybe (Maybe(..))
import Effect (Effect)
import Web.HTML (window)
import Web.HTML.Window (localStorage)
import Web.Storage.Storage (getItem, setItem, removeItem)

-- | Auth token key in localStorage
authTokenKey :: String
authTokenKey = "auth_token"

-- | User ID key in localStorage
userIdKey :: String
userIdKey = "user_id"

-- | Username key in localStorage
usernameKey :: String
usernameKey = "username"

-- | Save auth data to localStorage
saveAuth :: { token :: String, userId :: Int, username :: String } -> Effect Unit
saveAuth auth = do
  w <- window
  storage <- localStorage w
  setItem authTokenKey auth.token storage
  setItem userIdKey (show auth.userId) storage
  setItem usernameKey auth.username storage

-- | Get auth token from localStorage
getAuthToken :: Effect (Maybe String)
getAuthToken = do
  w <- window
  storage <- localStorage w
  getItem authTokenKey storage

-- | Clear auth data from localStorage
clearAuth :: Effect Unit
clearAuth = do
  w <- window
  storage <- localStorage w
  removeItem authTokenKey storage
  removeItem userIdKey storage
  removeItem usernameKey storage

-- | Check if user is authenticated
isAuthenticated :: Effect Boolean
isAuthenticated = do
  token <- getAuthToken
  pure $ case token of
    Just _ -> true
    Nothing -> false

-- | Get user ID from localStorage
getUserId :: Effect (Maybe Int)
getUserId = do
  w <- window
  storage <- localStorage w
  maybeIdStr <- getItem userIdKey storage
  pure $ maybeIdStr >>= \idStr ->
    case readInt 10 idStr of
      Just id -> Just id
      Nothing -> Nothing

-- | Get username from localStorage
getUsername :: Effect (Maybe String)
getUsername = do
  w <- window
  storage <- localStorage w
  getItem usernameKey storage

foreign import readInt :: Int -> String -> Maybe Int
