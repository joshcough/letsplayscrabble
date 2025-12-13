import * as $foreign from "./foreign.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Nullable from "../Data.Nullable/index.js";
import * as Data_Ordering from "../Data.Ordering/index.js";
import * as Effect from "../Effect/index.js";
var mapFlipped = /* #__PURE__ */ Data_Functor.mapFlipped(Effect.functorEffect);
var Copy = /* #__PURE__ */ (function () {
    function Copy() {

    };
    Copy.value = new Copy();
    return Copy;
})();
var Link = /* #__PURE__ */ (function () {
    function Link() {

    };
    Link.value = new Link();
    return Link;
})();
var Move = /* #__PURE__ */ (function () {
    function Move() {

    };
    Move.value = new Move();
    return Move;
})();
var None = /* #__PURE__ */ (function () {
    function None() {

    };
    None.value = new None();
    return None;
})();

// | Sets the data transfer object's drop effect.
var setDropEffect = function (de) {
    return $foreign["_setDropEffect"]((function () {
        if (de instanceof Copy) {
            return "copy";
        };
        if (de instanceof Link) {
            return "link";
        };
        if (de instanceof Move) {
            return "move";
        };
        if (de instanceof None) {
            return "none";
        };
        throw new Error("Failed pattern match at Web.HTML.Event.DataTransfer (line 97, column 35 - line 101, column 17): " + [ de.constructor.name ]);
    })());
};

// | Sets the image to be used for dragging if a custom one is desired.
// | The image will typically be an <image> but could be any other *visible* element.
// | The x and y coordinates define where the image appears relative to the mouse.
var setDragImage = $foreign["_setDragImage"];

// | Sets the data transfer object's data for a given media format.
var setData = function (v) {
    return function (dat) {
        return function (dt) {
            return $foreign["_setData"](v)(dat)(dt);
        };
    };
};

// | Retrieves the data for a given media type, or an empty string if data for
// | that type does not exist or the data transfer object contains no data.
var getData = function (v) {
    return function (dt) {
        return $foreign["_getData"](v)(dt);
    };
};

// | Contains a list of all the local files available on the data transfer.
// | Empty if the drag operation doesn't involve dragging files.
// |
// | It's possible that a drag operation may have null files, instead of an
// | empty file list. In these cases Nothing is returned.
var files = /* #__PURE__ */ Data_Functor.map(Data_Functor.functorFn)(Data_Nullable.toMaybe)($foreign["_files"]);
var eqDropEffect = {
    eq: function (x) {
        return function (y) {
            if (x instanceof Copy && y instanceof Copy) {
                return true;
            };
            if (x instanceof Link && y instanceof Link) {
                return true;
            };
            if (x instanceof Move && y instanceof Move) {
                return true;
            };
            if (x instanceof None && y instanceof None) {
                return true;
            };
            return false;
        };
    }
};
var ordDropEffect = {
    compare: function (x) {
        return function (y) {
            if (x instanceof Copy && y instanceof Copy) {
                return Data_Ordering.EQ.value;
            };
            if (x instanceof Copy) {
                return Data_Ordering.LT.value;
            };
            if (y instanceof Copy) {
                return Data_Ordering.GT.value;
            };
            if (x instanceof Link && y instanceof Link) {
                return Data_Ordering.EQ.value;
            };
            if (x instanceof Link) {
                return Data_Ordering.LT.value;
            };
            if (y instanceof Link) {
                return Data_Ordering.GT.value;
            };
            if (x instanceof Move && y instanceof Move) {
                return Data_Ordering.EQ.value;
            };
            if (x instanceof Move) {
                return Data_Ordering.LT.value;
            };
            if (y instanceof Move) {
                return Data_Ordering.GT.value;
            };
            if (x instanceof None && y instanceof None) {
                return Data_Ordering.EQ.value;
            };
            throw new Error("Failed pattern match at Web.HTML.Event.DataTransfer (line 0, column 0 - line 0, column 0): " + [ x.constructor.name, y.constructor.name ]);
        };
    },
    Eq0: function () {
        return eqDropEffect;
    }
};

// | Gets the data transfer object's drop effect.
var dropEffect = function (dt) {
    return mapFlipped($foreign["_dropEffect"](dt))(function (v) {
        if (v === "copy") {
            return Copy.value;
        };
        if (v === "link") {
            return Link.value;
        };
        if (v === "move") {
            return Move.value;
        };
        if (v === "none") {
            return None.value;
        };
        return None.value;
    });
};
export {
    items,
    types
} from "./foreign.js";
export {
    files,
    getData,
    setData,
    setDragImage,
    Copy,
    Link,
    Move,
    None,
    dropEffect,
    setDropEffect,
    eqDropEffect,
    ordDropEffect
};
