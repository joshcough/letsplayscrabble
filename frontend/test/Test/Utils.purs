module Test.Utils where

import Prelude

import Data.Argonaut.Decode (class DecodeJson, JsonDecodeError, decodeJson)
import Data.Argonaut.Encode (class EncodeJson, encodeJson)
import Data.Either (Either(..))
import Effect.Aff (Aff)
import Test.Spec.Assertions (shouldEqual)

-- | Test that a value can be encoded to JSON and decoded back
roundTrip :: forall a. EncodeJson a => DecodeJson a => a -> Either JsonDecodeError a
roundTrip value = decodeJson (encodeJson value)

-- | Assert that a value can be round-tripped through JSON encoding/decoding
shouldRoundTrip :: forall a. Show a => Eq a => EncodeJson a => DecodeJson a => a -> Aff Unit
shouldRoundTrip value = roundTrip value `shouldEqual` Right value
