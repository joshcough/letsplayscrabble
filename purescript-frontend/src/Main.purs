-- | Main entry point for PureScript frontend
module Main where

import Prelude

import Component.Standings as Standings
import Data.Maybe (fromMaybe)
import Domain.Types (TournamentId(..), DivisionId(..))
import Effect (Effect)
import Effect.Class (liftEffect)
import Effect.Console (log)
import Halogen.Aff as HA
import Halogen.VDom.Driver (runUI)
import Utils.UrlParams (parseUrlParams)

-- | Main entry point
-- | Renders the Standings component with URL parameters
main :: Effect Unit
main = HA.runHalogenAff do
  liftEffect $ log "[Main] Starting..."
  body <- HA.awaitBody
  liftEffect $ log "[Main] Got body"

  -- Parse URL parameters
  urlParams <- liftEffect parseUrlParams
  liftEffect $ log "[Main] Parsed URL params"

  -- Build input from URL params with sensible defaults
  let input =
        { userId: fromMaybe 1 urlParams.userId
        , tournamentId: TournamentId (fromMaybe 1 urlParams.tournamentId)
        , divisionId: map DivisionId urlParams.divisionId
        , divisionName: urlParams.divisionName
        }

  liftEffect $ log "[Main] Running Standings component"
  _ <- runUI Standings.component input body
  liftEffect $ log "[Main] Standings component mounted"
