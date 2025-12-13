import * as Data_Eq from "../Data.Eq/index.js";
import * as Data_Ord from "../Data.Ord/index.js";
var PropName = function (x) {
    return x;
};

// | A wrapper for strings which are used as CSS classes.
var ClassName = function (x) {
    return x;
};

// | A wrapper for attribute names.
var AttrName = function (x) {
    return x;
};
var ordPropName = Data_Ord.ordString;
var ordClassName = Data_Ord.ordString;
var ordAttrName = Data_Ord.ordString;
var newtypePropName = {
    Coercible0: function () {
        return undefined;
    }
};
var newtypeClassName = {
    Coercible0: function () {
        return undefined;
    }
};
var newtypeAttrName = {
    Coercible0: function () {
        return undefined;
    }
};
var eqPropName = Data_Eq.eqString;
var eqClassName = Data_Eq.eqString;
var eqAttrName = Data_Eq.eqString;
export {
    PropName,
    AttrName,
    ClassName,
    newtypePropName,
    eqPropName,
    ordPropName,
    newtypeAttrName,
    eqAttrName,
    ordAttrName,
    newtypeClassName,
    eqClassName,
    ordClassName
};
