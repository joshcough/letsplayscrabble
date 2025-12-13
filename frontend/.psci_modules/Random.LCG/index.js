import * as Data_EuclideanRing from "../Data.EuclideanRing/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Int from "../Data.Int/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Number from "../Data.Number/index.js";
import * as Data_Ord from "../Data.Ord/index.js";
import * as Data_Show from "../Data.Show/index.js";
import * as Effect from "../Effect/index.js";
import * as Effect_Random from "../Effect.Random/index.js";
var show = /* #__PURE__ */ Data_Show.show(Data_Show.showInt);
var mod = /* #__PURE__ */ Data_EuclideanRing.mod(Data_EuclideanRing.euclideanRingInt);
var fromJust = /* #__PURE__ */ Data_Maybe.fromJust();
var compare = /* #__PURE__ */ Data_Ord.compare(Data_Ord.ordInt);

// | A seed for the linear congruential generator. We omit a `Semiring`
// | instance because there is no `zero` value, as 0 is not an acceptable
// | seed for the generator.
var Seed = function (x) {
    return x;
};
var unSeed = function (v) {
    return v;
};
var showSeed = {
    show: function (v) {
        return "Seed " + show(v);
    }
};

// | The minimum permissible Seed value.
var seedMin = 1;

// | The *modulus*: a magic constant for the linear congruential generator.
// | It is equal to 2^31 - 1, a Mersenne prime. It is useful for this value to
// | be prime, because then the requirement of the initial seed being coprime
// | to the modulus is satisfied when the seed is between 1 and lcgM - 1.
var lcgM = 2147483647;

// | The maximum permissible Seed value.
var seedMax = /* #__PURE__ */ (function () {
    return lcgM - 1 | 0;
})();
var mkSeed = function (x) {
    var ensureBetween = function (min) {
        return function (max) {
            return function (n) {
                var rangeSize = max - min | 0;
                var n$prime = mod(n)(rangeSize);
                var $25 = n$prime < min;
                if ($25) {
                    return n$prime + max | 0;
                };
                return n$prime;
            };
        };
    };
    return ensureBetween(seedMin)(seedMax)(x);
};

// | Create a random seed
var randomSeed = /* #__PURE__ */ Data_Functor.map(Effect.functorEffect)(mkSeed)(/* #__PURE__ */ Effect_Random.randomInt(seedMin)(seedMax));

// | The *increment*: a magic constant for the linear congruential generator
var lcgC = 0;

// | The *multiplier*: a magic constant for the linear congruential generator
var lcgA = 48271;

// | Perturb a seed value
// Note that `Int` operations are truncated to 32-bits, so we convert to
// `Number` for this calculation to avoid overflow errors.
var lcgPerturb = function (d) {
    return function (v) {
        return fromJust(Data_Int.fromNumber(Data_Number.remainder(Data_Int.toNumber(lcgA) * Data_Int.toNumber(v) + Data_Int.toNumber(d))(Data_Int.toNumber(lcgM))));
    };
};

// | Step the linear congruential generator
var lcgNext = /* #__PURE__ */ lcgPerturb(lcgC);
var eqSeed = {
    eq: function (x) {
        return function (y) {
            return x === y;
        };
    }
};
var ordSeed = {
    compare: function (x) {
        return function (y) {
            return compare(x)(y);
        };
    },
    Eq0: function () {
        return eqSeed;
    }
};
export {
    mkSeed,
    unSeed,
    randomSeed,
    lcgA,
    lcgC,
    lcgM,
    lcgNext,
    lcgPerturb,
    eqSeed,
    ordSeed,
    showSeed
};
