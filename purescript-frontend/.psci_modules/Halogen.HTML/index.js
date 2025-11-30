// | This module re-exports the types for the `HTML` DSL, and values for all
// | supported HTML elements.
import * as Data_Function from "../Data.Function/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Halogen_Component from "../Halogen.Component/index.js";
import * as Halogen_HTML_Core from "../Halogen.HTML.Core/index.js";
import * as Halogen_HTML_Elements from "../Halogen.HTML.Elements/index.js";
import * as Halogen_HTML_Properties from "../Halogen.HTML.Properties/index.js";
import * as Halogen_VDom_Thunk from "../Halogen.VDom.Thunk/index.js";
import * as Unsafe_Coerce from "../Unsafe.Coerce/index.js";
var componentSlot = /* #__PURE__ */ Halogen_Component.componentSlot();
var map = /* #__PURE__ */ Data_Functor.map(Data_Functor.functorFn);

// | Defines a slot for a child component, ignoring its output.
// |
// | This variant may be used when the component produces output, but it is not
// | needed in the current context, or instead of passing `absurd` to `slot`
// | when the output type is `Void`.
// |
// | Takes:
// | - the slot address label
// | - the slot address index
// | - the component for the slot
// | - the input value to pass to the component
var slot_ = function () {
    return function (dictIsSymbol) {
        var componentSlot1 = componentSlot(dictIsSymbol);
        return function (dictOrd) {
            var componentSlot2 = componentSlot1(dictOrd);
            return function (label) {
                return function (p) {
                    return function (component) {
                        return function (input) {
                            return Halogen_HTML_Core.widget(new Halogen_Component.ComponentSlot(componentSlot2(label)(p)(component)(input)(Data_Function["const"](Data_Maybe.Nothing.value))));
                        };
                    };
                };
            };
        };
    };
};

// | Defines a slot for a child component. Takes:
// | - the slot address label
// | - the slot address index
// | - the component for the slot
// | - the input value to pass to the component
// | - a function mapping outputs from the component to a query in the parent
var slot = function () {
    return function (dictIsSymbol) {
        var componentSlot1 = componentSlot(dictIsSymbol);
        return function (dictOrd) {
            var componentSlot2 = componentSlot1(dictOrd);
            return function (label) {
                return function (p) {
                    return function (component) {
                        return function (input) {
                            return function (outputQuery) {
                                return Halogen_HTML_Core.widget(new Halogen_Component.ComponentSlot(componentSlot2(label)(p)(component)(input)(function ($11) {
                                    return Data_Maybe.Just.create(outputQuery($11));
                                })));
                            };
                        };
                    };
                };
            };
        };
    };
};

// | Optimizes rendering of a subtree given an equality predicate. If an argument
// | is deemed equivalent to the previous value, rendering and diffing will be
// | skipped. You should not use this function fully saturated, but instead
// | partially apply it for use within a Component's scope. For example, to skip
// | rendering for equal states, just wrap your `render` function.
// |
// | ```purescript
// | myComponent = component
// |  { render: memoized eq render
// |  , ...
// |  }
// | ```
var memoized = function (eqFn) {
    return function (f) {
        return map(function ($12) {
            return Halogen_HTML_Core.widget(Halogen_Component.ThunkSlot.create($12));
        })(Halogen_VDom_Thunk.thunked(eqFn)(f));
    };
};

// | Like `lazy`, but for a rendering function which takes 3 arguments.
var lazy3 = function (f) {
    return function (a) {
        return function (b) {
            return function (c) {
                return Halogen_HTML_Core.widget(new Halogen_Component.ThunkSlot(Halogen_VDom_Thunk.thunk3(f, a, b, c)));
            };
        };
    };
};

// | Like `lazy`, but for a rendering function which takes 2 arguments.
var lazy2 = function (f) {
    return function (a) {
        return function (b) {
            return Halogen_HTML_Core.widget(new Halogen_Component.ThunkSlot(Halogen_VDom_Thunk.thunk2(f, a, b)));
        };
    };
};

