// | Functions and types used to describe the `HalogenF` algebra used in a
// | component's `eval` function.
import * as Control_Bind from "../Control.Bind/index.js";
import * as Control_Category from "../Control.Category/index.js";
import * as Control_Monad_State_Class from "../Control.Monad.State.Class/index.js";
import * as Control_Monad_Trans_Class from "../Control.Monad.Trans.Class/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Unit from "../Data.Unit/index.js";
import * as Effect_Aff_Class from "../Effect.Aff.Class/index.js";
import * as Effect_Class from "../Effect.Class/index.js";
import * as Halogen_Query_HalogenM from "../Halogen.Query.HalogenM/index.js";
import * as Halogen_Query_HalogenQ from "../Halogen.Query.HalogenQ/index.js";
import * as Halogen_Query_Input from "../Halogen.Query.Input/index.js";
import * as Web_HTML_HTMLElement from "../Web.HTML.HTMLElement/index.js";
var $$void = /* #__PURE__ */ Data_Functor["void"](Halogen_Query_HalogenM.functorHalogenM);
var queryAll = /* #__PURE__ */ Halogen_Query_HalogenM.queryAll();
var query = /* #__PURE__ */ Halogen_Query_HalogenM.query();
var identity = /* #__PURE__ */ Control_Category.identity(Control_Category.categoryFn);
var bindFlipped = /* #__PURE__ */ Control_Bind.bindFlipped(Data_Maybe.bindMaybe);
var tellAll = function () {
    return function (dictIsSymbol) {
        var queryAll1 = queryAll(dictIsSymbol);
        return function (dictOrd) {
            var queryAll2 = queryAll1(dictOrd);
            return function (label) {
                return function (req) {
                    return $$void(queryAll2(label)(req(Data_Unit.unit)));
                };
            };
        };
    };
};
var tell = function () {
    return function (dictIsSymbol) {
        var query1 = query(dictIsSymbol);
        return function (dictOrd) {
            var query2 = query1(dictOrd);
            return function (slot) {
                return function (label) {
                    return function (req) {
                        return $$void(query2(slot)(label)(req(Data_Unit.unit)));
                    };
                };
            };
        };
    };
};
var requestAll = function () {
    return function (dictIsSymbol) {
        var queryAll1 = queryAll(dictIsSymbol);
        return function (dictOrd) {
            var queryAll2 = queryAll1(dictOrd);
            return function (label) {
                return function (req) {
                    return queryAll2(label)(req(identity));
                };
            };
        };
    };
};
var request = function () {
    return function (dictIsSymbol) {
        var query1 = query(dictIsSymbol);
        return function (dictOrd) {
            var query2 = query1(dictOrd);
            return function (slot) {
                return function (label) {
                    return function (req) {
                        return query2(slot)(label)(req(identity));
                    };
                };
            };
        };
    };
};

// | Takes a data constructor of query algebra `f` and creates a tell query.
// |
// | For example:
// |
// | ```purescript
// | data Query a = Tick a
// |
// | sendTick :: forall o. H.HalogenIO Query o Aff -> Aff (Maybe Unit)
// | sendTick app = app.query (H.mkTell Tick)
// | ```
var mkTell = function (act) {
    return act(Data_Unit.unit);
};

// | Takes a data constructor of query algebra `f` and creates a request query.
// |
// | For example:
// |
// | ```purescript
// | data Query a = GetTickCount (Int -> a)
// |
// | getTickCount :: forall o. H.HalogenIO Query o Aff -> Aff (Maybe Int)
// | getTickCount app = app.query (H.mkRequest GetTickCount)
// | ```
var mkRequest = function (req) {
    return req(identity);
};

// | Retrieves a `HTMLElement` value that is associated with a `Ref` in the
// | rendered output of a component. If there is no currently rendered value (or
// | it is not an `HTMLElement`) for the request will return `Nothing`.
var getHTMLElementRef = /* #__PURE__ */ (function () {
    var $24 = Data_Functor.map(Halogen_Query_HalogenM.functorHalogenM)(function (v) {
        return bindFlipped(Web_HTML_HTMLElement.fromElement)(v);
    });
    return function ($25) {
        return $24(Halogen_Query_HalogenM.getRef($25));
    };
})();
export {
    mkTell,
    tell,
    tellAll,
    mkRequest,
    request,
    requestAll,
    getHTMLElementRef
};
export {
    get,
    gets,
    modify,
    modify_,
    put
} from "../Control.Monad.State.Class/index.js";
export {
    lift
} from "../Control.Monad.Trans.Class/index.js";
export {
    liftAff
} from "../Effect.Aff.Class/index.js";
export {
    liftEffect
} from "../Effect.Class/index.js";
export {
    ChildQuery,
    Fork,
    GetRef,
    Join,
    Kill,
    Lift,
    Par,
    Raise,
    State,
    Subscribe,
    Unsubscribe,
    HalogenM,
    fork,
    getRef,
    join,
    kill,
    query,
    queryAll,
    raise,
    subscribe,
    subscribe$prime,
    unsubscribe
} from "../Halogen.Query.HalogenM/index.js";
export {
    Action,
    Finalize,
    Initialize,
    Query,
    Receive
} from "../Halogen.Query.HalogenQ/index.js";
export {
    RefLabel
} from "../Halogen.Query.Input/index.js";
