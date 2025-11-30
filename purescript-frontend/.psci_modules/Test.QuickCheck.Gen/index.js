// | This module defines the random generator monad used by the `Test.QuickCheck`
// | module, as well as helper functions for constructing random generators.
import * as $foreign from "./foreign.js";
import * as Control_Applicative from "../Control.Applicative/index.js";
import * as Control_Apply from "../Control.Apply/index.js";
import * as Control_Bind from "../Control.Bind/index.js";
import * as Control_Monad_Rec_Class from "../Control.Monad.Rec.Class/index.js";
import * as Control_Monad_State from "../Control.Monad.State/index.js";
import * as Control_Monad_State_Class from "../Control.Monad.State.Class/index.js";
import * as Control_Monad_State_Trans from "../Control.Monad.State.Trans/index.js";
import * as Data_Array from "../Data.Array/index.js";
import * as Data_Array_NonEmpty from "../Data.Array.NonEmpty/index.js";
import * as Data_Array_NonEmpty_Internal from "../Data.Array.NonEmpty.Internal/index.js";
import * as Data_Boolean from "../Data.Boolean/index.js";
import * as Data_Bounded from "../Data.Bounded/index.js";
import * as Data_Enum from "../Data.Enum/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Identity from "../Data.Identity/index.js";
import * as Data_Int from "../Data.Int/index.js";
import * as Data_List from "../Data.List/index.js";
import * as Data_List_Types from "../Data.List.Types/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Monoid_Additive from "../Data.Monoid.Additive/index.js";
import * as Data_Newtype from "../Data.Newtype/index.js";
import * as Data_Number from "../Data.Number/index.js";
import * as Data_Ord from "../Data.Ord/index.js";
import * as Data_Semigroup_Foldable from "../Data.Semigroup.Foldable/index.js";
import * as Data_Semiring from "../Data.Semiring/index.js";
import * as Data_Tuple from "../Data.Tuple/index.js";
import * as Data_Unfoldable from "../Data.Unfoldable/index.js";
import * as Data_Unit from "../Data.Unit/index.js";
import * as Random_LCG from "../Random.LCG/index.js";
var monadStateStateT = /* #__PURE__ */ Control_Monad_State_Trans.monadStateStateT(Data_Identity.monadIdentity);
var state = /* #__PURE__ */ Control_Monad_State_Class.state(monadStateStateT);
var map = /* #__PURE__ */ Data_Functor.map(Data_Tuple.functorTuple);
var bindStateT = /* #__PURE__ */ Control_Monad_State_Trans.bindStateT(Data_Identity.monadIdentity);
var discard = /* #__PURE__ */ Control_Bind.discard(Control_Bind.discardUnit)(bindStateT);
var functorStateT = /* #__PURE__ */ Control_Monad_State_Trans.functorStateT(Data_Identity.functorIdentity);
var $$void = /* #__PURE__ */ Data_Functor["void"](functorStateT);
var modify = /* #__PURE__ */ Control_Monad_State_Class.modify(monadStateStateT);
var toUnfoldable = /* #__PURE__ */ Data_List.toUnfoldable(Data_Unfoldable.unfoldableArray);
var mul = /* #__PURE__ */ Data_Semiring.mul(Data_Semiring.semiringNumber);
var min = /* #__PURE__ */ Data_Ord.min(Data_Ord.ordNumber);
var max = /* #__PURE__ */ Data_Ord.max(Data_Ord.ordNumber);
var add = /* #__PURE__ */ Data_Semiring.add(Data_Semiring.semiringNumber);
var unwrap = /* #__PURE__ */ Data_Newtype.unwrap();
var foldMap1 = /* #__PURE__ */ Data_Semigroup_Foldable.foldMap1(Data_Array_NonEmpty_Internal.foldable1NonEmptyArray)(/* #__PURE__ */ Data_Monoid_Additive.semigroupAdditive(Data_Semiring.semiringNumber));
var unsafeIndex = /* #__PURE__ */ Data_Array_NonEmpty.unsafeIndex();
var fromJust = /* #__PURE__ */ Data_Maybe.fromJust();
var top = /* #__PURE__ */ Data_Bounded.top(Data_Bounded.boundedInt);
var map1 = /* #__PURE__ */ Data_Functor.map(Data_Functor.functorArray);
var comparing = /* #__PURE__ */ Data_Ord.comparing(Data_Ord.ordInt);

// | The random generator monad
// |
// | `Gen` is a state monad which encodes a linear congruential generator.
var Gen = function (x) {
    return x;
};

