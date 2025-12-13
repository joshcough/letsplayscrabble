// | This module is a partial port of the Haskell QuickCheck library.
// |
// | QuickCheck provides a way to write _property-based_ tests.
// |
// | The `Arbitrary` and `CoArbitrary` type classes allow us to create
// | random data with which we can run our tests. This module provides
// | instances of both classes for PureScript's core data structures,
// | as well as functions for writing new instances.
// |
// | Test suites can use the `quickCheck` and `quickCheckPure` functions
// | to test properties.
// |
// | For example:
// |
// | ```purescript
// | main = quickCheck \n -> n + 1 > n
// | ```
import * as Control_Applicative from "../Control.Applicative/index.js";
import * as Control_Bind from "../Control.Bind/index.js";
import * as Control_Monad_Rec_Class from "../Control.Monad.Rec.Class/index.js";
import * as Data_Boolean from "../Data.Boolean/index.js";
import * as Data_Eq from "../Data.Eq/index.js";
import * as Data_Foldable from "../Data.Foldable/index.js";
import * as Data_FoldableWithIndex from "../Data.FoldableWithIndex/index.js";
import * as Data_Function from "../Data.Function/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_List from "../Data.List/index.js";
import * as Data_List_Types from "../Data.List.Types/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Maybe_First from "../Data.Maybe.First/index.js";
import * as Data_Monoid from "../Data.Monoid/index.js";
import * as Data_Ord from "../Data.Ord/index.js";
import * as Data_Semigroup from "../Data.Semigroup/index.js";
import * as Data_Show from "../Data.Show/index.js";
import * as Data_Tuple from "../Data.Tuple/index.js";
import * as Effect from "../Effect/index.js";
import * as Effect_Console from "../Effect.Console/index.js";
import * as Effect_Exception from "../Effect.Exception/index.js";
import * as Random_LCG from "../Random.LCG/index.js";
import * as Test_QuickCheck_Arbitrary from "../Test.QuickCheck.Arbitrary/index.js";
import * as Test_QuickCheck_Gen from "../Test.QuickCheck.Gen/index.js";
var pure = /* #__PURE__ */ Control_Applicative.pure(Test_QuickCheck_Gen.applicativeGen);
var bind = /* #__PURE__ */ Control_Bind.bind(Test_QuickCheck_Gen.bindGen);
var append1 = /* #__PURE__ */ Data_Semigroup.append(Data_Maybe_First.semigroupFirst);
var mempty = /* #__PURE__ */ Data_Monoid.mempty(Data_Maybe_First.monoidFirst);
var show = /* #__PURE__ */ Data_Show.show(Data_Show.showInt);
var for_ = /* #__PURE__ */ Data_Foldable.for_(Effect.applicativeEffect)(Data_Foldable.foldableFirst);
var mempty1 = /* #__PURE__ */ Data_Monoid.mempty(Data_List_Types.monoidList);
var map = /* #__PURE__ */ Data_Functor.map(Data_List_Types.functorList);

// | The result of a test: success or failure (with an error message).
var Success = /* #__PURE__ */ (function () {
    function Success() {

    };
    Success.value = new Success();
    return Success;
})();

// | The result of a test: success or failure (with an error message).
var Failed = /* #__PURE__ */ (function () {
    function Failed(value0) {
        this.value0 = value0;
    };
    Failed.create = function (value0) {
        return new Failed(value0);
    };
    return Failed;
})();

