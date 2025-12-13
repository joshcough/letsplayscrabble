import * as Control_Applicative from "../Control.Applicative/index.js";
import * as Control_Apply from "../Control.Apply/index.js";
import * as Control_Category from "../Control.Category/index.js";
import * as Data_Foldable from "../Data.Foldable/index.js";
import * as Data_Function from "../Data.Function/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Monoid from "../Data.Monoid/index.js";
import * as Data_Semigroup from "../Data.Semigroup/index.js";
import * as Data_Show from "../Data.Show/index.js";
import * as Data_String_Common from "../Data.String.Common/index.js";
import * as Data_Symbol from "../Data.Symbol/index.js";
import * as Data_Unit from "../Data.Unit/index.js";
import * as Record from "../Record/index.js";
import * as Routing_Duplex_Parser from "../Routing.Duplex.Parser/index.js";
import * as Routing_Duplex_Printer from "../Routing.Duplex.Printer/index.js";
import * as Type_Proxy from "../Type.Proxy/index.js";
var append = /* #__PURE__ */ Data_Semigroup.append(Routing_Duplex_Printer.semigroupRoutePrinter);
var applyFirst = /* #__PURE__ */ Control_Apply.applyFirst(Routing_Duplex_Parser.applyRouteParser);
var pure = /* #__PURE__ */ Control_Applicative.pure(Routing_Duplex_Parser.applicativeRouteParser);

// | This does nothing (internally it's defined as identity).
// | It can be used to restrict a type parameter of a polymorphic `RouteDuplex' a` to `String`.
var identity = /* #__PURE__ */ Control_Category.identity(Control_Category.categoryFn);
var apply = /* #__PURE__ */ Control_Apply.apply(Routing_Duplex_Parser.applyRouteParser);
var map = /* #__PURE__ */ Data_Functor.map(Routing_Duplex_Parser.functorRouteParser);
var foldMap = /* #__PURE__ */ Data_Foldable.foldMap(Data_Foldable.foldableMaybe)(Routing_Duplex_Printer.monoidRoutePRinter);
var mempty = /* #__PURE__ */ Data_Monoid.mempty(Routing_Duplex_Printer.monoidRoutePRinter);
var voidLeft = /* #__PURE__ */ Data_Functor.voidLeft(Routing_Duplex_Parser.functorRouteParser);
var apply1 = /* #__PURE__ */ Control_Apply.apply(Control_Apply.applyFn);
var map1 = /* #__PURE__ */ Data_Functor.map(Data_Functor.functorFn);