// | Exposes the underlying State implementation.
var unGen = function (v) {
    return v;
};

// | Run a random generator
var runGen = function ($103) {
    return Control_Monad_State.runState(unGen($103));
};

// | Create a random generator which uses the generator state explicitly.
var stateful = function (f) {
    return state(function (s) {
        return runGen(f(s))(s);
    });
};

// | Create a random generator which depends on the size parameter.
var sized = function (f) {
    return stateful(function (s) {
        return f(s.size);
    });
};

// | Modify a random generator by setting a new random seed.
var variant = function (n) {
    return function (g) {
        return state(function (s) {
            return runGen(g)({
                size: s.size,
                newSeed: n
            });
        });
    };
};

// | Modify a random generator by setting a new size parameter.
var resize = function (sz) {
    return function (g) {
        return state(function (v) {
            return map(function (v1) {
                return {
                    newSeed: v1.newSeed,
                    size: v.size
                };
            })(runGen(g)({
                newSeed: v.newSeed,
                size: sz
            }));
        });
    };
};
var replicateMRec = function (dictMonadRec) {
    var Monad0 = dictMonadRec.Monad0();
    var pure2 = Control_Applicative.pure(Monad0.Applicative0());
    var mapFlipped = Data_Functor.mapFlipped(((Monad0.Bind1()).Apply0()).Functor0());
    var tailRecM1 = Control_Monad_Rec_Class.tailRecM(dictMonadRec);
    return function (v) {
        return function (v1) {
            if (v <= 0) {
                return pure2(Data_List_Types.Nil.value);
            };
            var go = function (v2) {
                if (v2.value1 === 0) {
                    return pure2(new Control_Monad_Rec_Class.Done(v2.value0));
                };
                return mapFlipped(v1)(function (x) {
                    return new Control_Monad_Rec_Class.Loop(new Data_Tuple.Tuple(new Data_List_Types.Cons(x, v2.value0), v2.value1 - 1 | 0));
                });
            };
            return tailRecM1(go)(new Data_Tuple.Tuple(Data_List_Types.Nil.value, v));
        };
    };
};

// | Create a random generator for a function type.
var repeatable = function (f) {
    return state(function (s) {
        return new Data_Tuple.Tuple(function (a) {
            return Data_Tuple.fst(runGen(f(a))(s));
        }, {
            size: s.size,
            newSeed: Random_LCG.lcgNext(s.newSeed)
        });
    });
};

// | Perturb a random generator by modifying the current seed
var perturbGen = function (n) {
    return function (gen) {
        return discard($$void(modify(function (s) {
            var $91 = {};
            for (var $92 in s) {
                if ({}.hasOwnProperty.call(s, $92)) {
                    $91[$92] = s[$92];
                };
            };
            $91.newSeed = Random_LCG.lcgPerturb($foreign.float32ToInt32(n))(s.newSeed);
            return $91;
        })))(function () {
            return unGen(gen);
        });
    };
};
var monadRecGen = /* #__PURE__ */ Control_Monad_State_Trans.monadRecStateT(Control_Monad_Rec_Class.monadRecIdentity);
var tailRecM = /* #__PURE__ */ Control_Monad_Rec_Class.tailRecM(monadRecGen);
var monadGen = /* #__PURE__ */ Control_Monad_State_Trans.monadStateT(Data_Identity.monadIdentity);

// | Create a random generator which generates a list of random values of the specified size.
var listOf = /* #__PURE__ */ replicateMRec(monadRecGen);

// | A random generator which simply outputs the current seed
var lcgStep = /* #__PURE__ */ (function () {
    var f = function (s) {
        return new Data_Tuple.Tuple(Random_LCG.unSeed(s.newSeed), (function () {
            var $94 = {};
            for (var $95 in s) {
                if ({}.hasOwnProperty.call(s, $95)) {
                    $94[$95] = s[$95];
                };
            };
            $94.newSeed = Random_LCG.lcgNext(s.newSeed);
            return $94;
        })());
    };
    return state(f);
})();
var lazyGen = Control_Monad_State_Trans.lazyStateT;
var functorGen = functorStateT;
var map2 = /* #__PURE__ */ Data_Functor.map(functorGen);

// | A random generator which approximates a uniform random variable on `[0, 1]`
var uniform = /* #__PURE__ */ map2(function (n) {
    return Data_Int.toNumber(n) / Data_Int.toNumber(Random_LCG.lcgM);
})(lcgStep);

