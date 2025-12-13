// | This module defines the `Cont`inuation monad.
import * as Control_Monad_Cont_Class from "../Control.Monad.Cont.Class/index.js";
import * as Control_Monad_Cont_Trans from "../Control.Monad.Cont.Trans/index.js";
import * as Control_Semigroupoid from "../Control.Semigroupoid/index.js";
import * as Data_Identity from "../Data.Identity/index.js";
import * as Data_Newtype from "../Data.Newtype/index.js";
var compose = /* #__PURE__ */ Control_Semigroupoid.compose(Control_Semigroupoid.semigroupoidFn);
var unwrap = /* #__PURE__ */ Data_Newtype.unwrap();

// | Transform the continuation passed into the continuation-passing function.
var withCont = function (f) {
    return Control_Monad_Cont_Trans.withContT((function () {
        var $2 = compose(Data_Identity.Identity);
        var $3 = compose(unwrap);
        return function ($4) {
            return $2(f($3($4)));
        };
    })());
};

// | Runs a computation in the `Cont` monad.
var runCont = function (cc) {
    return function (k) {
        return unwrap(Control_Monad_Cont_Trans.runContT(cc)(function ($5) {
            return Data_Identity.Identity(k($5));
        }));
    };
};

// | Transform the result of a continuation-passing function.
var mapCont = function (f) {
    return Control_Monad_Cont_Trans.mapContT(function ($6) {
        return Data_Identity.Identity(f(unwrap($6)));
    });
};

// | Creates a computation in the `Cont` monad.
var cont = function (f) {
    return function (c) {
        return f(function ($7) {
            return unwrap(c($7));
        });
    };
};
export {
    cont,
    runCont,
    mapCont,
    withCont
};
export {
    callCC
} from "../Control.Monad.Cont.Class/index.js";
export {
    ContT,
    lift,
    mapContT,
    runContT,
    withContT
} from "../Control.Monad.Cont.Trans/index.js";
