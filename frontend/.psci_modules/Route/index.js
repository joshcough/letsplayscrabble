// | Route definitions for the application
import * as Data_Eq from "../Data.Eq/index.js";
import * as Data_Generic_Rep from "../Data.Generic.Rep/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Ord from "../Data.Ord/index.js";
import * as Data_Ordering from "../Data.Ordering/index.js";
import * as Routing_Duplex from "../Routing.Duplex/index.js";
import * as Routing_Duplex_Generic from "../Routing.Duplex.Generic/index.js";
import * as Routing_Duplex_Generic_Syntax from "../Routing.Duplex.Generic.Syntax/index.js";
var eq = /* #__PURE__ */ Data_Eq.eq(/* #__PURE__ */ Data_Maybe.eqMaybe(Data_Eq.eqString));
var eq1 = /* #__PURE__ */ Data_Eq.eq(/* #__PURE__ */ Data_Maybe.eqMaybe(Data_Eq.eqInt));
var compare = /* #__PURE__ */ Data_Ord.compare(/* #__PURE__ */ Data_Maybe.ordMaybe(Data_Ord.ordString));
var compare1 = /* #__PURE__ */ Data_Ord.compare(/* #__PURE__ */ Data_Maybe.ordMaybe(Data_Ord.ordInt));
var compare2 = /* #__PURE__ */ Data_Ord.compare(Data_Ord.ordInt);
var gsep = /* #__PURE__ */ Routing_Duplex_Generic_Syntax.gsep(/* #__PURE__ */ Routing_Duplex_Generic_Syntax.gsepStringRoute(Routing_Duplex_Generic.gRouteAll));
var gparams = /* #__PURE__ */ Routing_Duplex_Generic_Syntax.gparams(/* #__PURE__ */ Routing_Duplex_Generic_Syntax.gparamsString(/* #__PURE__ */ Routing_Duplex.routeDuplexParams()(/* #__PURE__ */ Routing_Duplex.buildParamsCons({
    reflectSymbol: function () {
        return "divisionName";
    }
})()()()()(/* #__PURE__ */ Routing_Duplex.buildParamsCons({
    reflectSymbol: function () {
        return "tournamentId";
    }
})()()()()(/* #__PURE__ */ Routing_Duplex.buildParamsCons({
    reflectSymbol: function () {
        return "userId";
    }
})()()()()(Routing_Duplex.buildParamsNil))))));

// | Application routes
var Home = /* #__PURE__ */ (function () {
    function Home() {

    };
    Home.value = new Home();
    return Home;
})();

// | Application routes
var Standings = /* #__PURE__ */ (function () {
    function Standings(value0) {
        this.value0 = value0;
    };
    Standings.create = function (value0) {
        return new Standings(value0);
    };
    return Standings;
})();

// | Application routes
var StandingsWithPics = /* #__PURE__ */ (function () {
    function StandingsWithPics(value0) {
        this.value0 = value0;
    };
    StandingsWithPics.create = function (value0) {
        return new StandingsWithPics(value0);
    };
    return StandingsWithPics;
})();

