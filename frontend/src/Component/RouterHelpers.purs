-- | Pure helper functions for Router component
-- | Extracted for testability
module Component.RouterHelpers where

import Data.Maybe (Maybe(..))
import Domain.Types (TournamentId(..))
import Route (Route(..))
import Stats.OverlayLogic (TournamentSubscription)
import Stats.OverlayLogic as OverlayLogic

-- | Extract TournamentSubscription from route parameters
-- | Returns Nothing if route doesn't contain valid subscription parameters
createSubscriptionFromRoute :: Route -> Maybe TournamentSubscription
createSubscriptionFromRoute route =
  case route of
    Standings params -> createSubscription params.tournamentId params.divisionName
    HighScores params -> createSubscription params.tournamentId params.divisionName
    RatingGain params -> createSubscription params.tournamentId params.divisionName
    ScoringLeaders params -> createSubscription params.tournamentId params.divisionName
    _ -> Nothing

-- | Create subscription from optional tournament ID and division name
-- | Both present: SpecificTournament
-- | Both absent: CurrentMatch
-- | Mixed: Nothing (invalid)
createSubscription :: Maybe Int -> Maybe String -> Maybe TournamentSubscription
createSubscription maybeTournamentId maybeDivisionName =
  case maybeTournamentId, maybeDivisionName of
    Just tid, Just divName -> Just (OverlayLogic.SpecificTournament { tournamentId: TournamentId tid, divisionName: divName })
    Nothing, Nothing -> Just OverlayLogic.CurrentMatch
    _, _ -> Nothing  -- Invalid combination

-- | Extract userId from route parameters
-- | Returns Nothing if route doesn't have userId
getUserIdFromRoute :: Route -> Maybe Int
getUserIdFromRoute route =
  case route of
    Standings params -> Just params.userId
    HighScores params -> Just params.userId
    RatingGain params -> Just params.userId
    ScoringLeaders params -> Just params.userId
    CrossTablesPlayerProfile params -> Just params.userId
    HeadToHead params -> Just params.userId
    MiscOverlay params -> Just params.userId
    TournamentStats params -> Just params.userId
    _ -> Nothing
