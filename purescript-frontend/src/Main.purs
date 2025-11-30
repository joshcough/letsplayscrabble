-- | Main entry point for PureScript frontend
module Main where

import Prelude

import Component.Router as Router
import Effect (Effect)
import Effect.Class (liftEffect)
import Effect.Class.Console as Console
import Halogen as H
import Halogen.Aff as HA
import Halogen.VDom.Driver (runUI)
import Route (routeCodec)
import Routing.Duplex (parse)
import Routing.Hash (matchesWith)

-- | Main entry point
-- | Renders the Router component and sets up hash routing
main :: Effect Unit
main = do
  Console.log "[Main] Starting router..."
  HA.runHalogenAff do
    body <- HA.awaitBody
    liftEffect $ Console.log "[Main] Got body, mounting router"
    io <- runUI Router.component unit body
    liftEffect $ Console.log "[Main] Router mounted"

    -- Set up hash change listener
    liftEffect $ Console.log "[Main] Setting up hash change listener"
    liftEffect $ void $ matchesWith (parse routeCodec) \old new -> do
      Console.log "[Main] ========================================="
      Console.log "[Main] HASH CHANGE EVENT FIRED!"
      Console.log $ "[Main] Hash changed from " <> show old <> " to " <> show new
      Console.log "[Main] ========================================="
      HA.runHalogenAff $ void $ io.query $ H.mkTell $ Router.Navigate new
    liftEffect $ Console.log "[Main] Hash change listener set up"
