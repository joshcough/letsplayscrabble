import * as Control_Applicative from "../Control.Applicative/index.js";
import * as Control_Applicative_Free from "../Control.Applicative.Free/index.js";
import * as Control_Bind from "../Control.Bind/index.js";
import * as Control_Category from "../Control.Category/index.js";
import * as Control_Monad_Error_Class from "../Control.Monad.Error.Class/index.js";
import * as Control_Monad_Free from "../Control.Monad.Free/index.js";
import * as Control_Monad_Reader_Class from "../Control.Monad.Reader.Class/index.js";
import * as Control_Monad_Rec_Class from "../Control.Monad.Rec.Class/index.js";
import * as Control_Monad_Writer_Class from "../Control.Monad.Writer.Class/index.js";
import * as Data_Bifunctor from "../Data.Bifunctor/index.js";
import * as Data_Eq from "../Data.Eq/index.js";
import * as Data_FoldableWithIndex from "../Data.FoldableWithIndex/index.js";
import * as Data_Function from "../Data.Function/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Map_Internal from "../Data.Map.Internal/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Newtype from "../Data.Newtype/index.js";
import * as Data_Ord from "../Data.Ord/index.js";
import * as Data_Traversable from "../Data.Traversable/index.js";
import * as Data_Tuple from "../Data.Tuple/index.js";
import * as Data_Unit from "../Data.Unit/index.js";
import * as Effect_Aff_Class from "../Effect.Aff.Class/index.js";
import * as Effect_Class from "../Effect.Class/index.js";
import * as Halogen_Data_Slot from "../Halogen.Data.Slot/index.js";
import * as Halogen_Query_ChildQuery from "../Halogen.Query.ChildQuery/index.js";
import * as Halogen_Subscription from "../Halogen.Subscription/index.js";
var identity = /* #__PURE__ */ Control_Category.identity(Control_Category.categoryFn);
var foldrWithIndex = /* #__PURE__ */ Data_FoldableWithIndex.foldrWithIndex(Data_Map_Internal.foldableWithIndexMap);
var traverse = /* #__PURE__ */ Data_Traversable.traverse(Data_Map_Internal.traversableMap);
var slots = /* #__PURE__ */ Halogen_Data_Slot.slots();
var lookup = /* #__PURE__ */ Halogen_Data_Slot.lookup();
var over = /* #__PURE__ */ Data_Newtype.over()();
var map = /* #__PURE__ */ Data_Functor.map(Halogen_Subscription.functorEmitter);
var map1 = /* #__PURE__ */ Data_Functor.map(Data_Tuple.functorTuple);
var lmap = /* #__PURE__ */ Data_Bifunctor.lmap(Data_Bifunctor.bifunctorTuple);
var map2 = /* #__PURE__ */ Data_Functor.map(Halogen_Query_ChildQuery.functorChildQuery);

// | The ID value associated with a subscription. Allows the subscription to be
// | stopped at a later time.
var SubscriptionId = function (x) {
    return x;
};