// | This operator attaches an error message to a failed test.
// |
// | For example:
// |
// | ```purescript
// | test x = myProperty x <?> ("myProperty did not hold for " <> show x)
// | ```
var withHelp = function (v) {
    return function (v1) {
        if (v) {
            return Success.value;
        };
        if (!v) {
            return new Failed(v1);
        };
        throw new Error("Failed pattern match at Test.QuickCheck (line 248, column 1 - line 248, column 40): " + [ v.constructor.name, v1.constructor.name ]);
    };
};
var testableResult = {
    test: pure
};
var testableBoolean = {
    test: function (v) {
        if (v) {
            return pure(Success.value);
        };
        if (!v) {
            return pure(new Failed("Test returned false"));
        };
        throw new Error("Failed pattern match at Test.QuickCheck (line 224, column 1 - line 226, column 51): " + [ v.constructor.name ]);
    }
};
var test = function (dict) {
    return dict.test;
};
var testableFunction = function (dictArbitrary) {
    var arbitrary = Test_QuickCheck_Arbitrary.arbitrary(dictArbitrary);
    return function (dictTestable) {
        var test1 = test(dictTestable);
        return {
            test: function (f) {
                return bind(arbitrary)(function ($134) {
                    return test1(f($134));
                });
            }
        };
    };
};
var testableGen = function (dictTestable) {
    return {
        test: Data_Function.flip(bind)(test(dictTestable))
    };
};
var showResult = {
    show: function (v) {
        if (v instanceof Success) {
            return "Success";
        };
        if (v instanceof Failed) {
            return "Failed: " + v.value0;
        };
        throw new Error("Failed pattern match at Test.QuickCheck (line 237, column 1 - line 239, column 40): " + [ v.constructor.name ]);
    }
};

// | A variant of the `quickCheck'` function that accepts a specific seed as
// | well as the number tests that should be run.
var quickCheckWithSeed = function (dictTestable) {
    var test1 = test(dictTestable);
    return function (initialSeed) {
        return function (n) {
            return function (prop) {
                var loop = function (v) {
                    if (v.index === n) {
                        return new Control_Monad_Rec_Class.Done(v);
                    };
                    if (Data_Boolean.otherwise) {
                        var v1 = Test_QuickCheck_Gen.runGen(test1(prop))({
                            newSeed: v.seed,
                            size: 10
                        });
                        if (v1.value0 instanceof Success) {
                            return new Control_Monad_Rec_Class.Loop({
                                seed: v1.value1.newSeed,
                                index: v.index + 1 | 0,
                                successes: v.successes + 1 | 0,
                                firstFailure: v.firstFailure
                            });
                        };
                        if (v1.value0 instanceof Failed) {
                            return new Control_Monad_Rec_Class.Loop({
                                seed: v1.value1.newSeed,
                                index: v.index + 1 | 0,
                                successes: v.successes,
                                firstFailure: append1(v.firstFailure)(new Data_Maybe.Just({
                                    index: v.index,
                                    message: v1.value0.value0,
                                    seed: v.seed
                                }))
                            });
                        };
                        throw new Error("Failed pattern match at Test.QuickCheck (line 118, column 9 - line 133, column 16): " + [ v1.constructor.name ]);
                    };
                    throw new Error("Failed pattern match at Test.QuickCheck (line 114, column 3 - line 114, column 48): " + [ v.constructor.name ]);
                };
                var result = Control_Monad_Rec_Class.tailRec(loop)({
                    seed: initialSeed,
                    index: 0,
                    successes: 0,
                    firstFailure: mempty
                });
                return function __do() {
                    Effect_Console.log(show(result.successes) + ("/" + (show(n) + " test(s) passed.")))();
                    return for_(result.firstFailure)(function (v) {
                        return Effect_Exception.throwException(Effect_Exception.error("Test " + (show(v.index + 1 | 0) + (" (seed " + (show(Random_LCG.unSeed(v.seed)) + (") failed: \x0a" + v.message))))));
                    })();
                };
            };
        };
    };
};

