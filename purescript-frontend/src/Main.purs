-- | Main entry point for PureScript frontend
module Main where

import Prelude

import Component.Router as Router
import Effect (Effect)
import Effect.Aff (launchAff_)
import Effect.Class (liftEffect)
import Halogen as H
import Halogen.Aff as HA
import Halogen.VDom.Driver (runUI)
import Route (routeCodec)
import Routing.Duplex (parse)
import Routing.Hash (matchesWith)

-- | Main entry point
-- | Renders the Router component and sets up hash routing
main :: Effect Unit
main = HA.runHalogenAff do
  body <- HA.awaitBody
  io <- runUI Router.component unit body

  -- Set up hash change listener
  void $ liftEffect $ matchesWith (parse routeCodec) \_ new ->
    launchAff_ $ void $ io.query $ H.mkTell $ Router.Navigate new
