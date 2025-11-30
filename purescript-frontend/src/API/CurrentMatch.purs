-- | API calls for current match operations
module API.CurrentMatch where

import Prelude

import Affjax (printError)
import Affjax.RequestBody as RequestBody
import Affjax.RequestHeader (RequestHeader(..))
import Affjax.StatusCode (StatusCode(..))
import Affjax.Web as AW
import Affjax.ResponseFormat as ResponseFormat
import Data.HTTP.Method (Method(..))
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode (decodeJson, printJsonDecodeError, (.:), (.:?))
import Data.Argonaut.Encode (encodeJson, (:=), (~>))
import Data.Bifunctor (lmap)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Data.Traversable (traverse)
import Domain.Types (TournamentId(..), DivisionId(..), PlayerId(..), GameId(..), PairingId(..), XTId(..), Tournament, Division, Player, Game, HeadToHeadGame, CurrentMatch, CreateCurrentMatch)
import Effect.Aff (Aff)
import Effect.Class (liftEffect)
import Utils.Auth as Auth

-- ============================================================================
-- DECODERS FOR HIERARCHICAL TOURNAMENT DATA
-- ============================================================================

-- | Decode a Player
decodePlayer :: Json -> Either String Player
decodePlayer json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  id <- PlayerId <$> (lmap printJsonDecodeError $ obj .: "id")
  seed <- lmap printJsonDecodeError $ obj .: "seed"
  name <- lmap printJsonDecodeError $ obj .: "name"
  initialRating <- lmap printJsonDecodeError $ obj .: "initialRating"
  photo <- lmap printJsonDecodeError $ obj .: "photo"
  ratingsHistory <- lmap printJsonDecodeError $ obj .: "ratingsHistory"
  xtid <- (map XTId) <$> (lmap printJsonDecodeError $ obj .: "xtid")
  xtData <- lmap printJsonDecodeError $ obj .: "xtData"
  pure { id, seed, name, initialRating, photo, ratingsHistory, xtid, xtData }

-- | Decode a Game
decodeGame :: Json -> Either String Game
decodeGame json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  id <- GameId <$> (lmap printJsonDecodeError $ obj .: "id")
  player1Id <- PlayerId <$> (lmap printJsonDecodeError $ obj .: "player1Id")
  player2Id <- PlayerId <$> (lmap printJsonDecodeError $ obj .: "player2Id")
  roundNumber <- lmap printJsonDecodeError $ obj .: "roundNumber"
  player1Score <- lmap printJsonDecodeError $ obj .: "player1Score"
  player2Score <- lmap printJsonDecodeError $ obj .: "player2Score"
  isBye <- lmap printJsonDecodeError $ obj .: "isBye"
  pairingId <- (map PairingId) <$> (lmap printJsonDecodeError $ obj .: "pairingId")
  pure { id, player1Id, player2Id, roundNumber, player1Score, player2Score, isBye, pairingId }

-- | Decode a HeadToHeadGame
decodeHeadToHeadGame :: Json -> Either String HeadToHeadGame
decodeHeadToHeadGame json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  gameid <- lmap printJsonDecodeError $ obj .: "gameid"
  date <- lmap printJsonDecodeError $ obj .: "date"
  tourneyname <- lmap printJsonDecodeError $ obj .:? "tourneyname"
  player1Obj <- lmap printJsonDecodeError $ obj .: "player1"
  player1 <- do
    playerid <- lmap printJsonDecodeError $ player1Obj .: "playerid"
    name <- lmap printJsonDecodeError $ player1Obj .: "name"
    score <- lmap printJsonDecodeError $ player1Obj .: "score"
    oldrating <- lmap printJsonDecodeError $ player1Obj .: "oldrating"
    newrating <- lmap printJsonDecodeError $ player1Obj .: "newrating"
    position <- lmap printJsonDecodeError $ player1Obj .:? "position"
    pure { playerid, name, score, oldrating, newrating, position }
  player2Obj <- lmap printJsonDecodeError $ obj .: "player2"
  player2 <- do
    playerid <- lmap printJsonDecodeError $ player2Obj .: "playerid"
    name <- lmap printJsonDecodeError $ player2Obj .: "name"
    score <- lmap printJsonDecodeError $ player2Obj .: "score"
    oldrating <- lmap printJsonDecodeError $ player2Obj .: "oldrating"
    newrating <- lmap printJsonDecodeError $ player2Obj .: "newrating"
    position <- lmap printJsonDecodeError $ player2Obj .:? "position"
    pure { playerid, name, score, oldrating, newrating, position }
  annotated <- lmap printJsonDecodeError $ obj .:? "annotated"
  pure { gameid, date, tourneyname, player1, player2, annotated }

-- | Decode a Division
decodeDivision :: Json -> Either String Division
decodeDivision json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  id <- DivisionId <$> (lmap printJsonDecodeError $ obj .: "id")
  name <- lmap printJsonDecodeError $ obj .: "name"
  playersJson <- lmap printJsonDecodeError $ obj .: "players"
  players <- traverse decodePlayer playersJson
  gamesJson <- lmap printJsonDecodeError $ obj .: "games"
  games <- traverse decodeGame gamesJson
  headToHeadGamesJson <- lmap printJsonDecodeError $ obj .: "headToHeadGames"
  headToHeadGames <- traverse decodeHeadToHeadGame headToHeadGamesJson
  pure { id, name, players, games, headToHeadGames }

