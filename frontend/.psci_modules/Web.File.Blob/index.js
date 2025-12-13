import * as $foreign from "./foreign.js";
import * as Data_Int from "../Data.Int/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Number from "../Data.Number/index.js";

// | An index into the Blob indicating the first byte that will *not* be included
// | in the new Blob (i.e. the byte exactly at this index is not included).
// | If you specify a negative value, it's treated as an offset from the end of
// | the string toward the beginning. For example, -10 would be the 10th from
// | last byte in the Blob. The default value is size.
var EndByte = function (x) {
    return x;
};

// | An index into the Blob indicating the first byte to include in the new Blob.
// | If you specify a negative value, it's treated as an offset from the end of the
// | string toward the beginning. For example, -10 would be the 10th from last byte
// | in the Blob. If you specify a value for start that is larger than the size
// | of the source Blob, the returned Blob has size 0 and contains no data.
var StartByte = function (x) {
    return x;
};

// | `MediaType` of the data contained in the `Blob`.
// | Returns `Nothing` if the `MediaType` is unknown.
var type_ = function (blob) {
    var blobType = $foreign.typeImpl(blob);
    var $2 = blobType === "";
    if ($2) {
        return Data_Maybe.Nothing.value;
    };
    return new Data_Maybe.Just(blobType);
};

// | Creates a new `Blob` object containing the data in the specified range
// | of bytes of the source Blob.
var slice$prime = /* #__PURE__ */ $foreign.slice("");

// | Creates `ByteIdx` from `Number` value using `Math.round`.
var idxFromNumber = function ($3) {
    return Data_Number.round($3);
};

// | Creates `ByteIdx` from `Int` value
var idxFromInt = function ($4) {
    return Data_Int.toNumber($4);
};

// | Creates a String with the given Mediatype
// | For example:
// | ```
// | myBlob = fromString (unsafeStringify { name: "Carl", age: 25 }) (MediaType "application/json")
// | ```
var fromString = function (str) {
    return function (ct) {
        return $foreign.blobImpl([ str ])(ct);
    };
};

// | Creates a Blob from an Array of strings with the given Mediatype
var fromArray = function (args) {
    return function (opts) {
        return $foreign.blobImpl(args)(opts);
    };
};
export {
    size,
    slice
} from "./foreign.js";
export {
    fromString,
    fromArray,
    type_,
    StartByte,
    EndByte,
    idxFromInt,
    idxFromNumber,
    slice$prime
};
