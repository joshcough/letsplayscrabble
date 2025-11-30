import * as Data_Ord from "../Data.Ord/index.js";
import * as Data_Show from "../Data.Show/index.js";
var show = /* #__PURE__ */ Data_Show.show(Data_Show.showString);
var compare = /* #__PURE__ */ Data_Ord.compare(Data_Ord.ordString);

// | A media type (also known as a **Multipurpose Internet Mail Extensions or
// | MIME type**) is a standard that indicates the nature and format of a
// | document, file, or assortment of bytes. It is defined and standardized in
// | IETF's [RFC 6838](https://tools.ietf.org/html/rfc6838).
var MediaType = function (x) {
    return x;
};
var showMediaType = {
    show: function (v) {
        return "(MediaType " + (show(v) + ")");
    }
};
var newtypeMediaType = {
    Coercible0: function () {
        return undefined;
    }
};
var eqMediaType = {
    eq: function (x) {
        return function (y) {
            return x === y;
        };
    }
};
var ordMediaType = {
    compare: function (x) {
        return function (y) {
            return compare(x)(y);
        };
    },
    Eq0: function () {
        return eqMediaType;
    }
};
export {
    MediaType,
    newtypeMediaType,
    eqMediaType,
    ordMediaType,
    showMediaType
};
