module Test.Component.WorkerPageHelpersSpec where

import Prelude

import Component.WorkerPageHelpers (getStatusColor)
import Data.Maybe (Maybe(..))
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual)

spec :: Spec Unit
spec = do
  describe "WorkerPageHelpers" do
    describe "getStatusColor" do
      it "returns red when error is present" do
        getStatusColor (Just "Connection failed") "Connected" `shouldEqual` "#ff4444"
        getStatusColor (Just "Timeout") "Initializing..." `shouldEqual` "#ff4444"
        getStatusColor (Just "Error") "Disconnected" `shouldEqual` "#ff4444"

      it "returns green when connected with no error" do
        getStatusColor Nothing "Connected" `shouldEqual` "#44ff44"

      it "returns orange when connecting or initializing with no error" do
        getStatusColor Nothing "Connecting" `shouldEqual` "#ffaa44"
        getStatusColor Nothing "Initializing..." `shouldEqual` "#ffaa44"

      it "returns gray for other states with no error" do
        getStatusColor Nothing "Disconnected" `shouldEqual` "#666666"
        getStatusColor Nothing "Unknown" `shouldEqual` "#666666"
        getStatusColor Nothing "" `shouldEqual` "#666666"
