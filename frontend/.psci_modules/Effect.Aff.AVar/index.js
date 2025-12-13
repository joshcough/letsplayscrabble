import * as Effect_AVar from "../Effect.AVar/index.js";
import * as Effect_Aff from "../Effect.Aff/index.js";
import * as Effect_Class from "../Effect.Class/index.js";
var liftEffect = /* #__PURE__ */ Effect_Class.liftEffect(Effect_Aff.monadEffectAff);

// | Attempts to synchronously take an AVar value, leaving it empty. If the
// | AVar is empty, this will return `Nothing`.
var tryTake = function ($4) {
    return liftEffect(Effect_AVar.tryTake($4));
};

// | Attempts to synchronously read an AVar. If the AVar is empty, this will
// | return `Nothing`.
var tryRead = function ($5) {
    return liftEffect(Effect_AVar.tryRead($5));
};

// | Attempts to synchronously fill an AVar. If the AVar is already filled,
// | this will do nothing. Returns true or false depending on if it succeeded.
var tryPut = function (value) {
    var $6 = Effect_AVar.tryPut(value);
    return function ($7) {
        return liftEffect($6($7));
    };
};

// | Takes the AVar value, leaving it empty. If the AVar is already empty,
// | the callback will be queued until the AVar is filled. Multiple takes will
// | resolve in order as the AVar fills.
var take = function (avar) {
    return Effect_Aff.makeAff(function (k) {
        return function __do() {
            var c = Effect_AVar.take(avar)(k)();
            return Effect_Aff.effectCanceler(c);
        };
    });
};

// | Synchronously checks the status of an AVar.
var status = function ($8) {
    return liftEffect(Effect_AVar.status($8));
};

// | Reads the AVar value. Unlike `take`, this will not leave the AVar empty.
// | If the AVar is empty, this will queue until it is filled. Multiple reads
// | will resolve at the same time, as soon as possible.
var read = function (avar) {
    return Effect_Aff.makeAff(function (k) {
        return function __do() {
            var c = Effect_AVar.read(avar)(k)();
            return Effect_Aff.effectCanceler(c);
        };
    });
};

// | Sets the value of the AVar. If the AVar is already filled, it will be
// | queued until the value is emptied. Multiple puts will resolve in order as
// | the AVar becomes available.
var put = function (value) {
    return function (avar) {
        return Effect_Aff.makeAff(function (k) {
            return function __do() {
                var c = Effect_AVar.put(value)(avar)(k)();
                return Effect_Aff.effectCanceler(c);
            };
        });
    };
};

// | Creates a fresh AVar with an initial value.
var $$new = function ($9) {
    return liftEffect(Effect_AVar["new"]($9));
};

// | Kills the AVar with an exception. All pending and future actions will
// | resolve immediately with the provided exception.
var kill = function (error) {
    var $10 = Effect_AVar.kill(error);
    return function ($11) {
        return liftEffect($10($11));
    };
};

// | Creates a fresh AVar.
var empty = /* #__PURE__ */ liftEffect(Effect_AVar.empty);
export {
    $$new as new,
    empty,
    status,
    take,
    tryTake,
    put,
    tryPut,
    read,
    tryRead,
    kill
};
export {
    Empty,
    Filled,
    Killed,
    isEmpty,
    isFilled,
    isKilled
} from "../Effect.AVar/index.js";
