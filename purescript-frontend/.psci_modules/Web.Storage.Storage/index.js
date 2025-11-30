// | This module defines a data type and various functions for interacting
// | with the `Storage` interface of the Web Storage API.
// | For example:
// |
// | ```purescript
// | import Prelude
// | import Effect (Effect)
// | import Effect.Console (log, logShow)
// | import Web.HTML (window)
// | import Web.HTML.Window (localStorage)
// | import Web.Storage.Storage (clear, getItem, removeItem, setItem)
// |
// | main :: Effect Unit
// | main = do
// |   w <- window
// |   s <- localStorage w
// |   setItem "this-is-my-key" "Here is my value." s
// |   v <- getItem "this-is-my-key" s
// |   logShow v
// |
// |   removeItem "this-is-my-key" s
// |   v' <- getItem "this-is-my-key" s
// |   log "It is gone!"
// |   logShow v'
// |
// |   clear s
// | ```
import * as $foreign from "./foreign.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Nullable from "../Data.Nullable/index.js";
import * as Effect from "../Effect/index.js";
var map = /* #__PURE__ */ Data_Functor.map(Effect.functorEffect);

// | Retrieves the key at the given index in the storage, if one exists.
var key = function (i) {
    var $2 = map(Data_Nullable.toMaybe);
    var $3 = $foreign["_key"](i);
    return function ($4) {
        return $2($3($4));
    };
};

// | Retrieves the value stored at the given key, if one exists.
var getItem = function (s) {
    var $5 = map(Data_Nullable.toMaybe);
    var $6 = $foreign["_getItem"](s);
    return function ($7) {
        return $5($6($7));
    };
};
export {
    length,
    setItem,
    removeItem,
    clear
} from "./foreign.js";
export {
    key,
    getItem
};
