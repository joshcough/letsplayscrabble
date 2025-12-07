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
import Test.Stats.TournamentStatsSpec as TournamentStatsSpec
import Test.Stats.HeadToHeadStatsSpec as HeadToHeadStatsSpec
import Test.Stats.OverlayLogicSpec as OverlayLogicSpec
import Test.Utils.FormatSpec as FormatSpec
import Test.Component.Overlay.BaseOverlaySpec as BaseOverlaySpec
import Test.Component.Overlay.RatingGainSpec as RatingGainSpec
import Test.Component.Overlay.HighScoresSpec as HighScoresSpec
import Test.Component.Overlay.ScoringLeadersSpec as ScoringLeadersSpec
import Test.Component.Overlay.StandingsSpec as StandingsSpec
import Test.Component.RouterHelpersSpec as RouterHelpersSpec

main :: Effect Unit
main = launchAff_ $ runSpec [consoleReporter] do
  describe "JSON Codec Round Trip Tests" do
    CurrentMatchSpec.spec
    DomainTypesSpec.spec

  PubSubSpec.spec

  TournamentStatsSpec.spec
  HeadToHeadStatsSpec.spec
  OverlayLogicSpec.spec

  FormatSpec.spec

  BaseOverlaySpec.spec
  RatingGainSpec.spec
  HighScoresSpec.spec
  ScoringLeadersSpec.spec
  StandingsSpec.spec
  RouterHelpersSpec.spec