// | Skips rendering for referentially equal arguments. You should not use this
// | function fully saturated, but instead partially apply it for use within a
// | Component's scope.
var lazy = function (f) {
    return function (a) {
        return Halogen_HTML_Core.widget(new Halogen_Component.ThunkSlot(Halogen_VDom_Thunk.thunk1(f, a)));
    };
};

// | Relaxes the type of `PlainHTML` to make it compatible with all `HTML`.
var fromPlainHTML = Unsafe_Coerce.unsafeCoerce;
export {
    fromPlainHTML,
    slot,
    slot_,
    memoized,
    lazy,
    lazy2,
    lazy3
};
export {
    AttrName,
    ClassName,
    ElemName,
    HTML,
    Namespace,
    PropName,
    handler,
    text
} from "../Halogen.HTML.Core/index.js";
export {
    a,
    a_,
    abbr,
    abbr_,
    address,
    address_,
    area,
    article,
    article_,
    aside,
    aside_,
    audio,
    audio_,
    b,
    b_,
    base,
    bdi,
    bdi_,
    bdo,
    bdo_,
    blockquote,
    blockquote_,
    body,
    body_,
    br,
    br_,
    button,
    button_,
    canvas,
    caption,
    caption_,
    cite,
    cite_,
    code,
    code_,
    col,
    colgroup,
    colgroup_,
    command,
    datalist,
    datalist_,
    dd,
    dd_,
    del,
    del_,
    details,
    details_,
    dfn,
    dfn_,
    dialog,
    dialog_,
    div,
    div_,
    dl,
    dl_,
    dt,
    dt_,
    element,
    elementNS,
    em,
    em_,
    embed,
    embed_,
    fieldset,
    fieldset_,
    figcaption,
    figcaption_,
    figure,
    figure_,
    footer,
    footer_,
    form,
    form_,
    h1,
    h1_,
    h2,
    h2_,
    h3,
    h3_,
    h4,
    h4_,
    h5,
    h5_,
    h6,
    h6_,
    head,
    head_,
    header,
    header_,
    hr,
    hr_,
    html,
    html_,
    i,
    i_,
    iframe,
    img,
    input,
    ins,
    ins_,
    kbd,
    kbd_,
    keyed,
    keyedNS,
    label,
    label_,
    legend,
    legend_,
    li,
    li_,
    link,
    main,
    main_,
    map,
    map_,
    mark,
    mark_,
    menu,
    menu_,
    menuitem,
    menuitem_,
    meta,
    meter,
    meter_,
    nav,
    nav_,
    noscript,
    noscript_,
    object,
    object_,
    ol,
    ol_,
    optgroup,
    optgroup_,
    option,
    option_,
    output,
    output_,
    p,
    p_,
    param,
    pre,
    pre_,
    progress,
    progress_,
    q,
    q_,
    rp,
    rp_,
    rt,
    rt_,
    ruby,
    ruby_,
    samp,
    samp_,
    script,
    script_,
    section,
    section_,
    select,
    select_,
    small,
    small_,
    source,
    span,
    span_,
    strong,
    strong_,
    style,
    style_,
    sub,
    sub_,
    summary,
    summary_,
    sup,
    sup_,
    table,
    table_,
    tbody,
    tbody_,
    td,
    td_,
    textarea,
    tfoot,
    tfoot_,
    th,
    th_,
    thead,
    thead_,
    time,
    time_,
    title,
    title_,
    tr,
    tr_,
    track,
    u,
    u_,
    ul,
    ul_,
    var,
    var_,
    video,
    video_,
    wbr,
    withKeys,
    withKeys_
} from "../Halogen.HTML.Elements/index.js";
export {
    attr,
    attrNS,
    prop
} from "../Halogen.HTML.Properties/index.js";
