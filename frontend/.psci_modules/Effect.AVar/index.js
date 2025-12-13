import * as $foreign from "./foreign.js";
import * as Data_Either from "../Data.Either/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
var Killed = /* #__PURE__ */ (function () {
    function Killed(value0) {
        this.value0 = value0;
    };
    Killed.create = function (value0) {
        return new Killed(value0);
    };
    return Killed;
})();
var Filled = /* #__PURE__ */ (function () {
    function Filled(value0) {
        this.value0 = value0;
    };
    Filled.create = function (value0) {
        return new Filled(value0);
    };
    return Filled;
})();
var Empty = /* #__PURE__ */ (function () {
    function Empty() {

    };
    Empty.value = new Empty();
    return Empty;
})();

// | Creates a fresh AVar with an initial value.
var $$new = $foreign["_newVar"];
var isKilled = function (v) {
    if (v instanceof Killed) {
        return true;
    };
    return false;
};
var isFilled = function (v) {
    if (v instanceof Filled) {
        return true;
    };
    return false;
};
var isEmpty = function (v) {
    if (v instanceof Empty) {
        return true;
    };
    return false;
};
var ffiUtil = /* #__PURE__ */ (function () {
    return {
        left: Data_Either.Left.create,
        right: Data_Either.Right.create,
        nothing: Data_Maybe.Nothing.value,
        just: Data_Maybe.Just.create,
        killed: Killed.create,
        filled: Filled.create,
        empty: Empty.value
    };
})();

// | Kills the AVar with an exception. All pending and future actions will
// | resolve immediately with the provided exception.
var kill = function (err) {
    return function (avar) {
        return $foreign["_killVar"](ffiUtil, err, avar);
    };
};

// | Sets the value of the AVar. If the AVar is already filled, it will be
// | queued until the value is emptied. Multiple puts will resolve in order as
// | the AVar becomes available. Returns an effect which will remove the
// | callback from the pending queue.
var put = function (value) {
    return function (avar) {
        return function (cb) {
            return $foreign["_putVar"](ffiUtil, value, avar, cb);
        };
    };
};

// | Reads the AVar value. Unlike `take`, this will not leave the AVar empty.
// | If the AVar is empty, this will queue until it is filled. Multiple reads
// | will resolve at the same time, as soon as possible.
var read = function (avar) {
    return function (cb) {
        return $foreign["_readVar"](ffiUtil, avar, cb);
    };
};

// | Synchronously checks the status of an AVar.
var status = function (avar) {
    return $foreign["_status"](ffiUtil, avar);
};

// | Takes the AVar value, leaving it empty. If the AVar is already empty,
// | the callback will be queued until the AVar is filled. Multiple takes will
// | resolve in order as the AVar fills. Returns an effect which will remove
// | the callback from the pending queue.
var take = function (avar) {
    return function (cb) {
        return $foreign["_takeVar"](ffiUtil, avar, cb);
    };
};

// | Attempts to synchronously fill an AVar. If the AVar is already filled,
// | this will do nothing. Returns true or false depending on if it succeeded.
var tryPut = function (value) {
    return function (avar) {
        return $foreign["_tryPutVar"](ffiUtil, value, avar);
    };
};

// | Attempts to synchronously read an AVar. If the AVar is empty, this will
// | return `Nothing`.
var tryRead = function (avar) {
    return $foreign["_tryReadVar"](ffiUtil, avar);
};

// | Attempts to synchronously take an AVar value, leaving it empty. If the
// | AVar is empty, this will return `Nothing`.
var tryTake = function (avar) {
    return $foreign["_tryTakeVar"](ffiUtil, avar);
};
export {
    empty
} from "./foreign.js";
export {
    Killed,
    Filled,
    Empty,
    $$new as new,
    take,
    tryTake,
    put,
    tryPut,
    read,
    tryRead,
    kill,
    status,
    isEmpty,
    isFilled,
    isKilled
};
