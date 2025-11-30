// | Standings with player pictures overlay
import * as Component_BaseOverlay from "../Component.BaseOverlay/index.js";
import * as Data_Array from "../Data.Array/index.js";
import * as Data_Boolean from "../Data.Boolean/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Show from "../Data.Show/index.js";
import * as Halogen_Component from "../Halogen.Component/index.js";
import * as Halogen_HTML_Core from "../Halogen.HTML.Core/index.js";
import * as Halogen_HTML_Elements from "../Halogen.HTML.Elements/index.js";
import * as Halogen_HTML_Properties from "../Halogen.HTML.Properties/index.js";
import * as Stats_PlayerStats from "../Stats.PlayerStats/index.js";
import * as Utils_Format from "../Utils.Format/index.js";
import * as Utils_PlayerImage from "../Utils.PlayerImage/index.js";
var show = /* #__PURE__ */ Data_Show.show(Data_Show.showInt);
var getSpreadColor = function (theme) {
    return function (spread) {
        if (spread > 0) {
            return "text-red-600";
        };
        if (spread < 0) {
            return "text-blue-600";
        };
        if (Data_Boolean.otherwise) {
            return theme.colors.textPrimary;
        };
        throw new Error("Failed pattern match at Component.StandingsWithPics (line 127, column 1 - line 127, column 37): " + [ theme.constructor.name, spread.constructor.name ]);
    };
};
var renderPlayer = function (theme) {
    return function (dataUrl) {
        return function (index) {
            return function (player) {
                return Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("flex flex-col items-center") ])([ Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("relative mb-4") ])([ Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("absolute -top-2 -left-2 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-300") ])([ Halogen_HTML_Elements.span([ Halogen_HTML_Properties.class_(theme.colors.textPrimary + " font-black text-lg") ])([ Halogen_HTML_Core.text("#" + show(index + 1 | 0)) ]) ]), Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("w-36 h-36 rounded-2xl overflow-hidden border-2 " + (theme.colors.primaryBorder + (" " + (theme.colors.cardBackground + " shadow-xl")))) ])([ Halogen_HTML_Elements.img([ Halogen_HTML_Properties.src(Utils_PlayerImage.getPlayerImageUrl(dataUrl)(player.photo)(player.xtPhotoUrl)), Halogen_HTML_Properties.alt(player.name), Halogen_HTML_Properties.class_("w-full h-full object-cover") ]) ]) ]), Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_(theme.colors.textPrimary + " text-3xl font-black text-center mb-4 max-w-48 min-h-[4rem] flex items-center justify-center") ])([ Halogen_HTML_Core.text(Utils_Format.formatPlayerName(player.name)) ]), Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_(theme.colors.cardBackground + (" rounded-xl px-6 py-4 border " + (theme.colors.secondaryBorder + " min-h-[6rem] flex flex-col justify-center"))) ])([ Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_(theme.colors.textPrimary + " text-3xl font-black text-center") ])([ Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("mb-2") ])([ Halogen_HTML_Core.text(show(player.wins) + ("-" + (show(player.losses) + (function () {
                    var $11 = player.ties > 0;
                    if ($11) {
                        return "-" + show(player.ties);
                    };
                    return "";
                })()))) ]), Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("text-2xl font-bold " + getSpreadColor(theme)(player.spread)) ])([ Halogen_HTML_Core.text(Utils_Format.formatNumberWithSign(player.spread)) ]) ]) ]) ]);
            };
        };
    };
};
var renderStandingsWithPics = function (state) {
    if (state.tournament instanceof Data_Maybe.Nothing) {
        return Component_BaseOverlay.renderError("No tournament data");
    };
    if (state.tournament instanceof Data_Maybe.Just) {
        var top5 = Data_Array.take(5)(state.players);
        return Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_(state.theme.colors.pageBackground + " min-h-screen flex items-center justify-center p-6") ])([ Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("max-w-7xl w-full") ])([ Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("text-center mb-8") ])([ Halogen_HTML_Elements.h1([ Halogen_HTML_Properties.class_("text-6xl font-black leading-tight mb-4 " + (function () {
            var $13 = state.theme.name === "original";
            if ($13) {
                return state.theme.colors.titleGradient;
            };
            return "text-transparent bg-clip-text " + state.theme.colors.titleGradient;
        })()) ])([ Halogen_HTML_Core.text("Standings") ]), Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("text-3xl font-bold " + state.theme.colors.textSecondary) ])([ Halogen_HTML_Core.text(state.tournament.value0.tournament.name + (" " + (state.tournament.value0.tournament.lexicon + (" \u2022 Division " + state.divisionName)))) ]) ]), Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("flex justify-center items-start gap-6 px-4") ])(Data_Array.mapWithIndex(renderPlayer(state.theme)(state.tournament.value0.tournament.dataUrl))(top5)) ]) ]);
    };
    throw new Error("Failed pattern match at Component.StandingsWithPics (line 50, column 3 - line 81, column 12): " + [ state.tournament.constructor.name ]);
};
var render = function (state) {
    if (state.loading) {
        return Component_BaseOverlay.renderLoading;
    };
    if (state.error instanceof Data_Maybe.Just) {
        return Component_BaseOverlay.renderError(state.error.value0);
    };
    if (state.error instanceof Data_Maybe.Nothing) {
        if (state.tournament instanceof Data_Maybe.Just) {
            return renderStandingsWithPics(state);
        };
        if (state.tournament instanceof Data_Maybe.Nothing) {
            return Component_BaseOverlay.renderError("No tournament data");
        };
        throw new Error("Failed pattern match at Component.StandingsWithPics (line 44, column 16 - line 46, column 62): " + [ state.tournament.constructor.name ]);
    };
    throw new Error("Failed pattern match at Component.StandingsWithPics (line 42, column 8 - line 46, column 62): " + [ state.error.constructor.name ]);
};

// | Standings with pics component
var component = function (dictMonadAff) {
    return Halogen_Component.mkComponent({
        initialState: Component_BaseOverlay.initialState(Stats_PlayerStats.Standings.value),
        render: render,
        "eval": Halogen_Component.mkEval({
            handleQuery: Halogen_Component.defaultEval.handleQuery,
            receive: Halogen_Component.defaultEval.receive,
            handleAction: Component_BaseOverlay.handleAction(dictMonadAff),
            initialize: new Data_Maybe.Just(Component_BaseOverlay.Initialize.value),
            finalize: new Data_Maybe.Just(Component_BaseOverlay.Finalize.value)
        })
    });
};
export {
    component,
    render,
    renderStandingsWithPics,
    renderPlayer,
    getSpreadColor
};