// | The ID value associated with a forked process. Allows the fork to be killed
// | at a later time.
var ForkId = function (x) {
    return x;
};

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var State = /* #__PURE__ */ (function () {
    function State(value0) {
        this.value0 = value0;
    };
    State.create = function (value0) {
        return new State(value0);
    };
    return State;
})();

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var Subscribe = /* #__PURE__ */ (function () {
    function Subscribe(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    Subscribe.create = function (value0) {
        return function (value1) {
            return new Subscribe(value0, value1);
        };
    };
    return Subscribe;
})();

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var Unsubscribe = /* #__PURE__ */ (function () {
    function Unsubscribe(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    Unsubscribe.create = function (value0) {
        return function (value1) {
            return new Unsubscribe(value0, value1);
        };
    };
    return Unsubscribe;
})();

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var Lift = /* #__PURE__ */ (function () {
    function Lift(value0) {
        this.value0 = value0;
    };
    Lift.create = function (value0) {
        return new Lift(value0);
    };
    return Lift;
})();

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var ChildQuery = /* #__PURE__ */ (function () {
    function ChildQuery(value0) {
        this.value0 = value0;
    };
    ChildQuery.create = function (value0) {
        return new ChildQuery(value0);
    };
    return ChildQuery;
})();

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var Raise = /* #__PURE__ */ (function () {
    function Raise(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    Raise.create = function (value0) {
        return function (value1) {
            return new Raise(value0, value1);
        };
    };
    return Raise;
})();

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var Par = /* #__PURE__ */ (function () {
    function Par(value0) {
        this.value0 = value0;
    };
    Par.create = function (value0) {
        return new Par(value0);
    };
    return Par;
})();

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var Fork = /* #__PURE__ */ (function () {
    function Fork(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    Fork.create = function (value0) {
        return function (value1) {
            return new Fork(value0, value1);
        };
    };
    return Fork;
})();

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var Join = /* #__PURE__ */ (function () {
    function Join(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    Join.create = function (value0) {
        return function (value1) {
            return new Join(value0, value1);
        };
    };
    return Join;
})();

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var Kill = /* #__PURE__ */ (function () {
    function Kill(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    Kill.create = function (value0) {
        return function (value1) {
            return new Kill(value0, value1);
        };
    };
    return Kill;
})();

// | The Halogen component eval algebra.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenF expression (see HalogenM for an example).
var GetRef = /* #__PURE__ */ (function () {
    function GetRef(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    GetRef.create = function (value0) {
        return function (value1) {
            return new GetRef(value0, value1);
        };
    };
    return GetRef;
})();

// | An applicative-only version of `HalogenM` to allow for parallel evaluation.
var HalogenAp = function (x) {
    return x;
};

// | The Halogen component eval effect monad.
// |
// | - `state` is the component's state
// | - `action` is the type of actions; events internal to the component that
// |   can be evaluated
// | - `slots` is the set of slots for addressing child components
// | - `output` is the type of output messages the component can raise
// | - `m` is the monad used during evaluation
// | - `a` is the result of the HalogenM expression. Use the following pattern:
// |     `handleAction :: Action -> H.HalogenM State Action Slots Output m Unit`
// |     `handleQuery  :: forall a. Query a -> H.HalogenM State Action Slots Output m (Maybe a)`
var HalogenM = function (x) {
    return x;
};

// | Unsubscribes a component from a subscription. If the subscription associated
// | with the ID has already ended this will have no effect.
var unsubscribe = function (sid) {
    return Control_Monad_Free.liftF(new Unsubscribe(sid, Data_Unit.unit));
};

// | An alternative to `subscribe`, intended for subscriptions that unsubscribe
// | themselves. Instead of returning the `SubscriptionId` from `subscribe'`, it
// | is passed into an `Emitter` constructor. This allows emitted queries
// | to include the `SubscriptionId`, rather than storing it in the state of the
// | component.
// |
// | When a component is disposed of any active subscriptions will automatically
// | be stopped and no further subscriptions will be possible during
// | finalization.
var subscribe$prime = function (esc) {
    return Control_Monad_Free.liftF(new Subscribe(esc, Data_Function["const"](Data_Unit.unit)));
};

// | Subscribes a component to an `Emitter`.
// |
// | When a component is disposed of any active subscriptions will automatically
// | be stopped and no further subscriptions will be possible during
// | finalization.
var subscribe = function (es) {
    return Control_Monad_Free.liftF(new Subscribe(function (v) {
        return es;
    }, identity));
};
var semigroupHalogenM = function (dictSemigroup) {
    return Control_Monad_Free.semigroupFree(dictSemigroup);
};

// | Raises an output message for the component.
var raise = function (o) {
    return Control_Monad_Free.liftF(new Raise(o, Data_Unit.unit));
};

// | Sends a query to all children of a component at a given slot label.
var queryAll = function () {
    return function (dictIsSymbol) {
        var slots1 = slots(dictIsSymbol);
        return function (dictOrd) {
            var slots2 = slots1(dictOrd);
            return function (label) {
                return function (q) {
                    var catMapMaybes = function (dictOrd1) {
                        var insert = Data_Map_Internal.insert(dictOrd1);
                        return foldrWithIndex(function (k) {
                            return function (v) {
                                return function (acc) {
                                    return Data_Maybe.maybe(acc)(Data_Function.flip(insert(k))(acc))(v);
                                };
                            };
                        })(Data_Map_Internal.empty);
                    };
                    var catMapMaybes1 = catMapMaybes(dictOrd);
                    return Control_Monad_Free.liftF(new ChildQuery(Halogen_Query_ChildQuery.mkChildQueryBox(new Halogen_Query_ChildQuery.ChildQuery(function (dictApplicative) {
                        var map4 = Data_Functor.map((dictApplicative.Apply0()).Functor0());
                        var traverse1 = traverse(dictApplicative);
                        return function (k) {
                            var $173 = map4(catMapMaybes1);
                            var $174 = traverse1(k);
                            var $175 = slots2(label);
                            return function ($176) {
                                return $173($174($175($176)));
                            };
                        };
                    }, q, identity))));
                };
            };
        };
    };
};

// | Sends a query to a child of a component at the specified slot.
var query = function () {
    return function (dictIsSymbol) {
        var lookup1 = lookup(dictIsSymbol);
        return function (dictOrd) {
            var lookup2 = lookup1(dictOrd);
            return function (label) {
                return function (p) {
                    return function (q) {
                        return Control_Monad_Free.liftF(new ChildQuery(Halogen_Query_ChildQuery.mkChildQueryBox(new Halogen_Query_ChildQuery.ChildQuery(function (dictApplicative) {
                            var pure1 = Control_Applicative.pure(dictApplicative);
                            return function (k) {
                                var $177 = Data_Maybe.maybe(pure1(Data_Maybe.Nothing.value))(k);
                                var $178 = lookup2(label)(p);
                                return function ($179) {
                                    return $177($178($179));
                                };
                            };
                        }, q, identity))));
                    };
                };
            };
        };
    };
};
var ordSubscriptionId = Data_Ord.ordInt;
var ordForkId = Data_Ord.ordInt;
var newtypeHalogenAp = {
    Coercible0: function () {
        return undefined;
    }
};
var monoidHalogenM = function (dictMonoid) {
    return Control_Monad_Free.monoidFree(dictMonoid);
};
var monadTransHalogenM = {
    lift: function (dictMonad) {
        return function ($180) {
            return HalogenM(Control_Monad_Free.liftF(Lift.create($180)));
        };
    }
};
var monadHalogenM = Control_Monad_Free.freeMonad;
var monadStateHalogenM = {
    state: function ($181) {
        return HalogenM(Control_Monad_Free.liftF(State.create($181)));
    },
    Monad0: function () {
        return monadHalogenM;
    }
};
var monadTellHalogenM = function (dictMonadTell) {
    var Semigroup0 = dictMonadTell.Semigroup0();
    return {
        tell: (function () {
            var $182 = Control_Monad_Writer_Class.tell(dictMonadTell);
            return function ($183) {
                return HalogenM(Control_Monad_Free.liftF(Lift.create($182($183))));
            };
        })(),
        Semigroup0: function () {
            return Semigroup0;
        },
        Monad1: function () {
            return monadHalogenM;
        }
    };
};
var monadThrowHalogenM = function (dictMonadThrow) {
    return {
        throwError: (function () {
            var $184 = Control_Monad_Error_Class.throwError(dictMonadThrow);
            return function ($185) {
                return HalogenM(Control_Monad_Free.liftF(Lift.create($184($185))));
            };
        })(),
        Monad0: function () {
            return monadHalogenM;
        }
    };
};
var monadEffectHalogenM = function (dictMonadEffect) {
    return {
        liftEffect: (function () {
            var $186 = Effect_Class.liftEffect(dictMonadEffect);
            return function ($187) {
                return HalogenM(Control_Monad_Free.liftF(Lift.create($186($187))));
            };
        })(),
        Monad0: function () {
            return monadHalogenM;
        }
    };
};
var monadAskHalogenM = function (dictMonadAsk) {
    return {
        ask: Control_Monad_Free.liftF(new Lift(Control_Monad_Reader_Class.ask(dictMonadAsk))),
        Monad0: function () {
            return monadHalogenM;
        }
    };
};
var monadAffHalogenM = function (dictMonadAff) {
    var monadEffectHalogenM1 = monadEffectHalogenM(dictMonadAff.MonadEffect0());
    return {
        liftAff: (function () {
            var $188 = Effect_Aff_Class.liftAff(dictMonadAff);
            return function ($189) {
                return HalogenM(Control_Monad_Free.liftF(Lift.create($188($189))));
            };
        })(),
        MonadEffect0: function () {
            return monadEffectHalogenM1;
        }
    };
};
var mapOutput = function (f) {
    return function (v) {
        var go = function (v1) {
            if (v1 instanceof State) {
                return new State(v1.value0);
            };
            if (v1 instanceof Subscribe) {
                return new Subscribe(v1.value0, v1.value1);
            };
            if (v1 instanceof Unsubscribe) {
                return new Unsubscribe(v1.value0, v1.value1);
            };
            if (v1 instanceof Lift) {
                return new Lift(v1.value0);
            };
            if (v1 instanceof ChildQuery) {
                return new ChildQuery(v1.value0);
            };
            if (v1 instanceof Raise) {
                return new Raise(f(v1.value0), v1.value1);
            };
            if (v1 instanceof Par) {
                return new Par(over(HalogenAp)(Control_Applicative_Free.hoistFreeAp(mapOutput(f)))(v1.value0));
            };
            if (v1 instanceof Fork) {
                return new Fork(mapOutput(f)(v1.value0), v1.value1);
            };
            if (v1 instanceof Join) {
                return new Join(v1.value0, v1.value1);
            };
            if (v1 instanceof Kill) {
                return new Kill(v1.value0, v1.value1);
            };
            if (v1 instanceof GetRef) {
                return new GetRef(v1.value0, v1.value1);
            };
            throw new Error("Failed pattern match at Halogen.Query.HalogenM (line 290, column 8 - line 301, column 29): " + [ v1.constructor.name ]);
        };
        return Control_Monad_Free.hoistFree(go)(v);
    };
};
var mapAction = function (dictFunctor) {
    return function (f) {
        return function (v) {
            var go = function (v1) {
                if (v1 instanceof State) {
                    return new State(v1.value0);
                };
                if (v1 instanceof Subscribe) {
                    return new Subscribe((function () {
                        var $190 = map(f);
                        return function ($191) {
                            return $190(v1.value0($191));
                        };
                    })(), v1.value1);
                };
                if (v1 instanceof Unsubscribe) {
                    return new Unsubscribe(v1.value0, v1.value1);
                };
                if (v1 instanceof Lift) {
                    return new Lift(v1.value0);
                };
                if (v1 instanceof ChildQuery) {
                    return new ChildQuery(v1.value0);
                };
                if (v1 instanceof Raise) {
                    return new Raise(v1.value0, v1.value1);
                };
                if (v1 instanceof Par) {
                    return new Par(over(HalogenAp)(Control_Applicative_Free.hoistFreeAp(mapAction(dictFunctor)(f)))(v1.value0));
                };
                if (v1 instanceof Fork) {
                    return new Fork(mapAction(dictFunctor)(f)(v1.value0), v1.value1);
                };
                if (v1 instanceof Join) {
                    return new Join(v1.value0, v1.value1);
                };
                if (v1 instanceof Kill) {
                    return new Kill(v1.value0, v1.value1);
                };
                if (v1 instanceof GetRef) {
                    return new GetRef(v1.value0, v1.value1);
                };
                throw new Error("Failed pattern match at Halogen.Query.HalogenM (line 269, column 8 - line 280, column 29): " + [ v1.constructor.name ]);
            };
            return Control_Monad_Free.hoistFree(go)(v);
        };
    };
};

// | Kills a forked process if it is still running. Attempting to kill a forked
// | process that has already ended will have no effect.
var kill = function (fid) {
    return Control_Monad_Free.liftF(new Kill(fid, Data_Unit.unit));
};

// | Joins a forked process. Attempting to join a forked process that has
// | already ended will result in eval continuing immediately. Attempting
// | to join a forked process that has been killed will also terminate the
// | current eval.
var join = function (fid) {
    return Control_Monad_Free.liftF(new Join(fid, Data_Unit.unit));
};
var imapState = function (f) {
    return function (f$prime) {
        return function (v) {
            var go = function (v1) {
                if (v1 instanceof State) {
                    return new State((function () {
                        var $192 = map1(f);
                        return function ($193) {
                            return $192(v1.value0(f$prime($193)));
                        };
                    })());
                };
                if (v1 instanceof Subscribe) {
                    return new Subscribe(v1.value0, v1.value1);
                };
                if (v1 instanceof Unsubscribe) {
                    return new Unsubscribe(v1.value0, v1.value1);
                };
                if (v1 instanceof Lift) {
                    return new Lift(v1.value0);
                };
                if (v1 instanceof ChildQuery) {
                    return new ChildQuery(v1.value0);
                };
                if (v1 instanceof Raise) {
                    return new Raise(v1.value0, v1.value1);
                };
                if (v1 instanceof Par) {
                    return new Par(over(HalogenAp)(Control_Applicative_Free.hoistFreeAp(imapState(f)(f$prime)))(v1.value0));
                };
                if (v1 instanceof Fork) {
                    return new Fork(imapState(f)(f$prime)(v1.value0), v1.value1);
                };
                if (v1 instanceof Join) {
                    return new Join(v1.value0, v1.value1);
                };
                if (v1 instanceof Kill) {
                    return new Kill(v1.value0, v1.value1);
                };
                if (v1 instanceof GetRef) {
                    return new GetRef(v1.value0, v1.value1);
                };
                throw new Error("Failed pattern match at Halogen.Query.HalogenM (line 247, column 8 - line 258, column 29): " + [ v1.constructor.name ]);
            };
            return Control_Monad_Free.hoistFree(go)(v);
        };
    };
};
var hoist = function (dictFunctor) {
    return function (nat) {
        return function (v) {
            var go = function (v1) {
                if (v1 instanceof State) {
                    return new State(v1.value0);
                };
                if (v1 instanceof Subscribe) {
                    return new Subscribe(v1.value0, v1.value1);
                };
                if (v1 instanceof Unsubscribe) {
                    return new Unsubscribe(v1.value0, v1.value1);
                };
                if (v1 instanceof Lift) {
                    return new Lift(nat(v1.value0));
                };
                if (v1 instanceof ChildQuery) {
                    return new ChildQuery(v1.value0);
                };
                if (v1 instanceof Raise) {
                    return new Raise(v1.value0, v1.value1);
                };
                if (v1 instanceof Par) {
                    return new Par(over(HalogenAp)(Control_Applicative_Free.hoistFreeAp(hoist(dictFunctor)(nat)))(v1.value0));
                };
                if (v1 instanceof Fork) {
                    return new Fork(hoist(dictFunctor)(nat)(v1.value0), v1.value1);
                };
                if (v1 instanceof Join) {
                    return new Join(v1.value0, v1.value1);
                };
                if (v1 instanceof Kill) {
                    return new Kill(v1.value0, v1.value1);
                };
                if (v1 instanceof GetRef) {
                    return new GetRef(v1.value0, v1.value1);
                };
                throw new Error("Failed pattern match at Halogen.Query.HalogenM (line 312, column 8 - line 323, column 29): " + [ v1.constructor.name ]);
            };
            return Control_Monad_Free.hoistFree(go)(v);
        };
    };
};

// | Retrieves an `Element` value that is associated with a `Ref` in the
// | rendered output of a component. If there is no currently rendered value for
// | the requested ref this will return `Nothing`.
var getRef = function (p) {
    return Control_Monad_Free.liftF(new GetRef(p, identity));
};
var functorHalogenM = Control_Monad_Free.freeFunctor;
var functorHalogenAp = Control_Applicative_Free.functorFreeAp;
var map3 = /* #__PURE__ */ Data_Functor.map(functorHalogenAp);
var functorHalogenF = function (dictFunctor) {
    var map4 = Data_Functor.map(dictFunctor);
    return {
        map: function (f) {
            return function (v) {
                if (v instanceof State) {
                    return new State((function () {
                        var $194 = lmap(f);
                        return function ($195) {
                            return $194(v.value0($195));
                        };
                    })());
                };
                if (v instanceof Subscribe) {
                    return new Subscribe(v.value0, function ($196) {
                        return f(v.value1($196));
                    });
                };
                if (v instanceof Unsubscribe) {
                    return new Unsubscribe(v.value0, f(v.value1));
                };
                if (v instanceof Lift) {
                    return new Lift(map4(f)(v.value0));
                };
                if (v instanceof ChildQuery) {
                    return new ChildQuery(map2(f)(v.value0));
                };
                if (v instanceof Raise) {
                    return new Raise(v.value0, f(v.value1));
                };
                if (v instanceof Par) {
                    return new Par(map3(f)(v.value0));
                };
                if (v instanceof Fork) {
                    return new Fork(v.value0, function ($197) {
                        return f(v.value1($197));
                    });
                };
                if (v instanceof Join) {
                    return new Join(v.value0, f(v.value1));
                };
                if (v instanceof Kill) {
                    return new Kill(v.value0, f(v.value1));
                };
                if (v instanceof GetRef) {
                    return new GetRef(v.value0, function ($198) {
                        return f(v.value1($198));
                    });
                };
                throw new Error("Failed pattern match at Halogen.Query.HalogenM (line 57, column 11 - line 68, column 37): " + [ v.constructor.name ]);
            };
        }
    };
};

// | Starts a `HalogenM` process running independent from the current `eval`
// | "thread".
// |
// | A commonly use case for `fork` is in component initializers where some
// | async action is started. Normally all interaction with the component will
// | be blocked until the initializer completes, but if the async action is
// | `fork`ed instead, the initializer can complete synchronously while the
// | async action continues.
// |
// | Some care needs to be taken when using a `fork` that can modify the
// | component state, as it's easy for the forked process to "clobber" the state
// | (overwrite some or all of it with an old value) by mistake.
// |
// | When a component is disposed of any active forks will automatically
// | be killed. New forks can be started during finalization but there will be
// | no means of killing them.
var fork = function (hmu) {
    return Control_Monad_Free.liftF(new Fork(hmu, identity));
};
var eqSubscriptionId = Data_Eq.eqInt;
var eqForkId = Data_Eq.eqInt;
var bindHalogenM = Control_Monad_Free.freeBind;
var bind = /* #__PURE__ */ Control_Bind.bind(bindHalogenM);
var applyHalogenM = Control_Monad_Free.freeApply;
var applyHalogenAp = Control_Applicative_Free.applyFreeAp;
var parallelHalogenM = {
    parallel: function ($199) {
        return HalogenAp(Control_Applicative_Free.liftFreeAp($199));
    },
    sequential: function ($200) {
        return HalogenM(Control_Monad_Free.liftF(Par.create($200)));
    },
    Apply0: function () {
        return applyHalogenM;
    },
    Apply1: function () {
        return applyHalogenAp;
    }
};
var applicativeHalogenM = Control_Monad_Free.freeApplicative;
var pure = /* #__PURE__ */ Control_Applicative.pure(applicativeHalogenM);
var monadRecHalogenM = {
    tailRecM: function (k) {
        return function (a) {
            return bind(k(a))(function (v) {
                if (v instanceof Control_Monad_Rec_Class.Loop) {
                    return Control_Monad_Rec_Class.tailRecM(monadRecHalogenM)(k)(v.value0);
                };
                if (v instanceof Control_Monad_Rec_Class.Done) {
                    return pure(v.value0);
                };
                throw new Error("Failed pattern match at Halogen.Query.HalogenM (line 105, column 26 - line 107, column 21): " + [ v.constructor.name ]);
            });
        };
    },
    Monad0: function () {
        return monadHalogenM;
    }
};
var applicativeHalogenAp = Control_Applicative_Free.applicativeFreeAp;
export {
    State,
    Subscribe,
    Unsubscribe,
    Lift,
    ChildQuery,
    Raise,
    Par,
    Fork,
    Join,
    Kill,
    GetRef,
    HalogenM,
    HalogenAp,
    raise,
    query,
    queryAll,
    SubscriptionId,
    subscribe,
    subscribe$prime,
    unsubscribe,
    ForkId,
    fork,
    join,
    kill,
    getRef,
    imapState,
    mapAction,
    mapOutput,
    hoist,
    functorHalogenF,
    functorHalogenM,
    applyHalogenM,
    applicativeHalogenM,
    bindHalogenM,
    monadHalogenM,
    semigroupHalogenM,
    monoidHalogenM,
    monadEffectHalogenM,
    monadAffHalogenM,
    parallelHalogenM,
    monadTransHalogenM,
    monadRecHalogenM,
    monadStateHalogenM,
    monadAskHalogenM,
    monadTellHalogenM,
    monadThrowHalogenM,
    newtypeHalogenAp,
    functorHalogenAp,
    applyHalogenAp,
    applicativeHalogenAp,
    eqSubscriptionId,
    ordSubscriptionId,
    eqForkId,
    ordForkId
};
