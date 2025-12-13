// | Main router component that handles navigation
import * as Component_Standings from "../Component.Standings/index.js";
import * as Component_StandingsWithPics from "../Component.StandingsWithPics/index.js";
import * as Component_WorkerPage from "../Component.WorkerPage/index.js";
import * as Control_Bind from "../Control.Bind/index.js";
import * as Control_Monad_State_Class from "../Control.Monad.State.Class/index.js";
import * as Data_Either from "../Data.Either/index.js";
import * as Data_Foldable from "../Data.Foldable/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Ord from "../Data.Ord/index.js";
import * as Data_Show from "../Data.Show/index.js";
import * as Data_Unit from "../Data.Unit/index.js";
import * as Domain_Types from "../Domain.Types/index.js";
import * as Effect from "../Effect/index.js";
import * as Effect_Class from "../Effect.Class/index.js";
import * as Effect_Class_Console from "../Effect.Class.Console/index.js";
import * as Halogen_Component from "../Halogen.Component/index.js";
import * as Halogen_HTML from "../Halogen.HTML/index.js";
import * as Halogen_HTML_Core from "../Halogen.HTML.Core/index.js";
import * as Halogen_HTML_Elements from "../Halogen.HTML.Elements/index.js";
import * as Halogen_HTML_Properties from "../Halogen.HTML.Properties/index.js";
import * as Halogen_Query_HalogenM from "../Halogen.Query.HalogenM/index.js";
import * as Halogen_Subscription from "../Halogen.Subscription/index.js";
import * as Route from "../Route/index.js";
import * as Routing_Duplex from "../Routing.Duplex/index.js";
import * as Routing_Duplex_Parser from "../Routing.Duplex.Parser/index.js";
import * as Routing_Hash from "../Routing.Hash/index.js";
import * as Type_Proxy from "../Type.Proxy/index.js";
var discard = /* #__PURE__ */ Control_Bind.discard(Control_Bind.discardUnit);
var $$void = /* #__PURE__ */ Data_Functor["void"](Effect.functorEffect);
var matchesWith = /* #__PURE__ */ Routing_Hash.matchesWith(Data_Foldable.foldableEither);
var discard2 = /* #__PURE__ */ discard(Halogen_Query_HalogenM.bindHalogenM);
var log = /* #__PURE__ */ Effect_Class_Console.log(Effect_Class.monadEffectEffect);
var bind1 = /* #__PURE__ */ Control_Bind.bind(Halogen_Query_HalogenM.bindHalogenM);
var show = /* #__PURE__ */ Data_Show.show(Routing_Duplex_Parser.showRouteError);
var modify_ = /* #__PURE__ */ Control_Monad_State_Class.modify_(Halogen_Query_HalogenM.monadStateHalogenM);
var show1 = /* #__PURE__ */ Data_Show.show(Route.showRoute);

// Subscribe to hash changes
var void1 = /* #__PURE__ */ Data_Functor["void"](Halogen_Query_HalogenM.functorHalogenM);
var bindFlipped = /* #__PURE__ */ Control_Bind.bindFlipped(Halogen_Query_HalogenM.bindHalogenM);
var slot_ = /* #__PURE__ */ Halogen_HTML.slot_();
var slot_1 = /* #__PURE__ */ slot_({
    reflectSymbol: function () {
        return "standings";
    }
})(Data_Ord.ordUnit);
var map = /* #__PURE__ */ Data_Functor.map(Data_Maybe.functorMaybe);
var slot_2 = /* #__PURE__ */ slot_({
    reflectSymbol: function () {
        return "standingsWithPics";
    }
})(Data_Ord.ordUnit);
var slot_3 = /* #__PURE__ */ slot_({
    reflectSymbol: function () {
        return "worker";
    }
})(Data_Ord.ordUnit);

// | Router actions
var Initialize = /* #__PURE__ */ (function () {
    function Initialize() {

    };
    Initialize.value = new Initialize();
    return Initialize;
})();

// | Router actions
var Navigate = /* #__PURE__ */ (function () {
    function Navigate(value0) {
        this.value0 = value0;
    };
    Navigate.create = function (value0) {
        return new Navigate(value0);
    };
    return Navigate;
})();