// | Create a random generator which generates a vector of random values of a specified size.
var vectorOf = function (k) {
    return function (g) {
        return map2(toUnfoldable)(listOf(k)(g));
    };
};

// | Run a random generator, keeping only the randomly-generated result
var evalGen = function ($104) {
    return Control_Monad_State.evalState(unGen($104));
};

// | Generate a single value using a randomly generated seed.
var randomSampleOne = function (gen) {
    return function __do() {
        var seed = Random_LCG.randomSeed();
        return evalGen(gen)({
            newSeed: seed,
            size: 10
        });
    };
};

// | Sample a random generator
var sample = function (seed) {
    return function (sz) {
        return function (g) {
            return evalGen(vectorOf(sz)(g))({
                newSeed: seed,
                size: sz
            });
        };
    };
};

// | Sample a random generator, using a randomly generated seed
var randomSample$prime = function (n) {
    return function (g) {
        return function __do() {
            var seed = Random_LCG.randomSeed();
            return sample(seed)(n)(g);
        };
    };
};

// | Get a random sample of 10 values. For a single value, use `randomSampleOne`.
var randomSample = /* #__PURE__ */ randomSample$prime(10);

// | Create a random generator which samples a range of `Number`s i
// | with uniform probability.
var choose = function (a) {
    return function (b) {
        var unscale = function (v) {
            return v * 2.0;
        };
        var scale = function (v) {
            return v * 0.5;
        };
        var min$prime = scale(min(a)(b));
        var max$prime = scale(max(a)(b));
        return map2((function () {
            var $105 = add(min$prime);
            var $106 = mul(max$prime - min$prime);
            return function ($107) {
                return unscale($105($106($107)));
            };
        })())(uniform);
    };
};
var bindGen = bindStateT;
var bind1 = /* #__PURE__ */ Control_Bind.bind(bindGen);

// | Create a random generator which selects and executes a random generator from
// | a non-empty, weighted list of random generators.
var frequency = function (xxs) {
    var total = unwrap(foldMap1(function ($108) {
        return Data_Monoid_Additive.Additive(Data_Tuple.fst($108));
    })(xxs));
    var $$default = Data_Tuple.snd(Data_Array_NonEmpty.head(xxs));
    var pick = function ($copy_i) {
        return function ($copy_n) {
            var $tco_var_i = $copy_i;
            var $tco_done = false;
            var $tco_result;
            function $tco_loop(i, n) {
                var v = Data_Array_NonEmpty.index(xxs)(i);
                if (v instanceof Data_Maybe.Nothing) {
                    $tco_done = true;
                    return $$default;
                };
                if (v instanceof Data_Maybe.Just) {
                    if (n <= v.value0.value0) {
                        $tco_done = true;
                        return v.value0.value1;
                    };
                    if (Data_Boolean.otherwise) {
                        $tco_var_i = i + 1 | 0;
                        $copy_n = n - v.value0.value0;
                        return;
                    };
                };
                throw new Error("Failed pattern match at Test.QuickCheck.Gen (line 168, column 16 - line 172, column 44): " + [ v.constructor.name ]);
            };
            while (!$tco_done) {
                $tco_result = $tco_loop($tco_var_i, $copy_n);
            };
            return $tco_result;
        };
    };
    return bind1(choose(0)(total))(function (n) {
        return pick(0)(n);
    });
};
var applyGen = /* #__PURE__ */ Control_Monad_State_Trans.applyStateT(Data_Identity.monadIdentity);
var apply = /* #__PURE__ */ Control_Apply.apply(applyGen);

// guaranteed a <= b
var chooseInt$prime = function (a) {
    return function (b) {
        var numB = Data_Int.toNumber(b);
        var numA = Data_Int.toNumber(a);
        var clamp = function (x) {
            return numA + Data_Number.remainder(x)((numB - numA) + 1);
        };
        var choose31BitPosNumber = map2(Data_Int.toNumber)(lcgStep);
        var choose32BitPosNumber = apply(map2(add)(choose31BitPosNumber))(map2(mul(2.0))(choose31BitPosNumber));
        return map2(function ($109) {
            return Data_Int.floor(clamp($109));
        })(choose32BitPosNumber);
    };
};

// | Create a random generator which chooses uniformly distributed
// | integers from the closed interval `[a, b]`.
// | Note that very large intervals will cause a loss of uniformity.
var chooseInt = function (a) {
    return function (b) {
        var $101 = a <= b;
        if ($101) {
            return chooseInt$prime(a)(b);
        };
        return chooseInt$prime(b)(a);
    };
};

