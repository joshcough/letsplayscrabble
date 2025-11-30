import * as Control_Applicative from "../Control.Applicative/index.js";
import * as Control_Apply from "../Control.Apply/index.js";
import * as Control_Bind from "../Control.Bind/index.js";
import * as Data_Array from "../Data.Array/index.js";
import * as Data_Foldable from "../Data.Foldable/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Monoid from "../Data.Monoid/index.js";
import * as Data_Semigroup from "../Data.Semigroup/index.js";
import * as Data_Unit from "../Data.Unit/index.js";
import * as Effect from "../Effect/index.js";
import * as Effect_Ref from "../Effect.Ref/index.js";
import * as Effect_Unsafe from "../Effect.Unsafe/index.js";
import * as Safe_Coerce from "../Safe.Coerce/index.js";
import * as Unsafe_Reference from "../Unsafe.Reference/index.js";
var $$void = /* #__PURE__ */ Data_Functor["void"](Effect.functorEffect);

// | Make an `Emitter` from a function which accepts a callback and returns an
// | unsubscription function.
// |
// | Note: You should use `create` unless you need explicit control over
// | unsubscription.
var coerce = /* #__PURE__ */ Safe_Coerce.coerce();
var bind = /* #__PURE__ */ Control_Bind.bind(Effect.bindEffect);
var pure = /* #__PURE__ */ Control_Applicative.pure(Effect.applicativeEffect);
var append = /* #__PURE__ */ Data_Semigroup.append(Data_Semigroup.semigroupArray);
var traverse_ = /* #__PURE__ */ Data_Foldable.traverse_(Effect.applicativeEffect);
var traverse_1 = /* #__PURE__ */ traverse_(Data_Foldable.foldableArray);
var applySecond = /* #__PURE__ */ Control_Apply.applySecond(Effect.applyEffect);
var traverse_2 = /* #__PURE__ */ traverse_(Data_Foldable.foldableMaybe);

// | A `Subscription` results from subscribing to an `Emitter` with `subscribe`;
// | the subscription can be ended at any time with `unsubscribe`.
var Subscription = function (x) {
    return x;
};

// | Conceptually, a `Listener` represents an input source to an `Emitter`. You
// | can push a value to its paired emitter with the `notify` function.
var Listener = function (x) {
    return x;
};

// | An `Emitter` represents a collection of discrete occurrences of an event;
// | conceptually, an emitter is a possibly-infinite list of values.
// |
// | Emitters are created from real events like timers or mouse clicks and can
// | be combined or transformed with the functions and instances in this module.
// |
// | Emitters are consumed by providing a callback via the `subscribe` function.
var Emitter = function (x) {
    return x;
};

// | End a subscription to an `Emitter`.
var unsubscribe = function (v) {
    return v;
};

// | Subscribe to an `Emitter` by providing a callback to run on values produced
// | by the emitter:
// |
// | ```purs
// | -- Produce an emitter / listener pair with `create`:
// | { emitter, listener } <- create
// |
// | -- Then, subscribe to the emitter by providing a callback:
// | subscription <- subscribe emitter \emitted ->
// |   doSomethingWith emitted
// |
// | -- End the subscription at any time with `unsubscribe`:
// | unsubscribe subscription
// | ```
var subscribe = function (v) {
    return function (k) {
        return v(function ($76) {
            return $$void(k($76));
        });
    };
};
var semigroupSubscription = /* #__PURE__ */ Effect.semigroupEffect(Data_Semigroup.semigroupUnit);

// | Push a value to the `Emitter` paired with the provided `Listener` argument.
// |
// | ```purs
// | -- Create an emitter and listener with `create`:
// | { emitter, listener } <- create
// |
// | -- Then, push values to the emitter via the listener with `notify`:
// | notify listener "hello"
// | ```
var notify = function (v) {
    return function (a) {
        return v(a);
    };
};
var monoidSubscription = /* #__PURE__ */ Effect.monoidEffect(Data_Monoid.monoidUnit);
var mempty = /* #__PURE__ */ Data_Monoid.mempty(/* #__PURE__ */ Data_Monoid.monoidFn(/* #__PURE__ */ Effect.monoidEffect(monoidSubscription)));
var makeEmitter = coerce;
var functorEmitter = {
    map: function (f) {
        return function (v) {
            return function (k) {
                return v(function ($77) {
                    return k(f($77));
                });
            };
        };
    }
};

// | Fold over values received from some `Emitter`, creating a new `Emitter`.
var fold = function (f) {
    return function (v) {
        return function (b) {
            return function (k) {
                return function __do() {
                    var result = Effect_Ref["new"](b)();
                    return v(function (a) {
                        return bind(Effect_Ref.modify(f(a))(result))(k);
                    })();
                };
            };
        };
    };
};

