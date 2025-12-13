import * as $foreign from "./foreign.js";
import * as Unsafe_Coerce from "../Unsafe.Coerce/index.js";
import * as Web_File_Blob from "../Web.File.Blob/index.js";

// | (Inherited from `Blob`) `MediaType` of the data contained in the `Blob`.
// | Returns `Nothing` if the `MediaType` is unknown.
var type_ = function ($1) {
    return Web_File_Blob.type_($1);
};
var toBlob = Unsafe_Coerce.unsafeCoerce;

// | (Inherited from `Blob`) The size (in bytes) of the data contained in the `File`.
var size = function ($2) {
    return Web_File_Blob.size($2);
};
export {
    name,
    lastModified
} from "./foreign.js";
export {
    toBlob,
    type_,
    size
};