// | Test a property, returning all test results as a List, with the Seed that
// | was used for each result.
// |
// | The first argument is the _random seed_ to be passed to the random generator.
// | The second argument is the number of tests to run.
var quickCheckPure$prime = function (dictTestable) {
    var test1 = test(dictTestable);
    return function (s) {
        return function (n) {
            return function (prop) {
                var loop = function (v) {
                    if (v.index === n) {
                        return new Control_Monad_Rec_Class.Done(Data_List.reverse(v.results));
                    };
                    if (Data_Boolean.otherwise) {
                        var v1 = Test_QuickCheck_Gen.runGen(test1(prop))({
                            newSeed: v.seed,
                            size: 10
                        });
                        return new Control_Monad_Rec_Class.Loop({
                            seed: v1.value1.newSeed,
                            index: v.index + 1 | 0,
                            results: new Data_List_Types.Cons(new Data_Tuple.Tuple(v.seed, v1.value0), v.results)
                        });
                    };
                    throw new Error("Failed pattern match at Test.QuickCheck (line 161, column 5 - line 161, column 75): " + [ v.constructor.name ]);
                };
                return Control_Monad_Rec_Class.tailRec(loop)({
                    seed: s,
                    index: 0,
                    results: mempty1
                });
            };
        };
    };
};

// | Test a property, returning all test results as a List.
// |
// | The first argument is the _random seed_ to be passed to the random generator.
// | The second argument is the number of tests to run.
var quickCheckPure = function (dictTestable) {
    var quickCheckPure$prime1 = quickCheckPure$prime(dictTestable);
    return function (s) {
        return function (n) {
            return function (prop) {
                return map(Data_Tuple.snd)(quickCheckPure$prime1(s)(n)(prop));
            };
        };
    };
};

// | A version of `quickCheckWithSeed` with the property specialized to `Gen`.
var quickCheckGenWithSeed = function (dictTestable) {
    return quickCheckWithSeed(testableGen(dictTestable));
};

// | A version of `quickCheckPure'` with the property specialized to `Gen`.
var quickCheckGenPure$prime = function (dictTestable) {
    return quickCheckPure$prime(testableGen(dictTestable));
};

// | A version of `quickCheckPure` with the property specialized to `Gen`.
var quickCheckGenPure = function (dictTestable) {
    return quickCheckPure(testableGen(dictTestable));
};

// | A variant of the `quickCheck` function which accepts an extra parameter
// | representing the number of tests which should be run.
var quickCheck$prime = function (dictTestable) {
    var quickCheckWithSeed1 = quickCheckWithSeed(dictTestable);
    return function (n) {
        return function (prop) {
            return function __do() {
                var seed = Random_LCG.randomSeed();
                return quickCheckWithSeed1(seed)(n)(prop)();
            };
        };
    };
};

// | A version of `quickCheck'` with the property specialized to `Gen`.
var quickCheckGen$prime = function (dictTestable) {
    return quickCheck$prime(testableGen(dictTestable));
};

// | Test a property.
// |
// | This function generates a new random seed, runs 100 tests and
// | prints the test results to the console.
var quickCheck = function (dictTestable) {
    var quickCheck$prime1 = quickCheck$prime(dictTestable);
    return function (prop) {
        return quickCheck$prime1(100)(prop);
    };
};

// | A version of `quickCheck` with the property specialized to `Gen`.
// |
// | The `quickCheckGen` variants are useful for writing property tests where a
// | `MonadGen` constraint (or QuickCheck's `Gen` directly) is being used,
// | rather than relying on `Arbitrary` instances. Especially useful for the
// | `MonadGen`-constrained properties as they will not infer correctly when
// | used with the `quickCheck` functions unless an explicit type annotation is
// | used.
var quickCheckGen = function (dictTestable) {
    return quickCheck(testableGen(dictTestable));
};

// | Print a one-line summary in the form "x/y test(s) passed."
var printSummary = function (summary) {
    return show(summary.successes) + ("/" + (show(summary.total) + (function () {
        var $126 = summary.total === 1;
        if ($126) {
            return " test passed.";
        };
        return " tests passed.";
    })()));
};