// | Create an `Emitter` which only fires when a predicate holds.
var filter = function (p) {
    return function (v) {
        return function (k) {
            return v(function (a) {
                var $57 = p(a);
                if ($57) {
                    return k(a);
                };
                return pure(Data_Unit.unit);
            });
        };
    };
};

// | Create a paired `Listener` and `Emitter`, where you can push values to
// | the listener and subscribe to values from the emitter.
// |
// | ```purs
// | { emitter, listener } <- create
// |
// | -- Push values into the listener:
// | notify listener "hello"
// |
// | -- Subscribe to outputs from the emitter with a callback:
// | subscription <- subscribe emitter \value ->
// |   Console.log value
// |
// | -- Unsubscribe at any time:
// | unsubscribe subscription
// | ```
var create = function __do() {
    var subscribers = Effect_Ref["new"]([  ])();
    return {
        emitter: function (k) {
            return function __do() {
                Effect_Ref.modify_(function (v) {
                    return append(v)([ k ]);
                })(subscribers)();
                return Effect_Ref.modify_(Data_Array.deleteBy(Unsafe_Reference.unsafeRefEq)(k))(subscribers);
            };
        },
        listener: function (a) {
            return bind(Effect_Ref.read(subscribers))(traverse_1(function (k) {
                return k(a);
            }));
        }
    };
};

// | Compute a fixed point.
var fix = function (f) {
    var v = Effect_Unsafe.unsafePerformEffect(create);
    var v1 = f(v.emitter);
    return function (k) {
        return function __do() {
            var v2 = subscribe(v1.input)(notify(v.listener))();
            var v3 = subscribe(v1.output)(k)();
            return applySecond(v2)(v3);
        };
    };
};
var contravariantListener = {
    cmap: function (f) {
        return function (v) {
            return coerce(function ($78) {
                return v(f($78));
            });
        };
    }
};
var applyEmitter = {
    apply: function (v) {
        return function (v1) {
            return function (k) {
                return function __do() {
                    var latestA = Effect_Ref["new"](Data_Maybe.Nothing.value)();
                    var latestB = Effect_Ref["new"](Data_Maybe.Nothing.value)();
                    var v2 = v(function (a) {
                        return function __do() {
                            Effect_Ref.write(new Data_Maybe.Just(a))(latestA)();
                            return bind(Effect_Ref.read(latestB))(traverse_2(function ($79) {
                                return k(a($79));
                            }))();
                        };
                    })();
                    var v3 = v1(function (b) {
                        return function __do() {
                            Effect_Ref.write(new Data_Maybe.Just(b))(latestB)();
                            return bind(Effect_Ref.read(latestA))(traverse_2(function ($80) {
                                return k((function (v3) {
                                    return v3(b);
                                })($80));
                            }))();
                        };
                    })();
                    return applySecond(v2)(v3);
                };
            };
        };
    },
    Functor0: function () {
        return functorEmitter;
    }
};
var lift2 = /* #__PURE__ */ Control_Apply.lift2(applyEmitter);
var semigroupEmitter = function (dictSemigroup) {
    return {
        append: lift2(Data_Semigroup.append(dictSemigroup))
    };
};
var monoidEmitter = function (dictMonoid) {
    var semigroupEmitter1 = semigroupEmitter(dictMonoid.Semigroup0());
    return {
        mempty: mempty,
        Semigroup0: function () {
            return semigroupEmitter1;
        }
    };
};
var applicativeEmitter = {
    pure: function (a) {
        return function (k) {
            return function __do() {
                k(a)();
                return pure(Data_Unit.unit);
            };
        };
    },
    Apply0: function () {
        return applyEmitter;
    }
};
var altEmitter = {
    alt: function (v) {
        return function (v1) {
            return function (k) {
                return function __do() {
                    var v2 = v(k)();
                    var v3 = v1(k)();
                    return applySecond(v2)(v3);
                };
            };
        };
    },
    Functor0: function () {
        return functorEmitter;
    }
};
var plusEmitter = {
    empty: function (v) {
        return pure(pure(Data_Unit.unit));
    },
    Alt0: function () {
        return altEmitter;
    }
};
var alternativeEmitter = {
    Applicative0: function () {
        return applicativeEmitter;
    },
    Plus1: function () {
        return plusEmitter;
    }
};
export {
    create,
    notify,
    makeEmitter,
    subscribe,
    unsubscribe,
    fold,
    filter,
    fix,
    functorEmitter,
    applyEmitter,
    applicativeEmitter,
    altEmitter,
    plusEmitter,
    alternativeEmitter,
    semigroupEmitter,
    monoidEmitter,
    contravariantListener,
    semigroupSubscription,
    monoidSubscription
};