// | Create an emitter for hash changes
var hashChangeEmitter = function (dictMonadEffect) {
    return Effect_Class.liftEffect(dictMonadEffect)(function __do() {
        var v = Halogen_Subscription.create();
        $$void(matchesWith(Routing_Duplex.parse(Route.routeCodec))(function (v1) {
            return function ($$new) {
                return Halogen_Subscription.notify(v.listener)(new Navigate($$new));
            };
        }))();
        return v.emitter;
    });
};
var handleAction = function (dictMonadAff) {
    var monadEffectHalogenM = Halogen_Query_HalogenM.monadEffectHalogenM(dictMonadAff.MonadEffect0());
    var liftEffect = Effect_Class.liftEffect(monadEffectHalogenM);
    var hashChangeEmitter1 = hashChangeEmitter(monadEffectHalogenM);
    return function (v) {
        if (v instanceof Initialize) {
            return discard2(liftEffect(log("[Router] Initializing...")))(function () {
                return bind1(liftEffect(Routing_Hash.getHash))(function (initialHash) {
                    return discard2(liftEffect(log("[Router] Initial hash: " + initialHash)))(function () {
                        return discard2((function () {
                            var v1 = Routing_Duplex.parse(Route.routeCodec)(initialHash);
                            if (v1 instanceof Data_Either.Left) {
                                return discard2(liftEffect(log("[Router] Failed to parse initial route: " + show(v1.value0))))(function () {
                                    return modify_(function (v2) {
                                        var $55 = {};
                                        for (var $56 in v2) {
                                            if ({}.hasOwnProperty.call(v2, $56)) {
                                                $55[$56] = v2[$56];
                                            };
                                        };
                                        $55.route = new Data_Maybe.Just(Route.Home.value);
                                        return $55;
                                    });
                                });
                            };
                            if (v1 instanceof Data_Either.Right) {
                                return discard2(liftEffect(log("[Router] Parsed initial route: " + show1(v1.value0))))(function () {
                                    return modify_(function (v2) {
                                        var $59 = {};
                                        for (var $60 in v2) {
                                            if ({}.hasOwnProperty.call(v2, $60)) {
                                                $59[$60] = v2[$60];
                                            };
                                        };
                                        $59.route = new Data_Maybe.Just(v1.value0);
                                        return $59;
                                    });
                                });
                            };
                            throw new Error("Failed pattern match at Component.Router (line 102, column 5 - line 109, column 43): " + [ v1.constructor.name ]);
                        })())(function () {
                            return void1(bindFlipped(Halogen_Query_HalogenM.subscribe)(hashChangeEmitter1));
                        });
                    });
                });
            });
        };
        if (v instanceof Navigate) {
            return discard2(liftEffect(log("[Router] Navigating to: " + show1(v.value0))))(function () {
                return modify_(function (v1) {
                    var $63 = {};
                    for (var $64 in v1) {
                        if ({}.hasOwnProperty.call(v1, $64)) {
                            $63[$64] = v1[$64];
                        };
                    };
                    $63.route = new Data_Maybe.Just(v.value0);
                    return $63;
                });
            });
        };
        throw new Error("Failed pattern match at Component.Router (line 94, column 16 - line 116, column 39): " + [ v.constructor.name ]);
    };
};
var _worker = /* #__PURE__ */ (function () {
    return Type_Proxy["Proxy"].value;
})();
var _standingsWithPics = /* #__PURE__ */ (function () {
    return Type_Proxy["Proxy"].value;
})();
var _standings = /* #__PURE__ */ (function () {
    return Type_Proxy["Proxy"].value;
})();
var render = function (dictMonadAff) {
    var component1 = Component_Standings.component(dictMonadAff);
    var component2 = Component_StandingsWithPics.component(dictMonadAff);
    var component3 = Component_WorkerPage.component(dictMonadAff);
    return function (v) {
        if (v.route instanceof Data_Maybe.Nothing) {
            return Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("min-h-screen flex items-center justify-center") ])([ Halogen_HTML_Core.text("Loading...") ]);
        };
        if (v.route instanceof Data_Maybe.Just && v.route.value0 instanceof Route.Home) {
            return Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("min-h-screen flex items-center justify-center") ])([ Halogen_HTML_Elements.div_([ Halogen_HTML_Elements.h1([ Halogen_HTML_Properties.class_("text-4xl font-bold mb-4") ])([ Halogen_HTML_Core.text("Let's Play Scrabble") ]), Halogen_HTML_Elements.p_([ Halogen_HTML_Core.text("Navigate to /overlay/standings or /worker") ]) ]) ]);
        };
        if (v.route instanceof Data_Maybe.Just && v.route.value0 instanceof Route.Standings) {
            return slot_1(_standings)(Data_Unit.unit)(component1)({
                userId: v.route.value0.value0.userId,
                tournamentId: map(Domain_Types.TournamentId)(v.route.value0.value0.tournamentId),
                divisionName: v.route.value0.value0.divisionName
            });
        };
        if (v.route instanceof Data_Maybe.Just && v.route.value0 instanceof Route.StandingsWithPics) {
            return slot_2(_standingsWithPics)(Data_Unit.unit)(component2)({
                userId: v.route.value0.value0.userId,
                tournamentId: map(Domain_Types.TournamentId)(v.route.value0.value0.tournamentId),
                divisionName: v.route.value0.value0.divisionName
            });
        };
        if (v.route instanceof Data_Maybe.Just && v.route.value0 instanceof Route.Worker) {
            return slot_3(_worker)(Data_Unit.unit)(component3)(Data_Unit.unit);
        };
        throw new Error("Failed pattern match at Component.Router (line 58, column 3 - line 91, column 54): " + [ v.route.constructor.name ]);
    };
};

// | Router component
var component = function (dictMonadAff) {
    return Halogen_Component.mkComponent({
        initialState: function (v) {
            return {
                route: Data_Maybe.Nothing.value
            };
        },
        render: render(dictMonadAff),
        "eval": Halogen_Component.mkEval({
            handleQuery: Halogen_Component.defaultEval.handleQuery,
            receive: Halogen_Component.defaultEval.receive,
            finalize: Halogen_Component.defaultEval.finalize,
            handleAction: handleAction(dictMonadAff),
            initialize: new Data_Maybe.Just(Initialize.value)
        })
    });
};
export {
    Initialize,
    Navigate,
    _standings,
    _standingsWithPics,
    _worker,
    component,
    render,
    handleAction,
    hashChangeEmitter
};
