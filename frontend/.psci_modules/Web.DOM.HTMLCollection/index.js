import * as $foreign from "./foreign.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Nullable from "../Data.Nullable/index.js";
import * as Effect from "../Effect/index.js";
import * as Web_DOM_Internal_Types from "../Web.DOM.Internal.Types/index.js";
var map = /* #__PURE__ */ Data_Functor.map(Effect.functorEffect);

// | The first element with the specified name or ID in a HTMLCollection, or
// | Nothing if no such element exists.
var namedItem = function (id) {
    var $2 = map(Data_Nullable.toMaybe);
    var $3 = $foreign["_namedItem"](id);
    return function ($4) {
        return $2($3($4));
    };
};

// | The element in a HTMLCollection at the specified index, or Nothing if no such
// | element exists.
var item = function (i) {
    var $5 = map(Data_Nullable.toMaybe);
    var $6 = $foreign["_item"](i);
    return function ($7) {
        return $5($6($7));
    };
};
export {
    length,
    toArray
} from "./foreign.js";
export {
    item,
    namedItem
};
