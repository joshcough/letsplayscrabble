import * as $foreign from "./foreign.js";
import * as Data_Eq from "../Data.Eq/index.js";

// | The `Eq` instance first checks `unsafeRefEq`, if `false` falls back to
// | the underlying `Eq` instance.
var UnsafeRefEqFallback = function (x) {
    return x;
};

// | The `Eq` instance is defined by `unsafeRefEq`.
var UnsafeRefEq = function (x) {
    return x;
};

// | Compares two values of the same type using strict (`===`) equality.
var unsafeRefEq = $foreign.reallyUnsafeRefEq;
var eqUnsafeRefEqFallback = function (dictEq) {
    var eq = Data_Eq.eq(dictEq);
    return {
        eq: function (v) {
            return function (v1) {
                return unsafeRefEq(v)(v1) || eq(v)(v1);
            };
        }
    };
};
var eqUnsafeRefEq = {
    eq: function (v) {
        return function (v1) {
            return unsafeRefEq(v)(v1);
        };
    }
};
export {
    reallyUnsafeRefEq
} from "./foreign.js";
export {
    unsafeRefEq,
    UnsafeRefEq,
    UnsafeRefEqFallback,
    eqUnsafeRefEq,
    eqUnsafeRefEqFallback
};