-- | Decode a full hierarchical Tournament
decodeTournament :: Json -> Either String Tournament
decodeTournament json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  id <- TournamentId <$> (lmap printJsonDecodeError $ obj .: "id")
  name <- lmap printJsonDecodeError $ obj .: "name"
  city <- lmap printJsonDecodeError $ obj .: "city"
  year <- lmap printJsonDecodeError $ obj .: "year"
  lexicon <- lmap printJsonDecodeError $ obj .: "lexicon"
  longFormName <- lmap printJsonDecodeError $ obj .: "longFormName"
  dataUrl <- lmap printJsonDecodeError $ obj .: "dataUrl"
  divisionsJson <- lmap printJsonDecodeError $ obj .: "divisions"
  divisions <- traverse decodeDivision divisionsJson
  theme <- lmap printJsonDecodeError $ obj .: "theme"
  transparentBackground <- lmap printJsonDecodeError $ obj .: "transparentBackground"
  pure { id, name, city, year, lexicon, longFormName, dataUrl, divisions, theme, transparentBackground }

-- | Decode CurrentMatch
decodeCurrentMatch :: Json -> Either String CurrentMatch
decodeCurrentMatch json = do
  obj <- lmap printJsonDecodeError $ decodeJson json
  tournamentId <- TournamentId <$> (lmap printJsonDecodeError $ obj .: "tournamentId")
  divisionId <- DivisionId <$> (lmap printJsonDecodeError $ obj .: "divisionId")
  divisionName <- lmap printJsonDecodeError $ obj .: "divisionName"
  round <- lmap printJsonDecodeError $ obj .: "round"
  pairingId <- PairingId <$> (lmap printJsonDecodeError $ obj .: "pairingId")
  updatedAt <- lmap printJsonDecodeError $ obj .: "updatedAt"
  pure { tournamentId, divisionId, divisionName, round, pairingId, updatedAt }

-- ============================================================================
-- API FUNCTIONS
-- ============================================================================

-- | Get full hierarchical tournament data
getTournament :: Int -> Int -> Aff (Either String Tournament)
getTournament userId tournamentId = do
  let url = "http://localhost:3001/api/public/users/" <> show userId <> "/tournaments/" <> show tournamentId
  result <- AW.request $ AW.defaultRequest
    { url = url
    , method = Left GET
    , responseFormat = ResponseFormat.json
    }

  case result of
    Left err -> pure $ Left $ "Network error: " <> printError err
    Right response -> pure $ do
      respObj <- lmap printJsonDecodeError $ decodeJson response.body
      success <- lmap printJsonDecodeError $ respObj .: "success"
      if not success then do
        errMsg <- lmap printJsonDecodeError $ respObj .: "error"
        Left errMsg
      else do
        tournamentData <- lmap printJsonDecodeError $ respObj .: "data"
        decodeTournament tournamentData

-- | Get current match
getCurrentMatch :: Int -> Aff (Either String (Maybe CurrentMatch))
getCurrentMatch userId = do
  let url = "http://localhost:3001/api/overlay/users/" <> show userId <> "/match/current"
  result <- AW.request $ AW.defaultRequest
    { url = url
    , method = Left GET
    , responseFormat = ResponseFormat.json
    }

  case result of
    Left err -> pure $ Left $ "Network error: " <> printError err
    Right response ->
      if response.status == StatusCode 404 then
        pure $ Right Nothing
      else pure $ do
        respObj <- lmap printJsonDecodeError $ decodeJson response.body
        success <- lmap printJsonDecodeError $ respObj .: "success"
        if not success then
          Right Nothing
        else do
          matchData <- lmap printJsonDecodeError $ respObj .: "data"
          Just <$> decodeCurrentMatch matchData

-- | Set current match
setCurrentMatch :: CreateCurrentMatch -> Aff (Either String CurrentMatch)
setCurrentMatch request = do
  maybeToken <- liftEffect Auth.getAuthToken
  case maybeToken of
    Nothing -> pure $ Left "Not authenticated"
    Just token -> do
      let headers = [ RequestHeader "Authorization" ("Bearer " <> token)
                    , RequestHeader "Content-Type" "application/json"
                    ]
      let url = "http://localhost:3001/api/admin/match/current"
      let TournamentId tid = request.tournamentId
      let DivisionId did = request.divisionId
      let PairingId pid = request.pairingId
      let body =
            "tournamentId" := tid
            ~> "divisionId" := did
            ~> "round" := request.round
            ~> "pairingId" := pid
            ~> encodeJson {}
      result <- AW.request $ AW.defaultRequest
        { url = url
        , method = Left POST
        , headers = headers
        , content = Just $ RequestBody.json body
        , responseFormat = ResponseFormat.json
        }

      case result of
        Left err -> pure $ Left $ "Network error: " <> printError err
        Right response -> pure $ do
          respObj <- lmap printJsonDecodeError $ decodeJson response.body
          success <- lmap printJsonDecodeError $ respObj .: "success"
          if not success then do
            errMsg <- lmap printJsonDecodeError $ respObj .: "error"
            Left errMsg
          else do
            matchData <- lmap printJsonDecodeError $ respObj .: "data"
            decodeCurrentMatch matchData