// | The core abstraction of this library. The values of this type can be used both for parsing
// | values of type `o` from `String` as well as printing values of type `i` into `String`.
// |
// | For most purposes, you'll likely want `RouteDuplex'` which uses the same
// | type for both parameters.
var RouteDuplex = /* #__PURE__ */ (function () {
    function RouteDuplex(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    RouteDuplex.create = function (value0) {
        return function (value1) {
            return new RouteDuplex(value0, value1);
        };
    };
    return RouteDuplex;
})();

// | Similar to `prefix`. Strips (when parsing) or adds (when printing) a given
// | string segment from the end of the path. The same precautions for `prefix` apply here.
var suffix = function (v) {
    return function (s) {
        return new RouteDuplex(function (a) {
            return append(v.value0(a))(Routing_Duplex_Printer.put(s));
        }, applyFirst(v.value1)(Routing_Duplex_Parser.prefix(s)(pure(Data_Unit.unit))));
    };
};
var string = identity;

// | Consumes or prints a single path segment.
// | **Note:** [URI encoding and decoding](https://en.wikipedia.org/wiki/Percent-encoding) is done automatically.
// |
// | ```purescript
// | parse segment "abc"         == Right "abc"
// | parse segment "abc%20def"   == Right "abc def" -- automatic decoding of uri components
// | parse segment "abc/def"     == Right "abc"
// | parse segment "/abc"        == Right "" -- the empty string before the first '/'
// | parse (root segment) "/abc" == Right "abc"
// |
// | print segment "hello there" == "hello%20there"
// | print segment "" == "/"
// | ```
var segment = /* #__PURE__ */ (function () {
    return new RouteDuplex(Routing_Duplex_Printer.put, Routing_Duplex_Parser.take);
})();

// | Consumes or prints all the remaining segments.
// |
// |```purescript
// | parse rest "" == Right []
// | parse (path "a/b" rest) "a/b/c/d" == Right ["c", "d"]
// |
// | print rest ["a", "b"] == "a/b"
// |```
var rest = /* #__PURE__ */ (function () {
    return new RouteDuplex(Data_Foldable.foldMap(Data_Foldable.foldableArray)(Routing_Duplex_Printer.monoidRoutePRinter)(Routing_Duplex_Printer.put), Routing_Duplex_Parser.rest);
})();

// | Combined with `prop` or `:=`, builds a Record where the order of
// | parsing and printing matters.
// |
// | ```purescript
// | date =
// |   record
// |     # prop (Proxy :: _ "year") (int segment)
// |     # prop (Proxy :: _ "month") (int segment)
// |     # prop (Proxy :: _ "day") (int segment)
// |
// | parse (path "blog" date) "blog/2019/1/2" ==
// |   Right { year: 2019, month: 1, day: 2 }
// | ````
var record = /* #__PURE__ */ (function () {
    return new RouteDuplex(Data_Monoid.mempty(Data_Monoid.monoidFn(Routing_Duplex_Printer.monoidRoutePRinter)), pure({}));
})();

// | See `record`.
var prop = function (dictIsSymbol) {
    var get = Record.get(dictIsSymbol)();
    var insert = Record.insert(dictIsSymbol)()();
    return function () {
        return function () {
            return function () {
                return function (sym) {
                    return function (v) {
                        return function (v1) {
                            return new RouteDuplex(function (r) {
                                return append(v1.value0(r))(v.value0(get(sym)(r)));
                            }, apply(map(Data_Function.flip(insert(sym)))(v1.value1))(v.value1));
                        };
                    };
                };
            };
        };
    };
};
var profunctorRouteDuplex = {
    dimap: function (f) {
        return function (g) {
            return function (v) {
                return new RouteDuplex(function ($137) {
                    return v.value0(f($137));
                }, map(g)(v.value1));
            };
        };
    }
};

// | Renders a value of type `i` into a String representation of URI path,
// | query and fragment (hash).
var print = function (v) {
    return function ($138) {
        return Routing_Duplex_Printer.run(v.value0($138));
    };
};

// | Strips (when parsing) or adds (when printing) a given string segment of the
// | path. **Note:** this combinator only deals with a single segment.
// | If you pass it a string containing '/' it will [percent encode](https://en.wikipedia.org/wiki/Percent-encoding) it and treat it as single segment.
// | E.g. `prefix "/api/v1"` will attempt to match single segment `"%2Fapi%2Fv1"` which is probably not what you want.
// | See `path` if you want to deal with prefixes consisting of multiple segments.
// |
// |```purescript
// | parse (prefix "api" segment) "api/a" == Right "a"
// |
// | parse (prefix "/api/v1" segment)) "/api/v1/a" == Left (Expected "/api/v1" "")
// |
// | -- contrast with `path`
// | parse (path "/api/v1" segment)) "/api/v1/a" == Right "a"
// |```
var prefix = function (s) {
    return function (v) {
        return new RouteDuplex(function (a) {
            return append(Routing_Duplex_Printer.put(s))(v.value0(a));
        }, Routing_Duplex_Parser.prefix(s)(v.value1));
    };
};

// | Strips (when parsing) or adds (when printing) a given String prefix,
// | potentially consisting of multiple path segments. Constrast this with `prefix`,
// | which only deals with single segment.
// |
// |```purescript
// | parse (path "/api/v1" segment) "/api/v1/a" == Right "a"
// | parse (path "/api/v1" segment) "/api/v2/a" == Left (Expected "v1" "v2")
// |```
var path = /* #__PURE__ */ (function () {
    var $139 = Data_Function.flip(Data_Foldable.foldr(Data_Foldable.foldableArray)(prefix));
    var $140 = Data_String_Common.split("/");
    return function ($141) {
        return $139($140($141));
    };
})();

// | Modifies a given codec to require a prefix of '/'.
// | You can think of it as stripping and adding the '/' at the beginning of path,
// | failing if it's not there.
// |
// |```purescript
// | parse (root segment) "/abc" == Right "abc"
// | parse (root segment) "abc" == Left (Expected "" "abc")
// |
// | print (root segment) "abc" == "/abc"
// |```
var root = /* #__PURE__ */ path("");

// | Uses a given codec to parse a value of type `o` out of String representing
// | the path, query and fragment (hash) of a URI (see
// | [URI - generic syntax](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier#Generic_syntax))
// | or produce a `RouteError` if parsing fails.
var parse = function (v) {
    return Routing_Duplex_Parser.run(v.value1);
};

// | Builds a `RouteDuplex` from a record of query parameter parsers/printers, where
// | each property corresponds to a query parameter with the same name.
// |
// | ```purescript
// | search =
// |   params
// |     { page: int
// |     , filter: optional <<< string
// |     }
// |
// | parse search "?page=3&filter=Galaxy%20Quest" ==
// |   Right { page: 3, filter: Just "Galaxy Quest" }
// | ```
var params = function (dict) {
    return dict.params;
};

// | `param name` consumes or prints a query parameter with the given `name`.
// | Parsing will fail if the parameter is not there.
// |
// |```purescript
// | parse (param "search") "?search=keyword" == Right "keyword"
// | parse (param "search") "/"               == Left (MissingParam "search")
// | parse (optional (param "search")) "/"    == Right Nothing
// |```
var param = function (p) {
    return new RouteDuplex(Routing_Duplex_Printer.param(p), Routing_Duplex_Parser.param(p));
};

// | Augments the behavior of a given codec by making it return `Nothing` if parsing
// | fails, or `Just value` if it succeeds.
// |
// |```purescript
// | parse (optional segment) "a"        == Right (Just "a")
// | parse (optional segment) ""         == Right Nothing
// |
// | print (optional segment) (Just "a") == "a"
// | print (optional segment) Nothing    == ""
// |```
var optional = function (v) {
    return new RouteDuplex(foldMap(v.value0), Routing_Duplex_Parser.optional(v.value1));
};

// | Repeatedly applies a given codec to parse one or more values from path segments.
// | Parsing will fail if no segment can be parsed.
// |
// |```purescript
// | parse (many1 (int segment)) "1/2/3/x" == Right [1,2,3]
// | parse (many1 (int segment)) "x",      == Left (Expected "Int" "x") :: Either RouteError (Array Int)
// |```
var many1 = function (dictFoldable) {
    var foldMap1 = Data_Foldable.foldMap(dictFoldable)(Routing_Duplex_Printer.monoidRoutePRinter);
    return function (dictAlt) {
        var many11 = Routing_Duplex_Parser.many1(dictAlt);
        return function (dictApplicative) {
            var many12 = many11(dictApplicative);
            return function (v) {
                return new RouteDuplex(foldMap1(v.value0), many12(v.value1));
            };
        };
    };
};

// | Similar to `many1`, except also succeeds when no values can be parsed.
// |
// |```purescript
// | parse (many (int segment)) "1/2/3/x" == Right [1,2,3]
// | parse (many (int segment)) "x",      == Right []
// |```
var many = function (dictFoldable) {
    var foldMap1 = Data_Foldable.foldMap(dictFoldable)(Routing_Duplex_Printer.monoidRoutePRinter);
    return function (dictAlternative) {
        var many2 = Routing_Duplex_Parser.many(dictAlternative);
        return function (v) {
            return new RouteDuplex(foldMap1(v.value0), many2(v.value1));
        };
    };
};

// | Consumes or prints the URI hash segment.
// |
// | ```purescript
// | parse hash "abc#def" == Right "def"
// | ```
var hash = /* #__PURE__ */ (function () {
    return new RouteDuplex(Routing_Duplex_Printer.hash, Routing_Duplex_Parser.hash);
})();
var functorRouteDuplex = {
    map: function (f) {
        return function (m) {
            return new RouteDuplex(m.value0, map(f)(m.value1));
        };
    }
};

// | Consumes or prints a query flag (i.e. parameter without value).
// | **Note:** that this combinator ignores the value of the parameter. It only cares about its presence/absence.
// | Presence is interpreted as `true`, absence as `false`.
// |
// |```purescript
// | parse (flag (param "x")) "?x"        == Right true
// | parse (flag (param "x")) "?x=true",  == Right true
// | parse (flag (param "x")) "?x=false", == Right true -- value is ignored, what matters is presence of the parameter x
// | parse (flag (param "x")) "?y",       == Right false
// |```
var flag = function (v) {
    var enc$prime = function (v1) {
        if (v1) {
            return v.value0("");
        };
        return mempty;
    };
    var dec$prime = Routing_Duplex_Parser["default"](false)(voidLeft(v.value1)(true));
    return new RouteDuplex(enc$prime, dec$prime);
};

// | `end codec` will only suceed if `codec` succeeds and there are no
// | additional path segments remaining to be processed.
// |
// |```purescript
// | parse (end segment) "abc" == Right "abc"
// | parse (end segment) "abc/def" == Left (ExpectedEndOfPath "def")
// |```
var end = function (v) {
    return new RouteDuplex(v.value0, applyFirst(v.value1)(Routing_Duplex_Parser.end));
};

// | Sets a default value which will be returned when parsing fails.
// | Does not influence printing in any way.
// |
// |```purescript
// | parse (default 0 $ int segment) "1" == Right 1
// | parse (default 0 $ int segment) "x" == Right 0
// |```
var $$default = function (d) {
    return function (v) {
        return new RouteDuplex(v.value0, Routing_Duplex_Parser["default"](d)(v.value1));
    };
};
var buildParamsNil = {
    buildParams: function (v) {
        return function (v1) {
            return identity;
        };
    }
};
var buildParams = function (dict) {
    return dict.buildParams;
};
var buildParamsCons = function (dictIsSymbol) {
    var prop1 = prop(dictIsSymbol)()()();
    var get = Record.get(dictIsSymbol)();
    var reflectSymbol = Data_Symbol.reflectSymbol(dictIsSymbol);
    return function () {
        return function () {
            return function () {
                return function () {
                    return function (dictRouteDuplexBuildParams) {
                        var buildParams1 = buildParams(dictRouteDuplexBuildParams);
                        return {
                            buildParams: function (v) {
                                return function (r) {
                                    return function (prev) {
                                        return buildParams1(Type_Proxy["Proxy"].value)(r)(prop1(Type_Proxy["Proxy"].value)(get(Type_Proxy["Proxy"].value)(r)(param(reflectSymbol(Type_Proxy["Proxy"].value))))(prev));
                                    };
                                };
                            }
                        };
                    };
                };
            };
        };
    };
};
var routeDuplexParams = function () {
    return function (dictRouteDuplexBuildParams) {
        var buildParams1 = buildParams(dictRouteDuplexBuildParams);
        return {
            params: function (r) {
                return buildParams1(Type_Proxy["Proxy"].value)(r)(record);
            }
        };
    };
};

// | Builds a codec for a custom type out of printer and parser functions.
// |
// |```purescript
// | data Sort = Asc | Desc
// |
// | sortToString :: Sort -> String
// | sortToString = case _ of
// |   Asc -> "asc"
// |   Desc -> "desc"
// |
// | sortFromString :: String -> Either String Sort
// | sortFromString = case _ of
// |   "asc" -> Right Asc
// |   "desc" -> Right Desc
// |   val -> Left $ "Not a sort: " <> val
// |
// | sort :: RouteDuplex' String -> RouteDuplex' Sort
// | sort = as sortToString sortFromString
// |```
var as = function (f) {
    return function (g) {
        return function (v) {
            return new RouteDuplex(function ($142) {
                return v.value0(f($142));
            }, Routing_Duplex_Parser.as(identity)(g)(v.value1));
        };
    };
};

// | Refines a codec of Strings to Booleans, where `true` and `false` are the
// | strings `"true"` and `"false"`, and other strings are rejected.
// |
// | ```purescript
// | parse (boolean segment) "true"  == Right true
// | parse (boolean segment) "x"     == Left (Expected "Boolean" "x")
// |
// | print (boolean segment) true    == "true"
// | ```
var $$boolean = /* #__PURE__ */ as(/* #__PURE__ */ Data_Show.show(Data_Show.showBoolean))(Routing_Duplex_Parser["boolean"]);

// | Refines a codec of Strings to Ints.
// |
// | ```purescript
// | parse (int segment) "1"  == Right 1
// | parse (int segment) "x"  == Left (Expected "Int" "x")
// |
// | print (int segment) 1    == "1"
// | ```
var $$int = /* #__PURE__ */ as(/* #__PURE__ */ Data_Show.show(Data_Show.showInt))(Routing_Duplex_Parser["int"]);
var applyRouteDuplex = {
    apply: function (v) {
        return function (v1) {
            return new RouteDuplex(apply1(map1(append)(v.value0))(v1.value0), apply(v.value1)(v1.value1));
        };
    },
    Functor0: function () {
        return functorRouteDuplex;
    }
};
var applicativeRouteDuplex = {
    pure: /* #__PURE__ */ (function () {
        var $143 = RouteDuplex.create(Data_Function["const"](mempty));
        return function ($144) {
            return $143(pure($144));
        };
    })(),
    Apply0: function () {
        return applyRouteDuplex;
    }
};
export {
    RouteDuplex,
    parse,
    print,
    prefix,
    suffix,
    path,
    root,
    end,
    segment,
    param,
    flag,
    hash,
    many1,
    many,
    rest,
    $$default as default,
    optional,
    as,
    $$int as int,
    $$boolean as boolean,
    string,
    record,
    prop,
    params,
    buildParams,
    functorRouteDuplex,
    applyRouteDuplex,
    applicativeRouteDuplex,
    profunctorRouteDuplex,
    routeDuplexParams,
    buildParamsCons,
    buildParamsNil
};
