// | Formatting utilities
import * as Data_Boolean from "../Data.Boolean/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Show from "../Data.Show/index.js";
import * as Data_String_CodePoints from "../Data.String.CodePoints/index.js";
import * as Data_String_Common from "../Data.String.Common/index.js";
var show = /* #__PURE__ */ Data_Show.show(Data_Show.showInt);

// | Format player name (Last, First -> First Last)
var formatPlayerName = function (name) {
    var v = Data_String_CodePoints.indexOf(",")(name);
    if (v instanceof Data_Maybe.Nothing) {
        return name;
    };
    if (v instanceof Data_Maybe.Just) {
        var rest = Data_String_CodePoints.drop(v.value0 + 1 | 0)(name);
        var lastName = Data_String_CodePoints.take(v.value0)(name);
        var firstName = Data_String_Common.trim(rest);
        return firstName + (" " + lastName);
    };
    throw new Error("Failed pattern match at Utils.Format (line 19, column 3 - line 27, column 37): " + [ v.constructor.name ]);
};

// | Format a number with a sign (+ or -)
var formatNumberWithSign = function (n) {
    if (n > 0) {
        return "+" + show(n);
    };
    if (Data_Boolean.otherwise) {
        return show(n);
    };
    throw new Error("Failed pattern match at Utils.Format (line 11, column 1 - line 11, column 38): " + [ n.constructor.name ]);
};
export {
    formatNumberWithSign,
    formatPlayerName
};