// | Application routes
var Worker = /* #__PURE__ */ (function () {
    function Worker() {

    };
    Worker.value = new Worker();
    return Worker;
})();
var showRoute = {
    show: function (v) {
        if (v instanceof Home) {
            return "Home";
        };
        if (v instanceof Standings) {
            return "Standings";
        };
        if (v instanceof StandingsWithPics) {
            return "StandingsWithPics";
        };
        if (v instanceof Worker) {
            return "Worker";
        };
        throw new Error("Failed pattern match at Route (line 32, column 10 - line 36, column 23): " + [ v.constructor.name ]);
    }
};
var genericRoute_ = {
    to: function (x) {
        if (x instanceof Data_Generic_Rep.Inl) {
            return Home.value;
        };
        if (x instanceof Data_Generic_Rep.Inr && x.value0 instanceof Data_Generic_Rep.Inl) {
            return new Standings(x.value0.value0);
        };
        if (x instanceof Data_Generic_Rep.Inr && (x.value0 instanceof Data_Generic_Rep.Inr && x.value0.value0 instanceof Data_Generic_Rep.Inl)) {
            return new StandingsWithPics(x.value0.value0.value0);
        };
        if (x instanceof Data_Generic_Rep.Inr && (x.value0 instanceof Data_Generic_Rep.Inr && x.value0.value0 instanceof Data_Generic_Rep.Inr)) {
            return Worker.value;
        };
        throw new Error("Failed pattern match at Route (line 27, column 1 - line 27, column 32): " + [ x.constructor.name ]);
    },
    from: function (x) {
        if (x instanceof Home) {
            return new Data_Generic_Rep.Inl(Data_Generic_Rep.NoArguments.value);
        };
        if (x instanceof Standings) {
            return new Data_Generic_Rep.Inr(new Data_Generic_Rep.Inl(x.value0));
        };
        if (x instanceof StandingsWithPics) {
            return new Data_Generic_Rep.Inr(new Data_Generic_Rep.Inr(new Data_Generic_Rep.Inl(x.value0)));
        };
        if (x instanceof Worker) {
            return new Data_Generic_Rep.Inr(new Data_Generic_Rep.Inr(new Data_Generic_Rep.Inr(Data_Generic_Rep.NoArguments.value)));
        };
        throw new Error("Failed pattern match at Route (line 27, column 1 - line 27, column 32): " + [ x.constructor.name ]);
    }
};
var eqRoute = {
    eq: function (x) {
        return function (y) {
            if (x instanceof Home && y instanceof Home) {
                return true;
            };
            if (x instanceof Standings && y instanceof Standings) {
                return eq(x.value0.divisionName)(y.value0.divisionName) && eq1(x.value0.tournamentId)(y.value0.tournamentId) && x.value0.userId === y.value0.userId;
            };
            if (x instanceof StandingsWithPics && y instanceof StandingsWithPics) {
                return eq(x.value0.divisionName)(y.value0.divisionName) && eq1(x.value0.tournamentId)(y.value0.tournamentId) && x.value0.userId === y.value0.userId;
            };
            if (x instanceof Worker && y instanceof Worker) {
                return true;
            };
            return false;
        };
    }
};
var ordRoute = {
    compare: function (x) {
        return function (y) {
            if (x instanceof Home && y instanceof Home) {
                return Data_Ordering.EQ.value;
            };
            if (x instanceof Home) {
                return Data_Ordering.LT.value;
            };
            if (y instanceof Home) {
                return Data_Ordering.GT.value;
            };
            if (x instanceof Standings && y instanceof Standings) {
                var v = compare(x.value0.divisionName)(y.value0.divisionName);
                if (v instanceof Data_Ordering.LT) {
                    return Data_Ordering.LT.value;
                };
                if (v instanceof Data_Ordering.GT) {
                    return Data_Ordering.GT.value;
                };
                var v1 = compare1(x.value0.tournamentId)(y.value0.tournamentId);
                if (v1 instanceof Data_Ordering.LT) {
                    return Data_Ordering.LT.value;
                };
                if (v1 instanceof Data_Ordering.GT) {
                    return Data_Ordering.GT.value;
                };
                return compare2(x.value0.userId)(y.value0.userId);
            };
            if (x instanceof Standings) {
                return Data_Ordering.LT.value;
            };
            if (y instanceof Standings) {
                return Data_Ordering.GT.value;
            };
            if (x instanceof StandingsWithPics && y instanceof StandingsWithPics) {
                var v = compare(x.value0.divisionName)(y.value0.divisionName);
                if (v instanceof Data_Ordering.LT) {
                    return Data_Ordering.LT.value;
                };
                if (v instanceof Data_Ordering.GT) {
                    return Data_Ordering.GT.value;
                };
                var v1 = compare1(x.value0.tournamentId)(y.value0.tournamentId);
                if (v1 instanceof Data_Ordering.LT) {
                    return Data_Ordering.LT.value;
                };
                if (v1 instanceof Data_Ordering.GT) {
                    return Data_Ordering.GT.value;
                };
                return compare2(x.value0.userId)(y.value0.userId);
            };
            if (x instanceof StandingsWithPics) {
                return Data_Ordering.LT.value;
            };
            if (y instanceof StandingsWithPics) {
                return Data_Ordering.GT.value;
            };
            if (x instanceof Worker && y instanceof Worker) {
                return Data_Ordering.EQ.value;
            };
            throw new Error("Failed pattern match at Route (line 0, column 0 - line 0, column 0): " + [ x.constructor.name, y.constructor.name ]);
        };
    },
    Eq0: function () {
        return eqRoute;
    }
};

// | Route codec for parsing and printing routes
// | URLs will be: #/overlay/standings?userId=2&tournamentId=135&divisionName=A
var routeCodec = /* #__PURE__ */ Routing_Duplex.root(/* #__PURE__ */ Routing_Duplex_Generic.sum(genericRoute_)(/* #__PURE__ */ Routing_Duplex_Generic.gRouteSum(/* #__PURE__ */ Routing_Duplex_Generic.gRouteConstructor({
    reflectSymbol: function () {
        return "Home";
    }
})()(Routing_Duplex_Generic.gRouteNoArguments))(/* #__PURE__ */ Routing_Duplex_Generic.gRouteSum(/* #__PURE__ */ Routing_Duplex_Generic.gRouteConstructor({
    reflectSymbol: function () {
        return "Standings";
    }
})()(Routing_Duplex_Generic.gRouteArgument))(/* #__PURE__ */ Routing_Duplex_Generic.gRouteSum(/* #__PURE__ */ Routing_Duplex_Generic.gRouteConstructor({
    reflectSymbol: function () {
        return "StandingsWithPics";
    }
})()(Routing_Duplex_Generic.gRouteArgument))(/* #__PURE__ */ Routing_Duplex_Generic.gRouteConstructor({
    reflectSymbol: function () {
        return "Worker";
    }
})()(Routing_Duplex_Generic.gRouteNoArguments)))))({
    Home: Routing_Duplex_Generic.noArgs,
    Standings: /* #__PURE__ */ gsep("overlay")(/* #__PURE__ */ gparams("standings")({
        userId: Routing_Duplex["int"],
        tournamentId: function ($125) {
            return Routing_Duplex.optional(Routing_Duplex["int"]($125));
        },
        divisionName: function ($126) {
            return Routing_Duplex.optional(Routing_Duplex.string($126));
        }
    })),
    StandingsWithPics: /* #__PURE__ */ gsep("overlay")(/* #__PURE__ */ gparams("standings-with-pics")({
        userId: Routing_Duplex["int"],
        tournamentId: function ($127) {
            return Routing_Duplex.optional(Routing_Duplex["int"]($127));
        },
        divisionName: function ($128) {
            return Routing_Duplex.optional(Routing_Duplex.string($128));
        }
    })),
    Worker: /* #__PURE__ */ Routing_Duplex_Generic_Syntax.gsep(/* #__PURE__ */ Routing_Duplex_Generic_Syntax.gsepStringRoute(Routing_Duplex_Generic.gRouteNoArguments))("worker")(Routing_Duplex_Generic.noArgs)
}));
export {
    Home,
    Standings,
    StandingsWithPics,
    Worker,
    routeCodec,
    genericRoute_,
    eqRoute,
    ordRoute,
    showRoute
};
