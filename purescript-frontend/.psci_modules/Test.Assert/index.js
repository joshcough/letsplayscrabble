import * as $foreign from "./foreign.js";
import * as Control_Applicative from "../Control.Applicative/index.js";
import * as Control_Bind from "../Control.Bind/index.js";
import * as Data_Eq from "../Data.Eq/index.js";
import * as Data_Show from "../Data.Show/index.js";
import * as Effect from "../Effect/index.js";
import * as Effect_Console from "../Effect.Console/index.js";
var unless = /* #__PURE__ */ Control_Applicative.unless(Effect.applicativeEffect);
var bindFlipped = /* #__PURE__ */ Control_Bind.bindFlipped(Effect.bindEffect);

// | Throws a runtime exception with the specified message when the boolean
// | value is false.
var assert$prime = $foreign.assertImpl;

// | Compares the `expected` and `actual` values for equality and throws a
// | runtime exception with the specified message when the values are not equal.
// |
// | The message also indicates the expected value and the actual value.
var assertEqual$prime = function (dictEq) {
    var eq1 = Data_Eq.eq(dictEq);
    return function (dictShow) {
        var show = Data_Show.show(dictShow);
        return function (userMessage) {
            return function (v) {
                var result = eq1(v.actual)(v.expected);
                var message = (function () {
                    var $21 = userMessage === "";
                    if ($21) {
                        return "";
                    };
                    return userMessage + "\x0a";
                })() + ("Expected: " + (show(v.expected) + ("\x0aActual:   " + show(v.actual))));
                return function __do() {
                    unless(result)(Effect_Console.error(message))();
                    return assert$prime(message)(result)();
                };
            };
        };
    };
};
var assertEqual$prime1 = /* #__PURE__ */ assertEqual$prime(Data_Eq.eqBoolean)(Data_Show.showBoolean);

// | Compares the `expected` and `actual` values for equality and
// | throws a runtime exception when the values are not equal.
// |
// | The message indicates the expected value and the actual value.
var assertEqual = function (dictEq) {
    var assertEqual$prime2 = assertEqual$prime(dictEq);
    return function (dictShow) {
        return assertEqual$prime2(dictShow)("");
    };
};
var assertEqual1 = /* #__PURE__ */ assertEqual(Data_Eq.eqBoolean)(Data_Show.showBoolean);

// | Throws a runtime exception when the value is `true`.
// |
// | The message indicates the expected value (`false`)
// | and the actual value (`true`).
var assertFalse = function (actual) {
    return assertEqual1({
        actual: actual,
        expected: false
    });
};

// | Throws a runtime exception when the value is `false`.
// |
// | The message indicates the expected value (`true`)
// | and the actual value (`false`).
var assertTrue = function (actual) {
    return assertEqual1({
        actual: actual,
        expected: true
    });
};

// | Throws a runtime exception with the specified message when the value is
// | `true`.
// |
// | The message also indicates the expected value (`false`)
// | and the actual value (`true`).
var assertFalse$prime = function (message) {
    return function (actual) {
        return assertEqual$prime1(message)({
            actual: actual,
            expected: false
        });
    };
};

// | Throws a runtime exception with the specified message when the value is
// | `false`.
// |
// | The message also indicates the expected value (`true`)
// | and the actual value (`false`).
var assertTrue$prime = function (message) {
    return function (actual) {
        return assertEqual$prime1(message)({
            actual: actual,
            expected: true
        });
    };
};

// | Throws a runtime exception with the specified message, unless the argument
// | throws an exception when evaluated.
// |
// | This function is specifically for testing unsafe pure code; for example,
// | to make sure that an exception is thrown if a precondition is not
// | satisfied. Functions which use `Effect a` can be
// | tested with `catchException` instead.
var assertThrows$prime = function (msg) {
    return function (fn) {
        return bindFlipped(assert$prime(msg))($foreign.checkThrows(fn));
    };
};

// | Throws a runtime exception with message "Assertion failed: An error should
// | have been thrown", unless the argument throws an exception when evaluated.
// |
// | This function is specifically for testing unsafe pure code; for example,
// | to make sure that an exception is thrown if a precondition is not
// | satisfied. Functions which use `Effect a` can be
// | tested with `catchException` instead.
var assertThrows = /* #__PURE__ */ assertThrows$prime("Assertion failed: An error should have been thrown");

// | Throws a runtime exception with message "Assertion failed" when the boolean
// | value is false.
var assert = /* #__PURE__ */ assert$prime("Assertion failed");
export {
    assert,
    assert$prime,
    assertEqual,
    assertEqual$prime,
    assertFalse,
    assertFalse$prime,
    assertThrows,
    assertThrows$prime,
    assertTrue,
    assertTrue$prime
};
