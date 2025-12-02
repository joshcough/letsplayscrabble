module Test.Main where

import Prelude

import Effect (Effect)
import Effect.Aff (launchAff_)
import Test.Spec (describe)
import Test.Spec.Reporter.Console (consoleReporter)
import Test.Spec.Runner (runSpec)
import Test.Types.CurrentMatchSpec as CurrentMatchSpec
import Test.Domain.TypesSpec as DomainTypesSpec
import Test.PubSub.IntegrationSpec as PubSubSpec

main :: Effect Unit
main = launchAff_ $ runSpec [consoleReporter] do
  describe "JSON Codec Round Trip Tests" do
    CurrentMatchSpec.spec
    DomainTypesSpec.spec

  PubSubSpec.spec
