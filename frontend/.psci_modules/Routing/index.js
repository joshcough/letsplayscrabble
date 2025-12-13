import * as Data_Maybe from "../Data.Maybe/index.js";
import * as JSURI from "../JSURI/index.js";
import * as Routing_Match from "../Routing.Match/index.js";
import * as Routing_Parser from "../Routing.Parser/index.js";
var fromJust = /* #__PURE__ */ Data_Maybe.fromJust();

// | Runs a `Match` parser given a custom String decoder.
var matchWith = function (decoder) {
    return function (matcher) {
        var $2 = Routing_Match.runMatch(matcher);
        var $3 = Routing_Parser.parse(decoder);
        return function ($4) {
            return $2($3($4));
        };
    };
};

// | Runs a `Match` parser.
var match = /* #__PURE__ */ matchWith(function ($6) {
    return fromJust(JSURI["decodeURIComponent"]($6));
});
export {
    match,
    matchWith
};
