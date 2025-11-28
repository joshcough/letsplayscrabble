-- | Worker page entry point
module WorkerMain where

import Prelude

import Component.WorkerPage as WorkerPage
import Effect (Effect)
import Effect.Class (liftEffect)
import Effect.Console (log)
import Halogen.Aff as HA
import Halogen.VDom.Driver (runUI)

main :: Effect Unit
main = do
  log "[WorkerMain] Starting worker page"
  HA.runHalogenAff do
    liftEffect $ log "[WorkerMain] Awaiting body"
    body <- HA.awaitBody
    liftEffect $ log "[WorkerMain] Running WorkerPage component"
    _ <- runUI WorkerPage.component unit body
    liftEffect $ log "[WorkerMain] WorkerPage component mounted"