// | Create a random generator which generates an array of random values.
var arrayOf = function (g) {
    return sized(function (n) {
        return bind1(chooseInt(0)(n))(function (k) {
            return vectorOf(k)(g);
        });
    });
};
var monadGenGen = {
    chooseInt: chooseInt,
    chooseFloat: choose,
    chooseBool: /* #__PURE__ */ map2(function (v) {
        return v < 0.5;
    })(uniform),
    resize: function (f) {
        return function (g) {
            return sized(function (s) {
                return resize(f(s))(g);
            });
        };
    },
    sized: sized,
    Monad0: function () {
        return monadGen;
    }
};

// | Create a random generator which selects and executes a random generator from
// | a non-empty array of random generators with uniform probability.
var oneOf = function (xs) {
    return bind1(chooseInt(0)(Data_Array_NonEmpty.length(xs) - 1 | 0))(function (n) {
        return unsafeIndex(xs)(n);
    });
};
var applicativeGen = /* #__PURE__ */ Control_Monad_State_Trans.applicativeStateT(Data_Identity.monadIdentity);
var pure1 = /* #__PURE__ */ Control_Applicative.pure(applicativeGen);

// | Create a random generator which generates a non-empty array of random values.
var arrayOf1 = function (g) {
    return sized(function (n) {
        return bind1(chooseInt(0)(n))(function (k) {
            return bind1(g)(function (x) {
                return bind1(vectorOf(k - 1 | 0)(g))(function (xs) {
                    return pure1(fromJust(Data_Array_NonEmpty.fromArray(Data_Array.cons(x)(xs))));
                });
            });
        });
    });
};

// | Create a random generator which selects a value from a non-empty array with
// | uniform probability.
var elements = function (xs) {
    return bind1(chooseInt(0)(Data_Array_NonEmpty.length(xs) - 1 | 0))(function (n) {
        return pure1(unsafeIndex(xs)(n));
    });
};

// | Create a random generator for a finite enumeration.
// | `toEnum i` must be well-behaved:
// | It must return a value wrapped in Just for all Ints between
// | `fromEnum bottom` and `fromEnum top`.
var $$enum = function (dictBoundedEnum) {
    var fromEnum = Data_Enum.fromEnum(dictBoundedEnum);
    var Bounded0 = dictBoundedEnum.Bounded0();
    var toEnum = Data_Enum.toEnum(dictBoundedEnum);
    return bind1(chooseInt(fromEnum(Data_Bounded.bottom(Bounded0)))(fromEnum(Data_Bounded.top(Bounded0))))(function (i) {
        return pure1(fromJust(toEnum(i)));
    });
};

// | Generate a random permutation of the given array
var shuffle = function (xs) {
    return bind1(vectorOf(Data_Array.length(xs))(chooseInt(0)(top)))(function (ns) {
        return pure1(map1(Data_Tuple.snd)(Data_Array.sortBy(comparing(Data_Tuple.fst))(Data_Array.zip(ns)(xs))));
    });
};

// | Ensure that a generator only produces values that match a predicate. If
// | the predicate always returns false the generator will loop forever.
var suchThat = function (gen) {
    return function (pred) {
        var go = function (v) {
            return bind1(gen)(function (a) {
                return pure1((function () {
                    var $102 = pred(a);
                    if ($102) {
                        return new Control_Monad_Rec_Class.Done(a);
                    };
                    return new Control_Monad_Rec_Class.Loop(Data_Unit.unit);
                })());
            });
        };
        return tailRecM(go)(Data_Unit.unit);
    };
};
var altGen = /* #__PURE__ */ Control_Monad_State_Trans.altStateT(Data_Identity.monadIdentity)(Data_Identity.altIdentity);
export {
    unGen,
    repeatable,
    stateful,
    variant,
    suchThat,
    sized,
    resize,
    choose,
    chooseInt,
    oneOf,
    frequency,
    arrayOf,
    arrayOf1,
    $$enum as enum,
    listOf,
    vectorOf,
    elements,
    shuffle,
    runGen,
    evalGen,
    perturbGen,
    uniform,
    sample,
    randomSample,
    randomSample$prime,
    randomSampleOne,
    functorGen,
    applyGen,
    applicativeGen,
    bindGen,
    monadGen,
    altGen,
    monadRecGen,
    lazyGen,
    monadGenGen
};
