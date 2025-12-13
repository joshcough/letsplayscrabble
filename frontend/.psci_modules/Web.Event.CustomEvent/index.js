import * as $foreign from "./foreign.js";
import * as Data_Nullable from "../Data.Nullable/index.js";
import * as Unsafe_Coerce from "../Unsafe.Coerce/index.js";
import * as Web_Internal_FFI from "../Web.Internal.FFI/index.js";
var toEvent = Unsafe_Coerce.unsafeCoerce;
var newWithOptions = function (ty) {
    return function (v) {
        return $foreign.newOptionsImpl(ty)({
            detail: Data_Nullable.toNullable(v.detail),
            bubbles: v.bubbles,
            cancelable: v.cancelable,
            composed: v.composed
        });
    };
};

// | Create a new `CustomEvent`, storing some data in its `detail` field,
// | and using defaults for everything else.
var new$prime = function (ty) {
    return function (det) {
        return newWithOptions(ty)({
            detail: det,
            bubbles: false,
            cancelable: false,
            composed: false
        });
    };
};
var fromEvent = /* #__PURE__ */ Web_Internal_FFI.unsafeReadProtoTagged("CustomEvent");
export {
    new,
    newOptionsImpl,
    detail
} from "./foreign.js";
export {
    fromEvent,
    toEvent,
    new$prime,
    newWithOptions
};