// | Processes the results from `quickCheckPure'` to produce a `ResultSummary`.
var checkResults = /* #__PURE__ */ (function () {
    var go = function (index) {
        return function (st) {
            return function (v) {
                if (v.value1 instanceof Success) {
                    return {
                        failures: st.failures,
                        total: st.total + 1 | 0,
                        successes: st.successes + 1 | 0
                    };
                };
                if (v.value1 instanceof Failed) {
                    return {
                        successes: st.successes,
                        total: st.total + 1 | 0,
                        failures: new Data_List_Types.Cons({
                            index: index,
                            seed: v.value0,
                            message: v.value1.value0
                        }, st.failures)
                    };
                };
                throw new Error("Failed pattern match at Test.QuickCheck (line 200, column 7 - line 204, column 97): " + [ v.value1.constructor.name ]);
            };
        };
    };
    return Data_FoldableWithIndex.foldlWithIndex(Data_List_Types.foldableWithIndexList)(go)({
        total: 0,
        successes: 0,
        failures: Data_List_Types.Nil.value
    });
})();

// | Self-documenting comparison operation
var assertOp = function (dictEq) {
    return function (dictShow) {
        var show1 = Data_Show.show(dictShow);
        return function (op) {
            return function (failString) {
                return function (a) {
                    return function (b) {
                        return withHelp(op(a)(b))(show1(a) + (failString + show1(b)));
                    };
                };
            };
        };
    };
};

// | Self-documenting inequality assertion
var assertNotEquals = function (dictEq) {
    var assertOp1 = assertOp(dictEq);
    var notEq = Data_Eq.notEq(dictEq);
    return function (dictShow) {
        return assertOp1(dictShow)(notEq)(" == ");
    };
};
var assertLessThanEq = function (dictOrd) {
    var assertOp1 = assertOp(dictOrd.Eq0());
    var lessThanOrEq = Data_Ord.lessThanOrEq(dictOrd);
    return function (dictShow) {
        return assertOp1(dictShow)(lessThanOrEq)(" > ");
    };
};
var assertLessThan = function (dictOrd) {
    var assertOp1 = assertOp(dictOrd.Eq0());
    var lessThan = Data_Ord.lessThan(dictOrd);
    return function (dictShow) {
        return assertOp1(dictShow)(lessThan)(" >= ");
    };
};
var assertGreaterThanEq = function (dictOrd) {
    var assertOp1 = assertOp(dictOrd.Eq0());
    var greaterThanOrEq = Data_Ord.greaterThanOrEq(dictOrd);
    return function (dictShow) {
        return assertOp1(dictShow)(greaterThanOrEq)(" < ");
    };
};
var assertGreaterThan = function (dictOrd) {
    var assertOp1 = assertOp(dictOrd.Eq0());
    var greaterThan = Data_Ord.greaterThan(dictOrd);
    return function (dictShow) {
        return assertOp1(dictShow)(greaterThan)(" <= ");
    };
};

// | Self-documenting equality assertion
var assertEquals = function (dictEq) {
    var assertOp1 = assertOp(dictEq);
    var eq1 = Data_Eq.eq(dictEq);
    return function (dictShow) {
        return assertOp1(dictShow)(eq1)(" /= ");
    };
};
export {
    quickCheck,
    quickCheckGen,
    quickCheck$prime,
    quickCheckGen$prime,
    quickCheckWithSeed,
    quickCheckGenWithSeed,
    quickCheckPure,
    quickCheckPure$prime,
    quickCheckGenPure,
    quickCheckGenPure$prime,
    checkResults,
    printSummary,
    test,
    Success,
    Failed,
    withHelp,
    assertEquals,
    assertNotEquals,
    assertLessThan,
    assertLessThanEq,
    assertGreaterThan,
    assertGreaterThanEq,
    testableResult,
    testableBoolean,
    testableFunction,
    testableGen,
    showResult
};
export {
    mkSeed,
    randomSeed,
    unSeed
} from "../Random.LCG/index.js";
export {
    arbitrary,
    coarbitrary
} from "../Test.QuickCheck.Arbitrary/index.js";
