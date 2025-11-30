import * as Unsafe_Coerce from "../Unsafe.Coerce/index.js";
var Step = /* #__PURE__ */ (function () {
    function Step(value0, value1, value2, value3) {
        this.value0 = value0;
        this.value1 = value1;
        this.value2 = value2;
        this.value3 = value3;
    };
    Step.create = function (value0) {
        return function (value1) {
            return function (value2) {
                return function (value3) {
                    return new Step(value0, value1, value2, value3);
                };
            };
        };
    };
    return Step;
})();
var unStep = Unsafe_Coerce.unsafeCoerce;

// | Runs the next step.
var step = function (v, a) {
    return v.value2(v.value1, a);
};
var mkStep = Unsafe_Coerce.unsafeCoerce;

// | Runs the finalizer associated with a `Step`
var halt = function (v) {
    return v.value3(v.value1);
};

// | Returns the output value of a `Step`.
var extract = /* #__PURE__ */ unStep(function (v) {
    return v.value0;
});
export {
    Step,
    mkStep,
    unStep,
    extract,
    step,
    halt
};
